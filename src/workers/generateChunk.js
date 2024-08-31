import {generate} from '../world/generator';
import { CHUNK_WIDTH, CHUNK_HEIGHT } from '../world/Chunk';

const DECORATION_MARGIN = 4;
const bufferSize = (CHUNK_WIDTH + 2) * (CHUNK_WIDTH + 2) * CHUNK_HEIGHT
const decorationBufferSize = (CHUNK_WIDTH + DECORATION_MARGIN) * (CHUNK_WIDTH + DECORATION_MARGIN) * CHUNK_HEIGHT


// default margin allows correct meshing. we need to know what blocks just outside
// the chunk are for the air boundary check.
// Larger margin used for decoration pass
function getBlockIndex(x, y, z, margin = 1) {
  const WIDTH = CHUNK_WIDTH + margin * 2;
  return (y*WIDTH*WIDTH) + (WIDTH*(z+margin)) + (x+margin)

}


self.onmessage = function({data: {key, x, z}}) {

  const bufferMain = new ArrayBuffer(bufferSize);
  const viewMain = new Uint8Array(bufferMain);

  const bufferDecoration = new ArrayBuffer(decorationBufferSize);
  const viewDecoration = new Uint8Array(bufferDecoration);




  for (let by = 0; by < CHUNK_HEIGHT; by++) {
    for (let bz = -1; bz < CHUNK_WIDTH+1; bz++) {
      for (let bx = -1; bx < CHUNK_WIDTH+1; bx++) {
        const blockId = generate(x + bx, by, z + bz);
        const index = getBlockIndex(bx, by, bz);
        viewMain[index] = blockId;
      }
    }
  }


  let trunkHeight = 7;
  let canopySize = 3;
  let oX = 1;
  let oZ = 1;
  let oY = 0;
  // find ground surface
  for(let y = CHUNK_HEIGHT - 1; y > -1; y--) {
    let blockId = viewMain[getBlockIndex(oX, y, oZ)]
    if (blockId > 0) {
      oY = y + 1; // air block above ground
      break
    }
  }
  // fill in trunk
  for(let y = oY; y < oY + trunkHeight; y++) {
    const index = getBlockIndex(oX, y, oZ, DECORATION_MARGIN);
    viewDecoration[index] = 4;
  }
  // fill in leaf canopy, size canopySize cube on top of trunk
  for(let y = oY + trunkHeight; y < oY + trunkHeight + canopySize * 2; y++) {
    for(let z = -canopySize; z < canopySize; z++) {
      for(let x = -canopySize; x < canopySize; x++) {
        const index = getBlockIndex(oX + x, y, oZ + z, DECORATION_MARGIN);
        viewDecoration[index] = 5;
      }
    }
  }


  // merge in the decoration layer into the main buffer
  // for (let by = 0; by < CHUNK_HEIGHT; by++) {
  //   for (let bz = -1; bz < CHUNK_WIDTH+1; bz++) {
  //     for (let bx = -1; bx < CHUNK_WIDTH+1; bx++) {
        
  //       const indexDecoration = getBlockIndex(bx, by, bz, DECORATION_MARGIN);
  //       const indexMain = getBlockIndex(bx, by, bz);

  //       const decorationBlockId = viewDecoration[indexDecoration];
  //       if(decorationBlockId > 0) {
  //         // overwrite terrain with any non-air block from decoration layer
  //         viewMain[indexMain] = decorationBlockId;
  //       }

  //     }
  //   }
  // }




  self.postMessage({key, buffer: bufferMain, bufferDecoration: bufferDecoration}, [bufferMain, bufferDecoration]);
};