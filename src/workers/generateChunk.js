import {generate} from '../world/generator';
import { CHUNK_WIDTH, CHUNK_HEIGHT } from '../world/Chunk';

function getBlockIndex(x, y, z) {
  const WIDTH = CHUNK_WIDTH + 2;
  // layer size * y + row size + z + x
  return (y*WIDTH*WIDTH) + (WIDTH*(z+1)) + (x+1)
}

const bufferSize = (CHUNK_WIDTH + 2) * (CHUNK_WIDTH + 2) * CHUNK_HEIGHT

self.onmessage = function({data: {key, x, z}}) {

  const buffer = new ArrayBuffer(bufferSize);
  const uint8View = new Uint8Array(buffer);

  for (let by = 0; by < CHUNK_HEIGHT; by++) {
    for (let bz = -1; bz < CHUNK_WIDTH+1; bz++) {
      for (let bx = -1; bx < CHUNK_WIDTH+1; bx++) {
        const blockId = generate(x + bx, by, z + bz);
        const index = getBlockIndex(bx, by, bz);
        uint8View[index] = blockId;
      }
    }
  }

  console.log('chunk complete', key )
  self.postMessage({key, buffer}, [buffer]);
};