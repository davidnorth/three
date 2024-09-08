
import perlin from 'perlin';
const noise = perlin.noise.simplex2;
const noise3 = perlin.noise.perlin3;


const GROUND_LEVEL = 52;;

const NOISE_SCALE_1 = 0.06;
const NOISE_SCALE_2 = 0.024;
const NOISE_SCALE_3 = 0.005
const NOISE_SCALE_4 = 0.1;

function fractalNoise(x, z, amplitude = 1, scale = 1) {
  let value = 0;
  for(let i=0; i<4; i++) {
    value += noise(x * scale, z * scale) * amplitude;
    amplitude *= 0.5;
    scale *= 2;
  }
  return value;
}

export function generate(x,y,z) {

  // if(y > GROUND_LEVEL) {
  //   return 0;
  // }
  // if(x % 16 === 0 && z % 16 === 0) {
  //    return 3;
  // }

  // return 1;

  if(y > GROUND_LEVEL) return 0;


  let r = (noise3(x * NOISE_SCALE_1, y * NOISE_SCALE_1, z * NOISE_SCALE_1) +1 ) * 1;
  r *= (noise3(x * NOISE_SCALE_2, y * NOISE_SCALE_2, z * NOISE_SCALE_2) +1 ) * 1;

  r *= (y/16);

  //let elevationScale = (noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) +1 ) * 1;
  //elevationScale = Math.pow(elevationScale, 2);

  //const value = GROUND_LEVEL + fractalNoise(x, z, 10, 0.01);


  let groundBlock = y < 19 ? 3 : 1;
  return r > 0.9 ? 0 : groundBlock;


  // return simpleHeightmap(x,y,z)
}

function simpleHeightmap(x,y,z) {

  let elevationScale = (noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) +1 ) * 0.5;
  elevationScale = Math.pow(elevationScale, 2);

  // let groundHeight = noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) * 4 + GROUND_LEVEL;
  let noise1 = (noise(x * NOISE_SCALE_2, z * NOISE_SCALE_2) + 1 ) * 0.5
  
  let scaledNoise1 = noise1 * elevationScale * 40;

  
  let groundHeight = GROUND_LEVEL + scaledNoise1;

  groundHeight = groundHeight + noise(x * NOISE_SCALE_3, z * NOISE_SCALE_3) * 10;



  // groundHeight +=  noise(x * NOISE_SCALE_2, z * NOISE_SCALE_2) * 2;

  let mountain = y>(7 * noise1)+10;

  // air
  if (y > groundHeight) return 0;
  // grass
  if (y > groundHeight-1) return mountain ? 3 : 1;
  // dirt
  if (y > groundHeight-4) return mountain ? 3 : 2;
  // stone
  return 3;
}