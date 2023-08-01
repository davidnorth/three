var Simplex = require('perlin-simplex')
var simplex = new Simplex()


const GROUND_LEVEL = 8;

NOISE_SCALE_1 = 0.006;
NOISE_SCALE_2 = 0.045;

export function generate(x,y,z) {
  return simpleHeightmap(x,y,z)

  if((x % 10 === 0 || z % 10 === 0) && y === 9) {
    return 1;
  }

  return y>8 ? 0 : 1;
  // return value > 0 ? 2 : 0;
}

window.noise = simplex.noise;

function simpleHeightmap(x,y,z) {

  let elevationScale = (simplex.noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) +1 ) * 0.5;
  elevationScale = Math.pow(elevationScale, 2);

  // let groundHeight = simplex.noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) * 4 + GROUND_LEVEL;
  let noise1 = (simplex.noise(x * NOISE_SCALE_2, z * NOISE_SCALE_2) + 1 ) * 0.5
  
  let scaledNoise1 = noise1 * elevationScale * 30;

  
  let groundHeight = GROUND_LEVEL + scaledNoise1;



  // groundHeight +=  simplex.noise(x * NOISE_SCALE_2, z * NOISE_SCALE_2) * 2;

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