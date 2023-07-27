import Simplex from 'perlin-simplex'
const simplex = new Simplex()


const GROUND_LEVEL = 16;

NOISE_SCALE_1 = 0.05;

export function generate(x,y,z) {

  // return y>0 ? 0 : 1;

  return simpleHeightmap(x,y,z)

  const value = simplex.noise3d(x * NOISE_SCALE_1, y * NOISE_SCALE_1, z * NOISE_SCALE_1)


  return value > 0 ? 2 : 0;


}


function simpleHeightmap(x,y,z) {
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