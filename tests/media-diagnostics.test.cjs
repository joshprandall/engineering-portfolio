'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createMediaDiagnostics}=require('./media-diagnostics.cjs');
const origin='http://127.0.0.1:1234';
const page=()=>Object.assign(new EventEmitter(),{url:()=>origin+'/learn.html'});
test('phase and stack enrich errors without changing the existing primary gate',()=>{
 const report={errors:[]},d=createMediaDiagnostics(report,{origin,now:()=>17}),p=page();
 d.attach(p,'primary',{gateErrors:true});d.phase('viewport-320x568');
 const e=new Error('ResizeObserver loop completed with undelivered notifications.');p.emit('pageerror',e);
 assert.deepEqual(report.errors,[e.message]);assert.equal(report.diagnostics[0].phase,'viewport-320x568');
 assert.equal(report.diagnostics[0].at,17);assert.equal(report.diagnostics[0].pageUrl,origin+'/learn.html');
 assert.equal(report.diagnostics[0].stack,e.stack);
});
test('local request failures keep URL, resource type and reason; external aborts excluded',()=>{
 const report={errors:[]},d=createMediaDiagnostics(report,{origin}),p=page();d.attach(p,'primary');
 const request=url=>({url:()=>url,resourceType:()=> 'fetch',failure:()=>({errorText:'cancelled'})});
 p.emit('requestfailed',request(origin+'/assets/project-evaluation.json?v=1'));
 p.emit('requestfailed',request('https://external.example/a'));p.emit('requestfailed',request('not a URL'));
 assert.equal(report.diagnostics.length,1);assert.equal(report.diagnostics[0].failure,'cancelled');
 assert.equal(report.diagnostics[0].resourceType,'fetch');assert.equal(report.errors.length,0);
});
test('console error retains source location and ignores ordinary logs',()=>{
 const report={errors:[]},d=createMediaDiagnostics(report,{origin}),p=page();d.attach(p,'primary');
 const location={url:origin+'/site-navigation.js',lineNumber:13,columnNumber:4};
 p.emit('console',{type:()=> 'log'});p.emit('console',{type:()=> 'error',text:()=> 'access control',location:()=>location});
 assert.deepEqual(report.diagnostics[0].location,location);assert.deepEqual(report.errors,[]);
});
test('HTTP failures are local and non-successful, with no new pass/fail policy',()=>{
 const report={errors:[]},d=createMediaDiagnostics(report,{origin}),p=page();d.attach(p,'primary');
 for(const [url,status] of [[origin+'/missing.json',404],[origin+'/okay.json',200],['https://external.example/a',500]])
  p.emit('response',{url:()=>url,status:()=>status});
 assert.equal(report.diagnostics.length,1);assert.equal(report.diagnostics[0].status,404);assert.deepEqual(report.errors,[]);
});
test('bounded evidence never truncates the existing error gate and attachment is idempotent',()=>{
 const report={errors:[]},d=createMediaDiagnostics(report,{origin,limit:1}),p=page();
 d.attach(p,'primary',{gateErrors:true});d.attach(p,'primary',{gateErrors:true});
 p.emit('pageerror',new Error('first'));p.emit('pageerror',new Error('second'));
 assert.deepEqual(report.errors,['first','second']);assert.equal(report.diagnostics.length,1);assert.equal(report.diagnosticsDropped,1);
});
test('secondary page evidence is explicitly diagnostic-only and limit is validated',()=>{
 const report={errors:[]},d=createMediaDiagnostics(report,{origin}),p=page();d.attach(p,'iphone-frame-callback');
 p.emit('pageerror',new Error('secondary'));assert.deepEqual(report.errors,[]);
 assert.equal(report.diagnostics[0].page,'iphone-frame-callback');
 assert.throws(()=>createMediaDiagnostics({},{limit:0}),TypeError);
});
