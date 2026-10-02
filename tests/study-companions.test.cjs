const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
test('authored units have notebook, page, explanation and explicit evidence',()=>{
 const units=JSON.parse(fs.readFileSync(path.join(root,'project-sources/engineering-studies/units.json'),'utf8'));
 assert.equal(units.length,41);assert.equal(new Set(units.map(u=>u.id)).size,41);
 for(const u of units){assert(fs.readFileSync(path.join(root,u.page),'utf8').includes('id="study-'+u.id+'"'));assert(u.concept.length>500);assert(u.model.length>=3);assert.equal(u.options.length,u.reasons.length);assert(u.references.length);const nb=JSON.parse(fs.readFileSync(path.join(root,'project-sources/engineering-studies/notebooks',u.id+'.ipynb'),'utf8'));assert.equal(nb.nbformat,4);assert(nb.cells.some(c=>c.cell_type==='code'&&c.source.join('').includes('assert ')));}
 assert(fs.existsSync(path.join(root,'assets/downloads/engineering-studies-3.2-3.6.zip')));
});
test('QPE circular error respects endpoint equivalence while retaining linear metric',async()=>{
 const {distribution,circularDistance}=await import('../labs/qpe.js');assert(Math.abs(circularDistance(0,.99)-.01)<1e-12);
 const exact=distribution(.125,3);assert(Math.abs(exact[1].ideal-1)<1e-12);
 const near=distribution(.99,3);const linear=near.reduce((s,x)=>s+x.ideal*(x.phase-.99)**2,0);const circular=near.reduce((s,x)=>s+x.ideal*circularDistance(x.phase,.99)**2,0);assert(circular<linear);
});
