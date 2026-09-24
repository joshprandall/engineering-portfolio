importScripts('math.js');
self.onmessage=e=>{
  try{
    const t=performance.now();
    const geometry=GeoMath.estimateGeometry(e.data.points,e.data.k,e.data.normals||null);
    self.postMessage({id:e.data.id,geometry,ms:performance.now()-t});
  }catch(err){
    self.postMessage({id:e.data.id,error:String(err)});
  }
};