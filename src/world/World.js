import { CHUNK_WIDTH, CHUNK_HEIGHT } from "./Chunk";
import Chunk from "./Chunk";

class World {

  constructor(scene) {
    // chunks have an oz and ox position that corresponds to the chunk's position in the world
    // at the chunk's origin.
    // store the chunks in a Map where the key is a string like "1-4" where the first number
    // is the x position of the chunk's origin and the 2nd is the z position
    this.chunks = new Map();

    // The main scene that we will add chunks geometry to
    this.scene = scene;
    window.world = this;
  }

  // x and z represent the chunks position in the grid of chunks, not the world
  addNewChunk(x, z) {
    const chunk = new Chunk(x * CHUNK_WIDTH, z * CHUNK_WIDTH);
    chunk.generateBlocks();
    chunk.generateMesh();
    this.setChunk(x, z, chunk);
    this.scene.add(chunk.mesh);
    chunk.mesh.material = this.blockMaterial;
    return chunk;
  }

  getChunkKey(x, z) { 
    return `${x}-${z}`;
  }

  setChunk(x, z, chunk) {
    this.chunks.set(this.getChunkKey(x, z), chunk);
  }

  getChunk(x, z) {
    return this.chunks.get(this.getChunkKey(x, z));
  }


  getBlockId(x, y, z) {
    const chunkX = Math.floor(x / CHUNK_WIDTH);
    const chunkZ = Math.floor(z / CHUNK_WIDTH);

    // console.log('getBlockId in chunk', chunkX, chunkZ);

    const chunk = this.getChunk(chunkX, chunkZ);
    if (!chunk) return 0;
    return chunk.getBlockId(x % CHUNK_WIDTH, y, z % CHUNK_WIDTH);
  }

  solidAt(x, y, z) {
    return this.getBlockId(x, y, z) !== 0;
  }

}

export default World;