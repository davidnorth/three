import * as THREE from 'three';
import { CHUNK_WIDTH } from "./Chunk";
import WorkerPool from '../workers/WorkerPool';
import Chunk from "./Chunk";

RENDER_DISTANCE = 12;

// move to Math module
function mod(n, m) {
  return ((n % m) + m) % m;
}

class World {

  constructor(scene) {
    // chunks have an oz and ox position that corresponds to the chunk's position in the world
    // at the chunk's origin.
    // store the chunks in a Map where the key is a string like "1-4" where the first number
    // is the x position of the chunk's origin and the 2nd is the z position
    this.chunks = new Map();

    this.chunkGenerationWorkerPool = new WorkerPool(
      'generateChunk.js',
      window.navigator.hardwareConcurrency - 1,
      ({data: {key, buffer}}) => {
        const chunk = this.chunks.get(key);
        chunk.blocks = new Uint8Array(buffer);
        chunk.generateMesh();
        chunk.mesh.material = this.blockMaterial;
        this.scene.add(chunk.mesh);
      }
    );


    // The main scene that we will add chunks geometry to
    this.scene = scene;
    window.world = this;
  }

  // x and z represent the chunks position in the grid of chunks, not the world
  addNewChunk(x, z) {
    const chunk = new Chunk(x * CHUNK_WIDTH, z * CHUNK_WIDTH);
    this.setChunk(x, z, chunk);
    this.chunkGenerationWorkerPool.postMessage({ key: this.getChunkKey(x, z), x: chunk.ox, z: chunk.oz })
  }

  getChunkKey(x, z) { 
    return `${x}:${z}`;
  }

  setChunk(x, z, chunk) {
    this.chunks.set(this.getChunkKey(x, z), chunk);
  }

  removeChunk(x, z) {
    const chunk = this.getChunk(x, z);
    this.scene.remove(chunk.mesh);
    chunk.dispose();
    this.chunks.delete(this.getChunkKey(x, z));
  }

  getChunk(x, z) {
    return this.chunks.get(this.getChunkKey(x, z));
  }

  // For coliision detection purposes
  getBlockBox(x, y, z) {
    return new THREE.Box3(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(x + 1, y + 1, z + 1)
    )
  }

  // Get id of a block at world coordinates
  getBlockId(x, y, z) {
    const chunkX = Math.floor(x / CHUNK_WIDTH);
    const chunkZ = Math.floor(z / CHUNK_WIDTH);


    const chunk = this.getChunk(chunkX, chunkZ);
    if (!chunk) return 0;
    // world coordinates to chunk coordinates
    return chunk.getBlockId(mod(x, CHUNK_WIDTH), y, mod(z, CHUNK_WIDTH));
  }

  setBlock(x, y, z, id) {
    console.log('setBlock', x, y, z, id);
    // first find the chunk containing this block
    const chunkX = Math.floor(x / CHUNK_WIDTH);
    const chunkZ = Math.floor(z / CHUNK_WIDTH);
    const chunk = this.getChunk(chunkX, chunkZ);
    console.log('chunk', chunkX, chunkZ);
    if (!chunk) return;
    // world coordinates to chunk coordinates
    chunk.setBlock(mod(x, CHUNK_WIDTH), y, mod(z, CHUNK_WIDTH), id);
  }

  solidAt(x, y, z) {
    return this.getBlockId(x, y, z) !== 0;
  }

  updateLoadedChunks(playerPosition) {
    const playerChunkX = Math.floor(playerPosition.x / CHUNK_WIDTH);
    const playerChunkZ = Math.floor(playerPosition.z / CHUNK_WIDTH);

    // check which chunks need to be removed
    for(let [key, chunk] of this.chunks) {
      const [x, z] = key.split(':').map(Number);
      if(Math.abs(x - playerChunkX) > RENDER_DISTANCE || Math.abs(z - playerChunkZ) > RENDER_DISTANCE) {
        this.removeChunk(x, z);
      }
    }

    for(let x = playerChunkX - RENDER_DISTANCE; x < playerChunkX + RENDER_DISTANCE; x++) {
      for(let z = playerChunkZ - RENDER_DISTANCE; z < playerChunkZ + RENDER_DISTANCE; z++) {
        if(!this.getChunk(x, z)) {
          this.addNewChunk(x, z);
        }
      }
    }




  }

}

export default World;