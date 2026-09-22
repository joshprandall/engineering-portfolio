importScripts('math.js');
self.onmessage=e=>{try{const t=performance.now();const values=GeoMath.estimate(e.data.points,e.data.k);self.postMessage({id:e.data.id,values,ms:performance.now()-t})}catch(err){self.postMessage({id:e.data.id,error:String(err)})}};
