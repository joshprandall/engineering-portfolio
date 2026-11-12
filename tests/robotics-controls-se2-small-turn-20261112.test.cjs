'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const close=(actual,expected,tol=1e-12)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol,'actual '+actual+' expected '+expected);
const sinc=x=>x===0?1:Math.sin(x)/x;
function se2Stable(ds,theta){const h=theta/2,scale=ds*sinc(h);return [scale*Math.cos(h),scale*Math.sin(h),theta];}
function se2Naive(ds,theta){if(theta===0)return [ds,0,theta];return [ds*Math.sin(theta)/theta,ds*(1-Math.cos(theta))/theta,theta];}
function fromWheels(left,right,track){if(!(track>0))throw new RangeError('positive track required');return se2Stable((left+right)/2,(right-left)/track);}
function independentQuadrature(ds,theta,segments=50000){let x=0,y=0,step=ds/segments;for(let i=0;i<segments;i++){let ang=theta*(i+0.5)/segments;x+=step*Math.cos(ang);y+=step*Math.sin(ang);}return [x,y];}
test('exact turn from reported wheel increments',()=>{let [x,y,th]=fromWheels(.2,.3,.5);close(x,.2483366634938265);close(y,.024916777698447953);close(th,.2);});
test('independent numerical quadrature of chassis twist',()=>{for(let theta of [-1.2,-.2,-1e-9,0,1e-9,.2,1.2]){let [x,y]=se2Stable(.25,theta);let [qx,qy]=independentQuadrature(.25,theta);close(x,qx,8e-12);close(y,qy,8e-12);}});
test('straight limit and pure spin',()=>{assert.deepEqual(se2Stable(.25,0),[.25,0,0]);assert.deepEqual(fromWheels(-.05,+.05,.5).slice(0,2),[0,0]);});
test('small-angle cancellation counterexample in binary64',()=>{let theta=1e-9,ds=.25;let [sx,sy]=se2Stable(ds,theta),[nx,ny]=se2Naive(ds,theta);close(sx,.25,1e-15);close(sy,1.25e-10,1e-20);assert.equal(ny,0);assert.ok(Math.abs(sy-ny)>1e-10);assert.equal(1-Math.cos(theta),0);});
test('signed turns reverse lateral displacement',()=>{let a=se2Stable(.25,.2),b=se2Stable(.25,-.2);close(a[0],b[0]);close(a[1],-b[1]);});
test('reverse travel is distinct from reverse yaw',()=>{let a=se2Stable(.25,.2),b=se2Stable(-.25,-.2);close(a[0],-b[0]);close(a[1],b[1]);});
test('chord shorter than arc on nonzero turn',()=>{for(let theta of [.2,1.2,-.2,-1.2]){let [x,y]=se2Stable(.25,theta);close(Math.hypot(x,y),Math.abs(.25*sinc(theta/2)));assert.ok(Math.hypot(x,y)<.25);}});
test('invalid track geometry rejected',()=>{assert.throws(()=>fromWheels(.2,.3,0),RangeError);});
