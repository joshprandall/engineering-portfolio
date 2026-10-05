const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Learn solar includes fully routed Coding and Quantum planets',()=>{
  const html=read('learn.html'),solar=read('solar-navigation.js');
  assert.match(html,/href="learn-coding\.html" aria-label="Coding"/);
  assert.match(html,/href="learn-quantum\.html" aria-label="Quantum"/);
  assert.match(solar,/"Coding": \[/);
  assert.match(solar,/"Quantum": \[/);
  assert.match(solar,/count:4/);
  assert.match(solar,/count:5/);
});

test('Coding hub has sandboxed execution and broad transferable curriculum',()=>{
  const html=read('learn-coding.html'),js=read('coding-lab.js');
  assert.match(html,/sandbox="allow-scripts"/);
  assert.match(html,/Language \/ ecosystem/);
  assert.match(html,/Compilers &amp; runtimes/);
  assert.match(html,/Scientific\/HPC/);
  assert.match(html,/Hardware\/FPGA/);
  assert.match(html,/Quantum software/);
  assert.match(js,/default-src 'none'/);
  assert.doesNotMatch(js,/\bfetch\s*\(/);
  assert.doesNotMatch(js,/XMLHttpRequest|WebSocket/);
  for(const name of ['Python','JavaScript','TypeScript','C++','Rust','Go','SQL','PowerShell','CUDA C++','SystemVerilog / Verilog','Qiskit / Python'])assert.match(js,new RegExp(name.replace(/[+]/g,'\\+')));
});

test('Quantum hub separates experiment, simulation, theory and roadmaps',()=>{
  const html=read('learn-quantum.html'),js=read('quantum-lab.js');
  assert.match(html,/Scientific boundary/);
  assert.match(html,/Peer-reviewed experiment/);
  assert.match(html,/Roadmap \/ stated target/);
  assert.match(html,/Reinforcement learning control of quantum error correction/);
  assert.match(html,/Logical qubits with erasure conversion/);
  assert.match(html,/Post-quantum migration/);
  assert.match(js,/matrices=\{/);
  for(const gate of ['X','Y','Z','H','S','T'])assert.match(js,new RegExp(gate+":\["));
  assert.match(js,/teaching heuristic|intuition/i);
});

test('AI Development exposes architecture, evaluation and production controls',()=>{
  const html=read('ai-development.html'),js=read('ai-engineering-tools.js');
  assert.match(html,/SYSTEM LAYERS/);
  assert.match(html,/LOCAL ARCHITECTURE PLANNER/);
  assert.match(html,/PRODUCTION READINESS/);
  assert.match(html,/NIST AI RMF/);
  assert.match(html,/OWASP GenAI/);
  assert.match(js,/wilson/);
  assert.match(js,/approval boundary/i);
  assert.match(js,/untrusted/i);
});

test('Security Research extended tools remain local and defensive',()=>{
  const html=read('security-research.html'),js=read('security-extended.js');
  for(const id of ['agentsec-lab','supply-lab','pqc-lab'])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/does not probe TLS endpoints/);
  assert.match(html,/Secure development system/i);
  assert.doesNotMatch(js,/\bfetch\s*\(/);
  assert.doesNotMatch(js,/XMLHttpRequest|WebSocket|navigator\.credentials/);
  assert.match(js,/least-privilege/i);
  assert.match(js,/ML-KEM/);
});

test('Game Development adds engineering tools without touching game runtime files',()=>{
  const html=read('game-development.html'),js=read('game-engine-tools.js');
  assert.match(html,/LOCAL TOOL \/ FRAME BUDGET/);
  assert.match(html,/LOCAL TOOL \/ SIMULATION TIMESTEP/);
  assert.match(html,/RELEASE GATE/);
  assert.match(html,/PYREFRAME \/ ENGINE DIRECTION/);
  assert.match(html,/design direction, not a claim/i);
  assert.match(js,/1000\/fps/);
  assert.match(html,/Maximum catch-up steps/);
  assert.match(js,/sim-max-steps/);
});

test('Projects and About expose evidence boundaries and capability depth',()=>{
  const projects=read('projects.html'),about=read('about.html');
  assert.match(projects,/PROJECT EVIDENCE/);
  assert.match(projects,/Limitations/);
  assert.match(projects,/Next experiment/);
  assert.match(projects,/id="project-filter"/);
  assert.match(about,/Programming, web engineering &amp; developer tooling/);
  assert.match(about,/Security research &amp; secure engineering/);
  assert.match(about,/Game, simulation &amp; interactive systems/);
  assert.match(about,/Quantum, mathematics &amp; scientific computing/);
  assert.match(about,/distinguishes active engineering study/i);
});

test('Global search guarantees new destinations even before generated index refresh',()=>{
  const js=read('site-search.js');
  for(const route of ['learn-coding.html','learn-quantum.html','security-research.html','ai-development.html','game-development.html','projects.html'])assert.match(js,new RegExp(route.replace('.','\\.')));
});
