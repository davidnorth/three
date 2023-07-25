CHUNK_WIDTH = 16;
CHUNK_HEIGHT = 64;
BLOCKS_PER_CHUNK = CHUNK_WIDTH * CHUNK_WIDTH * CHUNK_HEIGHT;

// the dimensions of the blocks texture map in blocks width and height
const TEXTURE_BLOCKS_WIDTH = 8
const TEXTURE_BLOCKS_HEIGHT = 1
// ...and resulting offset per block in UV space
const unitOffsetX = 1/8
const unitOffsetY = 1

// Define the six possible normal vectors
const faceNormals = {
  up: new THREE.Vector3(0, 1, 0),
  down: new THREE.Vector3(0, -1, 0),
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1)
};

// TODO: Move all this somewhere else
const BLOCK_TEXTURE_UVS = {
  diamondOre: uvsForTextureBlock(0, 0),
  dirt: uvsForTextureBlock(1, 0),
  grassSide: uvsForTextureBlock(2, 0),
  grassTop: uvsForTextureBlock(3, 0),
  ironOre: uvsForTextureBlock(4, 0),
  oakLogSide: uvsForTextureBlock(5, 0),
  oakLogTop: uvsForTextureBlock(6, 0),
  stone: uvsForTextureBlock(7, 0),
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
  }
}

function uvsForTextureBlock(x, y) {
  return [
    x * unitOffsetX, (y+1)*unitOffsetY,
    x * unitOffsetX, y * unitOffsetY,
    (x + 1) * unitOffsetX, y * unitOffsetY,
    (x + 1) * unitOffsetX, (y+1)*unitOffsetY,
  ]
}



class Chunk {

  constructor(ox, oy, oz) {
    this.ox = ox;
    this.oy = oy;
    this.oz = oz;
    this.blocks = new Uint8Array(BLOCKS_PER_CHUNK);
    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geometry, {
      castShadow: true,
      receiveShadow: true,
    });
  }

  // x represents left to right, z forwards and backwards and y up and down
  // chunk is flat array of block ids that represents a 3 dimensional grid of blocks
  // this function takes x, y, z coordinates and returns the index of the block in the chunk array
  getBlockIndex(x, y, z) {
    return x + CHUNK_WIDTH * (y + CHUNK_HEIGHT * z);
  }

  getBlockId(x, y, z) {
    if(x<0 || y<0 || z<0 || x>=CHUNK_WIDTH || y>=CHUNK_HEIGHT || z>=CHUNK_WIDTH){
      return 1;
    }
    return this.blocks[this.getBlockIndex(x, y, z)];
  }

  isNonSolid(blockId){
    // TODO: there will be other non-solid blocks
    return blockId === 0;
  }

  // function to generate the mesh geometry for this chunk
  generateMesh() {
    // TODO: Rename these removing 'Tmp'
    const vertsTmp = [];
    const indicesTmp = [];
    const normalsTmp = [];
    const uvsTmp = [];

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
            // Add verts
            vertsTmp.push(x, y + 1, z); // back left
            vertsTmp.push(x, y + 1, z + 1); // front left
            vertsTmp.push(x + 1, y + 1, z + 1); // front right
            vertsTmp.push(x + 1, y + 1, z); // back right
            // Set face normal up
            for (let i = 0; i < 4; i++) {
              normalsTmp.push(faceNormals.up.x, faceNormals.up.y, faceNormals.up.z);
            }
            // Add UVs
            Array.prototype.push.apply(uvsTmp, BLOCK_ID_TEXTURES[blockId].top);
            // Add tris
            indicesTmp.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indicesTmp.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Back face
          if (this.isNonSolid(this.getBlockId(x, y, z - 1))) {
            // Add verts
            vertsTmp.push(x + 1, y + 1, z); // top right
            vertsTmp.push(x + 1, y, z); // bottom right
            vertsTmp.push(x, y, z); // bottom left
            vertsTmp.push(x, y + 1, z); // top left
            // Set face normal front
            for (let i = 0; i < 4; i++) {
              normalsTmp.push(faceNormals.back.x, faceNormals.back.y, faceNormals.back.z);
            }
            // Add UVs
            Array.prototype.push.apply(uvsTmp, BLOCK_ID_TEXTURES[blockId].side);
            // Add tris
            indicesTmp.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indicesTmp.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Front face
          if (this.isNonSolid(this.getBlockId(x, y, z + 1))) {
            // Add verts
            vertsTmp.push(x, y + 1, z + 1); // top left
            vertsTmp.push(x, y, z + 1); // bottom left
            vertsTmp.push(x + 1, y, z + 1); // bottom right
            vertsTmp.push(x + 1, y + 1, z + 1); // top right
            // Set face normal front
            for (let i = 0; i < 4; i++) {
              normalsTmp.push(faceNormals.front.x, faceNormals.front.y, faceNormals.front.z);
            }
            // Add UVs
            Array.prototype.push.apply(uvsTmp, BLOCK_ID_TEXTURES[blockId].side);
            // Add tris
            indicesTmp.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indicesTmp.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Left face
          if (this.isNonSolid(this.getBlockId(x - 1, y, z))) {
            // Add verts
            vertsTmp.push(x, y + 1, z); // top front
            vertsTmp.push(x, y, z); // bottom front
            vertsTmp.push(x, y, z + 1); // bottom back
            vertsTmp.push(x, y + 1, z + 1); // top back
            // Set face normal left
            for (let i = 0; i < 4; i++) {
              normalsTmp.push(faceNormals.left.x, faceNormals.left.y, faceNormals.left.z);
            }
            // Add UVs
            Array.prototype.push.apply(uvsTmp, BLOCK_ID_TEXTURES[blockId].side);
            // Add tris
            indicesTmp.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indicesTmp.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Right face
          if (this.isNonSolid(this.getBlockId(x + 1, y, z))) {
            // Add verts
            vertsTmp.push(x + 1, y + 1, z + 1); // top back
            vertsTmp.push(x + 1, y, z + 1); // bottom back
            vertsTmp.push(x + 1, y, z); // bottom front
            vertsTmp.push(x + 1, y + 1, z); // top front
            // Set face normal right
            for (let i = 0; i < 4; i++) {
              normalsTmp.push(faceNormals.right.x, faceNormals.right.y, faceNormals.right.z);
            }
            // Add UVs
            Array.prototype.push.apply(uvsTmp, BLOCK_ID_TEXTURES[blockId].side);
            // Add tris
            indicesTmp.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indicesTmp.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }

          // Bottom face
          if (this.isNonSolid(this.getBlockId(x, y - 1, z))) {
            // Add verts
            vertsTmp.push(x, y, z); // front left
            vertsTmp.push(x + 1, y, z); // front right
            vertsTmp.push(x + 1, y, z + 1); // back right
            vertsTmp.push(x, y, z + 1); // back left
            // Set face normal down
            for (let i = 0; i < 4; i++) {
              normalsTmp.push(faceNormals.down.x, faceNormals.down.y, faceNormals.down.z);
            }
            // Add UVs
            Array.prototype.push.apply(uvsTmp, BLOCK_ID_TEXTURES[blockId].bottom);
            // Add tris
            indicesTmp.push(vertIndex, vertIndex + 1, vertIndex + 2);
            indicesTmp.push(vertIndex, vertIndex + 2, vertIndex + 3);
            vertIndex += 4;
          }



        }
      }
    }

    // geometry holds all faces for a chunk
    // Assign the vertex, index, and UV data to the geometry
    this.geometry.dispose();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertsTmp), 3));
    this.geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indicesTmp), 1));
    this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalsTmp, 3));
    this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvsTmp, 2));

  }



}
