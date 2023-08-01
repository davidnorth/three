
import perlin from 'perlin';
const noise = perlin.noise.simplex2;
const noise3 = perlin.noise.perlin3;


const GROUND_LEVEL = 8;

const NOISE_SCALE_1 = 0.006;
const NOISE_SCALE_2 = 0.045;
const NOISE_SCALE_3 = 0.03;
const NOISE_SCALE_4 = 0.1;

export function generate(x,y,z) {
  return simpleHeightmap(x,y,z)

  let  thresh = 0.2;


  let block
  if(y === 60) {
    block = 1;
  } else {
    block = y > 50 ? 2 : 3;
  }

  let value  = noise3(x * NOISE_SCALE_3, y * NOISE_SCALE_3, z * NOISE_SCALE_3);
  let value2 = noise3(x * NOISE_SCALE_4, y * NOISE_SCALE_4, z * NOISE_SCALE_4);

  if(y>30) return 0;
  return (value) > thresh ? block : 0;




  // let value = noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1);
  return (y > GROUND_LEVEL + value * 10) ? 0 : 1;

  if((x % 10 === 0 || z % 10 === 0) && y === 9) {
    return 1;
  }

  return y>8 ? 0 : 1;
  // return value > 0 ? 2 : 0;
}

function simpleHeightmap(x,y,z) {

  let elevationScale = (noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) +1 ) * 0.5;
  elevationScale = Math.pow(elevationScale, 2);

  // let groundHeight = noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) * 4 + GROUND_LEVEL;
  let noise1 = (noise(x * NOISE_SCALE_2, z * NOISE_SCALE_2) + 1 ) * 0.5
  
  let scaledNoise1 = noise1 * elevationScale * 30;

  
  let groundHeight = GROUND_LEVEL + scaledNoise1;



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