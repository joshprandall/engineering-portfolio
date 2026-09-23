export function degreesToRadians(degrees) {
  if (!Number.isFinite(degrees) || degrees < 0 || degrees > 180) throw new RangeError('theta must be a finite number from 0 through 180 degrees');
  return degrees * Math.PI / 180;
}
export function stateFromAngle(thetaDegrees) {
  const theta = degreesToRadians(thetaDegrees), alpha = Math.cos(theta / 2), beta = Math.sin(theta / 2), p0 = alpha * alpha, p1 = beta * beta;
  return {thetaDegrees,alpha,beta,p0,p1,normalization:p0+p1};
}
export function describeState(thetaDegrees) {
  if (thetaDegrees === 0) return 'Certain measurement outcome |0⟩.';
  if (thetaDegrees === 180) return 'Certain measurement outcome |1⟩.';
  if (thetaDegrees === 90) return 'Equal probabilities for the two computational-basis outcomes.';
  if (thetaDegrees < 90) return 'Outcome |0⟩ is more likely than |1⟩.';
  return 'Outcome |1⟩ is more likely than |0⟩.';
}
export function seededRng(seed=1){let x=(Number(seed)||1)>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
export function sampleMeasurements(p0, shots, rng = Math.random) {
  if (!Number.isFinite(p0) || p0 < 0 || p0 > 1) throw new RangeError('p0 must be between 0 and 1');
  if (!Number.isInteger(shots) || shots <= 0) throw new RangeError('shots must be a positive integer');
  if (typeof rng !== 'function') throw new TypeError('rng must be a function');
  let count0 = 0;
  for (let i = 0; i < shots; i += 1) { const value=rng(); if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('rng must return values in [0, 1)'); if (value < p0) count0 += 1; }
  return {count0,count1:shots-count0,shots};
}