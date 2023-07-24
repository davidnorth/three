import Simplex from 'perlin-simplex'
const simplex = new Simplex()


const GROUND_LEVEL = 32;

NOISE_SCALE_1 = 0.02;
NOISE_SCALE_2 = 0.003;

export function generate(x,y,z) {

  const mult = simplex.noise(x * NOISE_SCALE_2, z * NOISE_SCALE_2) * 10;
  let groundHeight = simplex.noise(x * NOISE_SCALE_1, z * NOISE_SCALE_1) * mult + GROUND_LEVEL;

  // air
  if (y > groundHeight) return 0;
  // grass
  if (y > groundHeight-1) return 1;
  // dirt
  if (y > groundHeight-4) return 2;
  // stone
  return 3;

}