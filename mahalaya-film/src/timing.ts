// All timings are seconds on the trimmed soundtrack (first audible note = 0).
// Accents come from `hyperframes beats` (hf/beats/soundtrack.wav.json).
export const FPS = 24;
export const DURATION_S = 49.75;
export const TOTAL_FRAMES = Math.round(DURATION_S * FPS); // 1194
export const f = (s: number) => Math.round(s * FPS);

export const T = {
  s1: 0,
  s2: 6.676, // first big accent after the intro swell
  godsShot: 11.981,
  godsRealize: 12.504,
  s3: 13.038,
  durgaBurst: 15.476, // strongest accent in the track (strength 1.0)
  lionRoar: 16.091,
  s4: 21.792, // battle starts on the 21.8s hit
  closeDurga: 24.892,
  closeDemon: 25.263,
  closeWeapons: 25.67,
  clash: 26.958,
  twoShot: 27.063,
  strike: 30.012, // decisive moment, last accent of the battle cluster
  bengalIn: 36.0, // HyperFrames segment begins (dissolve 36.0 -> 36.72)
  bengal: 36.722,
};

export const LIGHTNING = [7.535, 8.615, 9.59, 9.822, 11.099];
export const SPARKS = [26.958, 27.55, 28.34, 28.607, 29.559, 30.012];
