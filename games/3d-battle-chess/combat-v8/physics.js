export const GRAVITY=9.81;

export function body({x=0,y=0,z=0,mass=1,drag=4,bounce=.12}={}){
 return {x,y,z,vx:0,vy:0,vz:0,mass,drag,bounce,grounded:y<=0};
}
export function applyImpulse(b,i){
 const inv=1/Math.max(.001,b.mass);
 b.vx+=i.x*inv;b.vy+=i.y*inv;b.vz+=i.z*inv;
 if(b.vy>.001)b.grounded=false;
 return b;
}
export function integrate(b,dt,ground=0){
 if(!b.grounded)b.vy-=GRAVITY*dt;
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
 if(b.y<=ground){
  b.y=ground;
  if(b.vy<-.5){b.vy=-b.vy*b.bounce;b.grounded=b.vy<=.05;}
  else{b.vy=0;b.grounded=true;}
 }else b.grounded=false;
 const f=Math.exp(-b.drag*dt);b.vx*=f;b.vz*=f;return b;
}
export function driveToward(b,targetX,maxSpeed,accel,dt){
 const wanted=Math.max(-maxSpeed,Math.min(maxSpeed,(targetX-b.x)*accel));
 const dv=Math.max(-accel*dt,Math.min(accel*dt,wanted-b.vx));b.vx+=dv;return b;
}
