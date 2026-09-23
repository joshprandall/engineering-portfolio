export function degreesToRadians(degrees) {
  if (!Number.isFinite(degrees)) throw new RangeError('angle must be finite');
  return degrees * Math.PI / 180;
}
export function stateFromAngles(thetaDegrees, phiDegrees = 0) {
  if (!Number.isFinite(thetaDegrees) || thetaDegrees < 0 || thetaDegrees > 180) throw new RangeError('theta must be a finite number from 0 through 180 degrees');
  if (!Number.isFinite(phiDegrees)) throw new RangeError('phi must be finite');
  const theta=degreesToRadians(thetaDegrees),phi=degreesToRadians(((phiDegrees%360)+360)%360);
  const alpha=Math.cos(theta/2),betaMag=Math.sin(theta/2);
  const beta={re:betaMag*Math.cos(phi),im:betaMag*Math.sin(phi)};
  const x=Math.sin(theta)*Math.cos(phi),y=Math.sin(theta)*Math.sin(phi),z=Math.cos(theta);
  return {thetaDegrees,phiDegrees:((phiDegrees%360)+360)%360,alpha,betaMag,beta,bloch:{x,y,z},normalization:alpha*alpha+betaMag*betaMag};
}
export function stateFromAngle(thetaDegrees) {
  const s=stateFromAngles(thetaDegrees,0);
  return {...s,beta:s.betaMag,p0:(1+s.bloch.z)/2,p1:(1-s.bloch.z)/2};
}
export function measurementProbabilities(state,basis='Z'){
  const axis=String(basis||'Z').toUpperCase();
  const component=axis==='X'?state.bloch.x:axis==='Y'?state.bloch.y:state.bloch.z;
  const p0=(1+component)/2,p1=1-p0;
  return {basis:axis,p0,p1,component};
}
export function describeState(thetaDegrees,phiDegrees=0,basis='Z') {
  if (thetaDegrees === 0) return 'North pole: the state is |0⟩; relative phase is physically irrelevant here.';
  if (thetaDegrees === 180) return 'South pole: the state is |1⟩; relative phase is physically irrelevant here.';
  const phase=((phiDegrees%360)+360)%360;
  if(thetaDegrees===90&&phase===0)return 'Equator at +x: the state is |+⟩, an X-basis eigenstate.';
  if(thetaDegrees===90&&phase===180)return 'Equator at −x: the state is |−⟩, an X-basis eigenstate.';
  if(thetaDegrees===90&&phase===90)return 'Equator at +y: the state is |+i⟩, a Y-basis eigenstate.';
  if(thetaDegrees===90&&phase===270)return 'Equator at −y: the state is |−i⟩, a Y-basis eigenstate.';
  return 'General pure qubit: θ sets latitude, φ sets azimuth, and the '+String(basis).toUpperCase()+' measurement reads the corresponding Bloch-vector component.';
}
export function seededRng(seed=1){let x=(Number(seed)||1)>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
export function sampleMeasurements(p0, shots, rng = Math.random) {
  if (!Number.isFinite(p0) || p0 < 0 || p0 > 1) throw new RangeError('p0 must be between 0 and 1');
  if (!Number.isInteger(shots) || shots <= 0) throw new RangeError('shots must be a positive integer');
  if (typeof rng !== 'function') throw new TypeError('rng must be a function');
  let count0=0;
  for(let i=0;i<shots;i+=1){const value=rng();if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('rng must return values in [0, 1)');if(value<p0)count0+=1}
  return {count0,count1:shots-count0,shots};
}