import * as THREE from 'three';
import { generate } from './generator.js'

export const CHUNK_WIDTH = 16;
export const CHUNK_HEIGHT = 64;

// the dimensions of the blocks texture map in blocks width and height
const TEXTURE_BLOCKS_WIDTH = 19
const TEXTURE_BLOCKS_HEIGHT = 19
// ...and resulting offset per block in UV space
const unitOffsetX = 1/TEXTURE_BLOCKS_WIDTH
const unitOffsetY = 1/TEXTURE_BLOCKS_HEIGHT

// Face normal directions (see shaders.js)
const NORMAL_LEFT = 0;
const NORMAL_RIGHT = 1;
const NORMAL_BACK = 2;
const NORMAL_FRONT = 3;
const NORMAL_TOP = 4;
const NORMAL_BOTTOM = 5;


// TODO: Move all this somewhere else
const BLOCK_TEXTURE_UVS = {
  diamondOre: uvsForTextureBlock(1, 0),
  dirt: uvsForTextureBlock(1, 0),
  grassSide: uvsForTextureBlock(16, 11),
  grassTop: uvsForTextureBlock(1, 10),
  ironOre: uvsForTextureBlock(1, 0),
  stone: uvsForTextureBlock(8, 18),
  oakLogSide: uvsForTextureBlock(9, 6),
  oakLogTop: uvsForTextureBlock(10, 6),
  oakLeaves: uvsForTextureBlock(5, 8),
}

const BLOCK_ID_TEXTURES = {
  1: {
    side: BLOCK_TEXTURE_UVS.grassSide,
    top: BLOCK_TEXTURE_UVS.grassTop,
    bottom: BLOCK_TEXTURE_UVS.dirt,
  },
  2: {
    side: BLOCK_TEXTURE_UVS.dirt,
    top: BLOCK_TEXTURE_UVS.dirt,
    bottom: BLOCK_TEXTURE_UVS.dirt,
  },
  3: {
    side: BLOCK_TEXTURE_UVS.stone,
    top: BLOCK_TEXTURE_UVS.stone,
    bottom: BLOCK_TEXTURE_UVS.stone,
  },
  4: {
    side: BLOCK_TEXTURE_UVS.oakLogSide,
    top: BLOCK_TEXTURE_UVS.oakLogTop,
    bottom: BLOCK_TEXTURE_UVS.oakLogTop,
  },
  5: {
    side: BLOCK_TEXTURE_UVS.oakLeaves,
    top: BLOCK_TEXTURE_UVS.oakLeaves,
    bottom: BLOCK_TEXTURE_UVS.oakLeaves,
  },
}

function uvsForTextureBlock(x, y) {
  return [
    x * unitOffsetX, (y+1)*unitOffsetY,
    x * unitOffsetX, y * unitOffsetY,
    (x + 1) * unitOffsetX, y * unitOffsetY,
    (x + 1) * unitOffsetX, (y+1)*unitOffsetY,
  ]
}


const CHUNK_STATES = [
  'new',
  'terrainGenerated',
  'decorationMerged',
]
class Chunk {

  // ox and oz are the chunk's origin in world space
  constructor(ox, oz) {
    this.state = 0;
    this.ox = ox;
    this.oz = oz;
    // Extra margin of blocks in x and z
    this.blocks = new Uint8Array((CHUNK_WIDTH+2) * (CHUNK_WIDTH+2) * CHUNK_HEIGHT);
    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geometry);
    this.mesh.enableRaycast = true;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.x = ox;
    this.mesh.position.z = oz;
    this.mesh.position.y = 0;

    // can override this to perform selective culling after we split chunks into multiple meshes
    this.mesh.visible = true;

