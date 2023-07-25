import Simplex from 'perlin-simplex'
const simplex = new Simplex()


const GROUND_LEVEL = 32;

NOISE_SCALE_1 = 0.05;

export function generate(x,y,z) {

  let groundHeight = simplex.noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) * 4 + GROUND_LEVEL;

  // air
  if (y > groundHeight) return 0;
  // grass
  if (y > groundHeight-1) return 1;
  // dirt
  if (y > groundHeight-4) return 2;
  // stone
  return 3;

}