'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'..','deep-learning','physics','waves.json'),'utf8'));
const ids=[
 'physics-waves','physics-resonance','lab-wave-sound','physics-doppler','physics-shm',
 'physics-em-waves','physics-v06-traveling-wave-speed','physics-v06-wave-superposition',
 'physics-v08-deep-dive-simple-harmonic-motion','physics-v08-evidence-lab-simple-harmonic-motion',
 'physics-v08-deep-dive-wave-speed-frequency-wavelength','physics-v08-evidence-lab-doppler-effect'
];
function close(actual,expected,absolute=1e-6){assert.ok(Number.isFinite(actual),String(actual)+' is not finite');assert.ok(Math.abs(actual-expected)<=absolute,actual+' != '+expected);}
test('103 records retained with twelve distinct evidence-first lessons and intact supporting fields',()=>{
 assert.equal(Object.keys(data).length,103);assert.equal(new Set(ids).size,12);
 const questions=new Set();
 for(const id of ids){
  const lesson=data[id];assert.ok(lesson,id);
  assert.ok(lesson.essentialQuestion.endsWith('?'),id+': question mark');assert.doesNotMatch(lesson.essentialQuestion,/^What does /);
  assert.ok(!questions.has(lesson.essentialQuestion),id);questions.add(lesson.essentialQuestion);
  assert.equal(lesson.reasoningSteps.length,6,id);
  assert.equal(lesson.labPlan.length,6,id);
  assert.equal(new Set(lesson.reasoningSteps).size,6,id);
  assert.equal(new Set(lesson.labPlan).size,6,id);
  assert.ok(lesson.reasoningSteps.every(x=>x.length>=105),id+': reasoning');
  assert.ok(lesson.labPlan.every(x=>x.length>=110),id+': exercise');
  assert.ok(lesson.reasoningSteps[5].includes('https://openstax.org/books/university-physics-volume-'),id+': primary source');
  assert.ok(lesson.labPlan.some(x=>/incorrect|contradiction|Adversarial/.test(x)),id+': adversarial test');
  for(const field of ['verifiedBoundary','analogy','starter','technical','memoryLadder','vocabulary','video'])assert.ok(lesson[field],id+': preserved '+field);
  assert.doesNotMatch(lesson.reasoningSteps.join(' ')+' '+lesson.labPlan.join(' '),/we measured on hardware|confirmed in a laboratory|tested on the real device/i);
 }
});
test('frequency-wavelength inverse relation preserves 343 m/s in fixed medium',()=>{
 close(343/490,.7);close(343/686,.5);close(490*.7,343);close(686*.5,343);
 close(300/490,0.6122448979591837);
});
test('fixed-end resonant modes scale with harmonic index and inverse length',()=>{
 const f=(n,L,v=120)=>n*v/(2*L);
 close(f(1,.75),80);close(f(2,.75),160);close(f(3,.75),240);
 close(2*.75/3,.5);close(f(1,1.5),40);close(f(6,1.5),240);
});
test('sound period and pitch remain unchanged under amplitude-only multiplication',()=>{
 const f=440,v=343;close(1/f,0.0022727272727272726,1e-12);
 close(v/f,.7795454545454545);close(v/(2*f),.38977272727272727);
 const a=.2,t=.00031;close((2*a*Math.sin(2*Math.PI*f*t))/(a*Math.sin(2*Math.PI*f*t)),2);
});
test('moving-source Doppler uses denominator sign and differs from moving observer',()=>{
 const sound=340,f0=500;const approaching=u=>f0*sound/(sound-u);
 const receding=u=>f0*sound/(sound+u);
 close(approaching(20),531.25);close(receding(20),472.22222222222223);
 close(approaching(10),515.1515151515151);close(approaching(0),f0);
 assert.notEqual(approaching(20),f0*(sound+20)/sound);
});
test('ideal 0.25 kg spring oscillator has amplitude-independent period',()=>{
 const period=(m,k)=>2*Math.PI*Math.sqrt(m/k);
 close(Math.sqrt(100/.25),20);close(period(.25,100),Math.PI/10);
 close(1/period(.25,100),10/Math.PI);
 close(period(1,100),2*period(.25,100));
});
test('free-space electromagnetic wavelengths use exact c and proper Hz units',()=>{
 const c=299792458;close(c/1e8,2.99792458,1e-10);
 close(c/2.4e9,.12491352416666666,1e-11);
 close((c/1e8)/(c/2.4e9),24,1e-12);close((c/2e8)*2e8,c,1e-8);
});
test('tension and linear density lead to string speed through square-root law',()=>{
 const v=(t,mu)=>Math.sqrt(t/mu);
 close(v(80,.005),126.49110640673517);close(v(160,.005),178.88543819998318);
 close(v(160,.005)/v(80,.005),Math.SQRT2,1e-12);
 close(v(80,.005)**2*.005,80);
});
test('signed displacement superposition respects phase and cancellation',()=>{
 close(.003-.002,.001,1e-12);close(.003+.002,.005,1e-12);
 close(.003-.003,0,1e-12);
 assert.notEqual(Math.abs(.003)+Math.abs(-.002),.003-.002);
});
test('SHM differentiated peak speed and acceleration scale differently in omega',()=>{
 const A=.08,omega=5;close(A*omega,.4);close(A*omega**2,2);
 close(A*(2*omega),.8);close(A*(2*omega)**2,8);
 const velocity=t=>-A*omega*Math.sin(omega*t);
 const acceleration=t=>-A*omega**2*Math.cos(omega*t);
 close(velocity(0),0);close(acceleration(0),-2);
 close(Math.abs(velocity(Math.PI/(2*omega))),.4);
});
test('analytic spring period agrees with ratio under mass doubling',()=>{
 const f=(m,k)=>Math.sqrt(k/m)/(2*Math.PI);
 const T=(m,k)=>1/f(m,k);
 close(T(.5,200),Math.PI/10);
 close(T(1,200),2*Math.PI/Math.sqrt(200),1e-12);
 close(T(1,200)/T(.5,200),Math.SQRT2,1e-12);
 assert.ok(T(1,200)>T(.5,200));
});
test('transmitted wavelength changes while driven frequency remains fixed',()=>{
 const f=686;
 close(343/f,.5);close(300/f,.43731778425655976,1e-12);
 close((300/f)*f,300);close(343/343,1);
 assert.notEqual(300/.5,f);
});
test('receding-source sound is lower frequency and approaches raise it',()=>{
 const observed=(vsource,receding=true)=>600*340/(340+(receding?1:-1)*vsource);
 close(observed(25),558.9041095890411);
 close(observed(25,false),647.6190476190476);
 close(observed(0),600);close(observed(50),523.0769230769231);
 assert.ok(observed(25)<600&&observed(25,false)>600);
});