    const center = new THREE.Vector3(0, CHUNK_HEIGHT * 0.5, 0);
    this.mesh.boundingSphere = new THREE.Sphere(center, 20);  
  }

  // x represents left to right, z forwards and backwards and y up and down
  // chunk is flat array of block ids that represents a 3 dimensional grid of blocks
  // this function takes x, y, z coordinates and returns the index of the block in the chunk array
  // there is an extra margin of blocks in x and z dimensions hence the CHUNK_WIDTH+2
  // so asking for block x=0, y=0, z=0 will return the at y=0 but inset by 1 block in x and z
  getBlockIndex(x, y, z) {
    const WIDTH = CHUNK_WIDTH + 2;
    // layer size * y + row size + z + x
    return (y*WIDTH*WIDTH) + (WIDTH*(z+1)) + (x+1)
  }

  getBlockId(x, y, z) {
    if(y>= CHUNK_HEIGHT) {
      return 0;
    }
    if(x<-1 || y<0 || z<-1 || x>=CHUNK_WIDTH+1 || z>=CHUNK_WIDTH+1){
      return 1;
    }
    return this.blocks[this.getBlockIndex(x, y, z)];
  }

  isNonSolid(blockId){
    // TODO: there will be other non-solid blocks
    return blockId === 0;
  }
  isSolid(blockId){
    // TODO: there will be other non-solid blocks
    return blockId >  0 ? 1 : 0;
  }
  solidAt(x, y, z){
    return this.getBlockId(x, y, z) > 0 ? 1 : 0;
  }

  dispose() {
    this.geometry.dispose()
  }

  setBlock(x, y, z, blockId) {
    this.blocks[this.getBlockIndex(x, y, z)] = blockId;
    this.generateMesh();
  }

  generateMesh() {
    this.geometry.dispose();
    const verts = [];
    const indices = [];
    const normals = [];
    const uvs = [];
    const lightValues = [];
    const norms = [];

    let vertIndex = 0;

    // iterate through each block in the chunk
    for (let x = 0; x < CHUNK_WIDTH; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_WIDTH; z++) {

          // get the block id of the current block
          const blockId = this.getBlockId(x, y, z);

          // skip this iteration for non-solid block
          if(this.isNonSolid(blockId)) continue;

          // Top face
          if (this.isNonSolid(this.getBlockId(x, y + 1, z))) {
            // Normal direction
            norms.push(NORMAL_TOP);

            // Add verts
            verts.push(x, y + 1, z); // back left
            verts.push(x, y + 1, z + 1); // front left
            verts.push(x + 1, y + 1, z + 1); // front right
            verts.push(x + 1, y + 1, z); // back right


            // Vertex lighting
            // back left
            const vl1 = this.vertexAO(
              this.solidAt(x, y + 1, z - 1),
              this.solidAt(x - 1, y + 1, z),
              this.solidAt(x - 1, y + 1, z - 1)
            );
            // front left
            const vl2 = this.vertexAO(
              this.solidAt(x, y + 1, z + 1),
              this.solidAt(x - 1, y + 1, z),
              this.solidAt(x - 1, y + 1, z + 1)
            );
            // front right
            const vl3 = this.vertexAO(
              this.solidAt(x, y + 1, z + 1),
              this.solidAt(x + 1, y + 1, z),
              this.solidAt(x + 1, y + 1, z + 1)
            );
            // back right
            const vl4 = this.vertexAO(
              this.solidAt(x, y + 1, z - 1),
              this.solidAt(x + 1, y + 1, z),
              this.solidAt(x + 1, y + 1, z - 1)
            );
            lightValues.push(vl1, vl2, vl3, vl4);


            // Add UVs
            Array.prototype.push.apply(uvs, BLOCK_ID_TEXTURES[blockId].top);
            // Add tris
            indices.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indices.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Back face
          if (this.isNonSolid(this.getBlockId(x, y, z - 1))) {
            // Normal direction
            norms.push(NORMAL_BACK);

            // Add verts
            verts.push(x + 1, y + 1, z); // top right
            verts.push(x + 1, y, z); // bottom right
            verts.push(x, y, z); // bottom left
            verts.push(x, y + 1, z); // top left
            // Vertex lighting

            // Vertex lighting
            // top right
            const vl1 = this.vertexAO(
              this.solidAt(x+1, y , z-1),
              this.solidAt(x, y+1, z-1),
              this.solidAt(x + 1, y + 1, z-1)
            );
            // bottom right
            const vl2 = this.vertexAO(
              this.solidAt(x+1, y, z-1),
              this.solidAt(x, y-1, z-1),
              this.solidAt(x, y-1, z-1)
            );
            // bottom left
            const vl3 = this.vertexAO(
              this.solidAt(x, y-1, z-1),
              this.solidAt(x-1, y, z-1),
              this.solidAt(x-1, y-1, z-1)
            );
            // top left
            const vl4 = this.vertexAO(
              this.solidAt(x, y+1 , z-1),
              this.solidAt(x-1, y , z-1),
              this.solidAt(x-1, y+1 , z-1)
            );
            lightValues.push(vl1, vl2, vl3, vl4);


            // Add UVs
            Array.prototype.push.apply(uvs, BLOCK_ID_TEXTURES[blockId].side);
            // Add tris
            indices.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indices.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Front face
          if (this.isNonSolid(this.getBlockId(x, y, z + 1))) {
            // Normal direction
            norms.push(NORMAL_FRONT);

            // Add verts
            verts.push(x, y + 1, z + 1); // top left
            verts.push(x, y, z + 1); // bottom left
            verts.push(x + 1, y, z + 1); // bottom right
            verts.push(x + 1, y + 1, z + 1); // top right
            // Vertex lighting

            // Vertex lighting
            // top left
            const vl1 = this.vertexAO(
              this.solidAt(x-1, y+1 , z+1),
              this.solidAt(x, y, z+1),
              this.solidAt(x-1, y, z+1)
            );
            // bottom left
            const vl2 = this.vertexAO(
              this.solidAt(x, y-1, z+1),
              this.solidAt(x-1, y, z+1),
              this.solidAt(x-1, y-1, z+1)
            );
            // bottom right
            const vl3 = this.vertexAO(
              this.solidAt(x+1, y, z+1),
              this.solidAt(x, y-1, z+1),
              this.solidAt(x, y-1, z+1)
            );
            // top right
            const vl4 = this.vertexAO(
              this.solidAt(x+1, y , z+1),
              this.solidAt(x, y+1 , z+1),
              this.solidAt(x, y , z+1)
            );
            lightValues.push(vl1, vl2, vl3, vl4);


            // Add UVs
            Array.prototype.push.apply(uvs, BLOCK_ID_TEXTURES[blockId].side);
            // Add tris
            indices.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indices.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Left face
          if (this.isNonSolid(this.getBlockId(x - 1, y, z))) {
            // Normal direction
            norms.push(NORMAL_LEFT);

            // Add verts
            verts.push(x, y + 1, z); // top back
            verts.push(x, y, z); // bottom back
            verts.push(x, y, z + 1); // bottom front
            verts.push(x, y + 1, z + 1); // top front
            // Vertex lighting

            // top back
            const vl1 = this.vertexAO(
              this.solidAt(x-1, y+1 , z),
              this.solidAt(x-1, y, z-1),
              this.solidAt(x-1, y+1 , z-1)
            );
            // bottom back
            const vl2 = this.vertexAO(
              this.solidAt(x-1, y, z-1),
              this.solidAt(x-1, y-1, z),
              this.solidAt(x-1, y-1, z-1)
            );
            // bottom front
            const vl3 = this.vertexAO(
              this.solidAt(x-1, y, z+1),
              this.solidAt(x-1, y-1, z),
              this.solidAt(x-1, y, z+1)
            );
            // top front
            const vl4 = this.vertexAO(
              this.solidAt(x-1, y+1 , z),
              this.solidAt(x-1, y , z+1),
              this.solidAt(x-1, y , z)
            );
            lightValues.push(vl1, vl2, vl3, vl4);


            // Add UVs
            Array.prototype.push.apply(uvs, BLOCK_ID_TEXTURES[blockId].side);
            // Add tris
            indices.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indices.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Right face
          if (this.isNonSolid(this.getBlockId(x + 1, y, z))) {
            // Normal direction
            norms.push(NORMAL_RIGHT);

            // Add verts
            verts.push(x + 1, y + 1, z + 1); // top front
            verts.push(x + 1, y, z + 1); // bottom front
            verts.push(x + 1, y, z); // bottom back
            verts.push(x + 1, y + 1, z); // top back
            // Vertex lighting
            // top front
            const vl1 = this.vertexAO(
              this.solidAt(x+1, y , z+1),
              this.solidAt(x+1, y+1, z),
              this.solidAt(x+1, y , z)
            );
            // bottom front
            const vl2 = this.vertexAO(
              this.solidAt(x+1, y, z+1),
              this.solidAt(x+1, y-1, z),
              this.solidAt(x+1, y-1, z+1)
            );
            // bottom back
            const vl3 = this.vertexAO(
              this.solidAt(x+1, y, z-1),
              this.solidAt(x+1, y-1, z),
              this.solidAt(x+1, y-1, z-1)
            );
            // top back
            const vl4 = this.vertexAO(
              this.solidAt(x+1, y , z+1),
              this.solidAt(x+1, y+1 , z),
              this.solidAt(x+1, y+1 , z-1)
            );
            lightValues.push(vl1, vl2, vl3, vl4);


            // Add UVs
            Array.prototype.push.apply(uvs, BLOCK_ID_TEXTURES[blockId].side);
            // Add tris
            indices.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indices.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Bottom face
          if (this.isNonSolid(this.getBlockId(x, y - 1, z))) {
            // Normal direction
            norms.push(NORMAL_BOTTOM);

            // Add verts
            verts.push(x, y, z); // front left
            verts.push(x + 1, y, z); // front right
            verts.push(x + 1, y, z + 1); // back right
            verts.push(x, y, z + 1); // back left
            // Vertex lighting
            lightValues.push(1,1,1,1);


            // Add UVs
            Array.prototype.push.apply(uvs, BLOCK_ID_TEXTURES[blockId].bottom);
            // Add tris
            indices.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indices.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

        }
      }
    }



    const packedVertData = new Uint32Array(verts.length / 3);
    for(let i = 0; i<verts.length; i += 3) {
      // Vert position, xyz 5 6 and 5 bits (chunk is taller than wide)
      const x = (verts[i] ) << 11;
      const y = (verts[i+1] ) << 5;
      const z = (verts[i+2] );

      // AO light value - 2 bits
      const ao = lightValues[i / 3] << 16

      // Normal direction - 0-5 - 3 bits
      const n = norms[ Math.floor((i/3) / 4)  ] << 18
      
      packedVertData[i / 3] = n | ao | x | y | z;
    }



    // geometry holds all faces for a chunk
    // Assign the vertex, index, and UV data to the geometry
    this.geometry.dispose();
    // Theory: dummy position data fixes frustrum culling by defining a bounding box
    this.geometry.setAttribute('packed', new THREE.BufferAttribute(packedVertData, 1));
    this.geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }


  // Let side1 and side2 be 0/1 depending on the presence of the side voxels 
  // and let corner be the opacity state of the corner voxel.  
  // Then we can compute the ambient occlusion of a vertex using the following function:
  vertexAO(side1, side2, corner) {
    if (side1 && side2) {
      return 0
    }
    return 3 - (side1 + side2 + corner)
  }



}


export default Chunk;