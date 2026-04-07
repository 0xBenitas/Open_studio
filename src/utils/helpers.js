export function noteFreq(note, octave) {
  return 440 * Math.pow(2, (note + octave * 12 - 69) / 12);
}

export function makePat(steps) {
  return {
    acts: new Array(steps).fill(false),
    vels: new Array(steps).fill(0.8),
    probs: new Array(steps).fill(1),
  };
}

export function makeNoteGrid(steps) {
  return Array.from({ length: steps }, () => ({
    note: 0, octave: 3, on: false, vel: 0.8, len: 1,
  }));
}

export function isBlack(n) {
  return [1, 3, 6, 8, 10].includes(n);
}
