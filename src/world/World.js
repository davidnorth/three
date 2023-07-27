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
  }

  addNewChunk(x, z) {
    const chunk = new Chunk(x, z);
    // TODO: do this async in a worker
    chunk.generateBlocks();
    chunk.generateMesh();
    this.chunks.set(this.getChunkKey(x, z), chunk);
    this.scene.add(chunk.mesh);
    chunk.mesh.material = this.blockMaterial;
    return chunk;
  }

  getChunkKey(x, z) { 
    return `${x}-${z}`;
  }


  // determine which chunk this block is in
  getBlockId(x, y, z) {
    const chunkX = Math.floor(x / CHUNK_WIDTH);
    const chunkZ = Math.floor(z / CHUNK_WIDTH);
    const chunk = this.chunks.get((this.getChunkKey(chunkX, chunkZ)));
    if (!chunk) return 0;
    return chunk.getBlockId(x % CHUNK_WIDTH, y, z % CHUNK_WIDTH);
  }

  solidAt(x, y, z) {

  }



}

export default World;