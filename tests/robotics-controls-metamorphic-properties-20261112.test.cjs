'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const controls = JSON.parse(fs.readFileSync(path.join(__dirname, '../deep-learning/robotics/controls.json'), 'utf8'));
const advanced = JSON.parse(fs.readFileSync(path.join(__dirname, '../deep-learning/robotics/advanced-controls.json'), 'utf8'));
const get = (n) => {
  const pack = n <= 12 ? controls : advanced;
  const id = Object.keys(pack).find(key => key.startsWith('robotics-controls-' + String(n).padStart(2, '0') + '-'));
  assert.ok(id, 'missing robotics lesson ' + n);
  return pack[id];
};
const near = (actual, expected, tolerance=1e-10) =>
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    'expected ' + expected + ', received ' + actual);

test('6: the exact SE(2) arc is continuous at zero turn and respects signed motion', () => {
  const sinc = h => Math.abs(h)<1e-5 ? 1-h*h/6+h**4/120 : Math.sin(h)/h;
  const integrate = (distance, yaw) => [
    distance*sinc(yaw/2)*Math.cos(yaw/2),
    distance*sinc(yaw/2)*Math.sin(yaw/2)
  ];
  assert.match(get(6).reasoningSteps.join(' '), /sinc\(dtheta\/2\)/);
  const p = integrate(.25,.2), reverseYaw = integrate(.25,-.2);
  near(p[0],.2483366634938265); near(p[1],.02491677769844797);
  near(reverseYaw[0],p[0]); near(reverseYaw[1],-p[1]);
  near(integrate(.25,0)[0],.25);near(integrate(.25,0)[1],0);
  near(integrate(0,.2)[0],0);near(integrate(0,.2)[1],0);
  for (const yaw of [-1e-9,1e-9]) {
    const [dx,dy] = integrate(.25,yaw);
    near(dx,.25,1e-14); near(dy,.125*yaw,1e-20);
  }
});

test('10: conditional integration bounds positive windup without blocking recovery', () => {
  const lesson = get(10);
  assert.match(lesson.labPlan.join(' '), /naive integral I10=2/);
  const dt=.1, kp=2, ki=1, limit=1;
  const command=(e,I)=>kp*e+ki*I;
  const update=(I,e)=>{
    const candidate=I+e*dt;
    const u=command(e,candidate);
    return (u>limit && e>0)||(u< -limit && e<0) ? I : candidate;
  };
  let guarded=0, naive=0;
  for (let k=0;k<10;k++) {guarded=update(guarded,2);naive+=2*dt;}
  near(guarded,0);near(naive,2);
  near(command(2,guarded),4);near(command(2,naive),6);
  near(command(-.25,guarded),-.5);near(command(-.25,naive),1.5);
  near(update(guarded,-.25),-.025);
  for (const e of [0,.1,-.1,-2]) {
    const next=update(0,e);
    assert.ok(Number.isFinite(next));
  }
});

test('16: exponential filter has a timestep-semigroup property absent from implicit Euler', () => {
  assert.match(get(16).reasoningSteps.join(' '), /zero-order-held exponential/);
  const tau=.4, alpha=dt=>1-Math.exp(-dt/tau);
  const update=(y,u,dt)=>y+alpha(dt)*(u-y);
  const one=update(0,1,.3);
  const split=update(update(0,1,.1),1,.2);
  near(one,split,1e-14);near(one,1-Math.exp(-.75),1e-14);
  const euler=(dt,n)=>{
    let y=0;const weight=dt/(tau+dt);
    for(let k=0;k<n;k++) y+=weight*(1-y);
    return y;
  };
  near(euler(.1,3),.488);
  assert.ok(Math.abs(one-euler(.05,6))<Math.abs(one-euler(.1,3)));
  assert.ok(Math.abs(one-euler(.01,30))<Math.abs(one-euler(.05,6)));
});

