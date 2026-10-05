const BOB={p:.004,n:.008,b:.007,r:.003,q:.009,k:.005};

export function applyBoardPresence(group,{time=0,selected=null,turn='w',reducedMotion=false}={}){
  if(!group?.children)return 0;
  let count=0;
  for(const piece of group.children){
    const data=piece?.userData;
    if(!data?.piece)continue;
    const base=data.boardPresenceBase||(data.boardPresenceBase={y:piece.position.y,scale:piece.scale.x});
    const chosen=!!selected&&selected.x===data.x&&selected.y===data.y;
    const wave=reducedMotion?0:Math.sin(time+(data.x||0)+(data.y||0))*BOB[data.role]*(data.side===turn?1:.6);
    const scale=base.scale*(1+(chosen?.025:0));
    piece.position.y=base.y+wave+(chosen?.035:0);
    if(piece.scale?.setScalar)piece.scale.setScalar(scale);
    count++;
  }
  return count;
}
