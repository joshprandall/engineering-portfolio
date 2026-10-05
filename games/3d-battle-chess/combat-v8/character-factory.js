import * as THREE from 'three';
import {getCharacterDefinition} from './character-definitions.js';
import {buildRig,GEO} from './rig-types.js';
import {PALETTES} from '../pieces.js';
import {sculptCharacter} from './character-visuals.js';

const {box,sphere,cyl,cone,mesh}=GEO;
const mat=(color,rough=.65,metal=.12,emissive=0,intensity=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive,emissiveIntensity:intensity});

const MATERIAL_PROFILES={
 classic:{
  primary:{rough:.58,metal:.18},secondary:{rough:.82,metal:.05},armor:{rough:.34,metal:.58},
  skin:{rough:.76,metal:.03},glow:{rough:.22,metal:.50,intensity:.54},dark:{rough:.76,metal:.10}
 },
 arcane:{
  primary:{rough:.50,metal:.24},secondary:{rough:.70,metal:.12},armor:{rough:.27,metal:.44},
  skin:{rough:.72,metal:.04},glow:{rough:.17,metal:.38,intensity:.88},dark:{rough:.66,metal:.18}
 },
 monsters:{
  primary:{rough:.88,metal:.02},secondary:{rough:.92,metal:.01},armor:{rough:.60,metal:.12},
  skin:{rough:.94,metal:0},glow:{rough:.36,metal:.06,intensity:.38},dark:{rough:.86,metal:.02}
 },
 brick:{
  primary:{rough:.40,metal:.08},secondary:{rough:.50,metal:.05},armor:{rough:.28,metal:.14},
  skin:{rough:.46,metal:.04},glow:{rough:.24,metal:.18,intensity:.46},dark:{rough:.44,metal:.08}
 },
 cosmic:{
  primary:{rough:.27,metal:.64},secondary:{rough:.35,metal:.46},armor:{rough:.19,metal:.80},
  skin:{rough:.44,metal:.30},glow:{rough:.12,metal:.72,intensity:1.00},dark:{rough:.27,metal:.52}
 }
};

export function materialProfileForTheme(theme){
 const key=MATERIAL_PROFILES[theme]?theme:'classic';
 return structuredClone(MATERIAL_PROFILES[key]);
}

function materialsFor(definition,side){
 const p=PALETTES[definition.theme]||PALETTES.classic,dark=side==='b',profile=MATERIAL_PROFILES[definition.theme]||MATERIAL_PROFILES.classic;
 const make=(name,color,spec,emissive=0,intensity=0)=>{
  const material=mat(color,spec.rough,spec.metal,emissive,intensity);
  material.name=`crown-ash:${definition.theme}:${name}`;
  return material;
 };
 return {
  primary:make('primary',dark?p.b:p.w,profile.primary),
  secondary:make('secondary',dark?0x172536:0x4a3929,profile.secondary),
  armor:make('armor',dark?0x7b98ab:p.trim,profile.armor),
  skin:make('skin',definition.theme==='monsters'?(dark?0x516753:0x859665):(dark?0x71808c:0xc3a184),profile.skin),
  glow:make('glow',p.glow,profile.glow,p.glow,profile.glow.intensity),
  dark:make('dark',0x14202b,profile.dark)
 };
}

function addWeapon(rig,def,m){
 const w=rig.weapon,s=rig.scale;
 const id=def.weapon;
 if(/spear|lance/.test(id)){mesh(w,cyl(.025*s,.03*s,.62*s,7),m.secondary,0,-.30*s,.03*s);const tip=mesh(w,cone(.065*s,.23*s,6),m.armor,0,-.67*s,.03*s);tip.rotation.x=Math.PI;}
 else if(/greatsword|rapier|blade/.test(id)){mesh(w,box(.045*s,.58*s,.055*s),m.armor,0,-.35*s,.03*s);mesh(w,box(.26*s,.04*s,.08*s),m.secondary,0,-.08*s,.03*s);}
 else if(/hammer/.test(id)){mesh(w,cyl(.035*s,.04*s,.50*s,7),m.secondary,0,-.25*s,0);mesh(w,box(.34*s,.18*s,.20*s),m.armor,0,-.53*s,0);}
 else if(/staff|focus|wand/.test(id)){mesh(w,cyl(.028*s,.035*s,.64*s,8),m.secondary,0,-.31*s,0);mesh(w,new THREE.OctahedronGeometry(.12*s),m.glow,0,-.68*s,0);}
 else if(/rifle|cannon/.test(id)){mesh(w,box(.18*s,.22*s,.58*s),m.armor,0,-.22*s,.20*s);mesh(w,cyl(.055*s,.055*s,.42*s,8),m.glow,0,-.20*s,.52*s).rotation.x=Math.PI/2;}
 else if(/fists|claws|talons|fangs|horns/.test(id)){for(const x of[-.07,0,.07]){const claw=mesh(w,cone(.045*s,.28*s,5),m.armor,x*s,-.22*s,.04*s);claw.rotation.x=Math.PI;}}
 else if(/orb|core|plasma/.test(id)){mesh(w,new THREE.OctahedronGeometry(.15*s),m.glow,0,-.30*s,.08*s);}
 else mesh(w,box(.12*s,.38*s,.12*s),m.armor,0,-.26*s,0);
}

export function createV8Character(piece,theme='classic'){
 const def=getCharacterDefinition(theme,piece.t),root=new THREE.Group(),materials=materialsFor(def,piece.c);
 const rig=buildRig(root,materials,def);root.userData={v8:true,definition:def,role:piece.t,side:piece.c,rigV8:rig};
 addWeapon(rig,def,materials);sculptCharacter(root,rig,def,materials);
 root.rotation.y=piece.c==='w'?0:Math.PI;
 root.traverse(o=>{o.userData.root=root});
 return root;
}


export function createV8BoardPiece(piece,x,y,theme='classic'){
 const root=createV8Character(piece,theme),def=root.userData.definition,p=PALETTES[theme]||PALETTES.classic,dark=piece.c==='b';
 const baseMat=new THREE.MeshStandardMaterial({color:dark?0x1c3142:0x6d6556,roughness:.48,metalness:.28});
 const edgeMat=new THREE.MeshStandardMaterial({color:dark?0x8aa8bb:p.trim,roughness:.36,metalness:.42,emissive:p.glow,emissiveIntensity:.08});
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.44,.48,.12,20),baseMat);base.position.y=-.04;base.castShadow=true;base.receiveShadow=true;root.add(base);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.025,6,24),edgeMat);ring.rotation.x=Math.PI/2;ring.position.y=.025;root.add(ring);
 const scale=({p:.58,n:.60,b:.58,r:.56,q:.57,k:.55})[piece.t]||.58;
 root.scale.setScalar(scale);root.position.set(x-3.5,.13,y-3.5);
 root.userData={...root.userData,piece:true,x,y,role:piece.t,side:piece.c,boardCharacterV8:true,definition:def};
 root.traverse(o=>{o.userData.root=root});
 return root;
}