test('19: a delayed feedback pole can diverge inside the no-delay gain interval', () => {
  assert.match(get(19).verifiedBoundary, /0<g<1/);
  const delayed = (g,steps)=>{
    let previous=0,current=0;
    for(let k=0;k<steps;k++) {
      const next=current+g*(1-previous);
      previous=current; current=next;
    }
    return current;
  };
  near(delayed(.5,1),.5);near(delayed(.5,2),1);
  const poleMagnitude=g=>Math.sqrt(g);
  for(const g of [.1,.5,.9]) assert.ok(poleMagnitude(g)<1);
  for(const g of [1.01,1.2,1.8]) {
    assert.ok(g<2 && poleMagnitude(g)>1, 'delayed and no-delay regions differ');
    assert.ok(Math.abs(delayed(g,80)-1)>1, 'delayed errors should grow for generic initial state');
  }
  near(poleMagnitude(1),1);
});

test('20: a watchdog timeout is latched until a fresh-heartbeat reset', () => {
  assert.match(get(20).labPlan.join(' '), /non-monotonic event timestamps/);
  const monitor=(timeout=100)=>{
    let state='READY',lastBeat=20,lastEvent=20;
    return {
      event(type, t){
        if(!Number.isInteger(t)||t<lastEvent) throw new RangeError('non-monotonic or invalid timestamp');
        lastEvent=t;
        if(type==='heartbeat') lastBeat=t;
        else if(type==='poll' && state==='READY' && t-lastBeat>=timeout) state='STOP_LATCHED';
        else if(type==='reset' && state==='STOP_LATCHED' && t-lastBeat<timeout) state='READY';
        else if(!['heartbeat','poll','reset'].includes(type)) throw new RangeError('unknown event');
        return state;
      }
    };
  };
  const m=monitor();
  assert.equal(m.event('poll',100),'READY');
  assert.equal(m.event('poll',120),'STOP_LATCHED');
  assert.equal(m.event('reset',130),'STOP_LATCHED');
  assert.equal(m.event('heartbeat',140),'STOP_LATCHED');
  assert.equal(m.event('reset',141),'READY');
  assert.throws(()=>m.event('poll',139),RangeError);
  const n=monitor();
  assert.equal(n.event('poll',120),'STOP_LATCHED');
  assert.equal(n.event('heartbeat',220),'STOP_LATCHED');
  assert.equal(n.event('poll',320),'STOP_LATCHED');
});

test('22: differences of rounded encoder positions can exceed half-count error', () => {
  assert.match(get(22).verifiedBoundary, /nearly one whole count/);
  const step=2*Math.PI*.05/2048;
  near(step,.00015339807878856412,1e-15);
  const begin=100.49,end=199.51;
  near((Math.round(end)-Math.round(begin))-(end-begin),.98);
  for(const f0 of [.001,.01,.1,.49,.51,.9,.99,.999]) {
    for(const f1 of [.001,.01,.1,.49,.51,.9,.99,.999]) {
      const x=100+f0,y=200+f1;
      const err=(Math.round(y)-Math.round(x))-(y-x);
      assert.ok(Math.abs(err)<=1+1e-12);
    }
  }
});

test('24: rotated position covariance remains symmetric and positive definite', () => {
  assert.match(get(24).verifiedBoundary, /P_new=R P_old R\^T/);
  const p=.04,q=.01;
  for(let k=-24;k<=24;k++) {
    const angle=k*Math.PI/24,c=Math.cos(angle),s=Math.sin(angle);
    const a=p*c*c+q*s*s;
    const b=(p-q)*c*s;
    const d=p*s*s+q*c*c;
    near(a+d,.05);near(a*d-b*b,.0004,1e-12);
    assert.ok(a>0&&d>0&&a*d-b*b>0);
  }
  const c=Math.cos(Math.PI/2),s=Math.sin(Math.PI/2);
  near(p*c*c+q*s*s,.01);
  near(p*s*s+q*c*c,.04);
  near((p-q)*c*s,0);
});
