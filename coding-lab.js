/* Coding learning tools run only in a sandboxed, network-blocked iframe or deterministic local calculators. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const languages=[
    ['Python','general / automation / data / AI','dynamic','Beginner → advanced','Readable general-purpose language; learn modules, typing, packaging, testing and async after fundamentals.','https://docs.python.org/3/tutorial/'],
    ['JavaScript','web / server / tooling','dynamic','Beginner → advanced','Browser-native language; learn the language before frameworks, then events, async, modules and runtime APIs.','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide'],
    ['TypeScript','web / services / tooling','static-on-JS','Intermediate → advanced','JavaScript with a structural type system; useful for large applications and API contracts.','https://www.typescriptlang.org/docs/'],
    ['C','systems / embedded / OS','static','Intermediate → expert','Manual memory, ABI, pointers and close-to-hardware programming.','https://en.cppreference.com/w/c'],
    ['C++','systems / engines / HPC','static','Intermediate → expert','RAII, templates, performance, concurrency and large native systems.','https://isocpp.org/get-started'],
    ['Rust','systems / infrastructure / embedded','static','Intermediate → expert','Ownership and borrowing enforce memory-safety properties without a tracing GC.','https://doc.rust-lang.org/book/'],
    ['Java','enterprise / backend / Android','static','Beginner → advanced','JVM ecosystem, objects, generics, concurrency, testing and service development.','https://dev.java/learn/'],
    ['Kotlin','Android / backend / multiplatform','static','Beginner → advanced','Concise JVM language with null-safety, coroutines and multiplatform tooling.','https://kotlinlang.org/docs/home.html'],
    ['C#','.NET / cloud / games','static','Beginner → advanced','.NET application development, async, LINQ, services and game tooling.','https://learn.microsoft.com/dotnet/csharp/'],
    ['Go','cloud / networking / services','static','Beginner → advanced','Simple tooling, interfaces and lightweight concurrency for services and infrastructure.','https://go.dev/tour/'],
    ['Swift','Apple platforms / systems','static','Beginner → advanced','Protocols, value semantics, concurrency and native Apple application development.','https://docs.swift.org/swift-book/documentation/the-swift-programming-language/'],
    ['SQL','data / analytics / applications','declarative','Beginner → expert','Relational modeling, queries, joins, transactions, indexes and query plans.','https://www.postgresql.org/docs/current/tutorial.html'],
    ['Bash','Unix automation / DevOps','shell','Beginner → advanced','Pipelines, processes, text streams, quoting and operating-system automation.','https://www.gnu.org/software/bash/manual/'],
    ['PowerShell','Windows / cloud / automation','shell + objects','Beginner → advanced','Object pipeline, modules, remoting, Microsoft administration and cross-platform automation.','https://learn.microsoft.com/powershell/'],
    ['R','statistics / data science','dynamic','Beginner → advanced','Statistical computing, visualization and reproducible analysis.','https://cran.r-project.org/manuals.html'],
    ['Julia','scientific / numerical / HPC','dynamic/JIT','Intermediate → advanced','Numerical and scientific computing with multiple dispatch and high-performance compilation.','https://docs.julialang.org/'],
    ['MATLAB','engineering / numerical','array-oriented','Beginner → advanced','Matrix-oriented engineering, controls, signal processing and numerical prototyping.','https://www.mathworks.com/help/matlab/'],
    ['Fortran','scientific / HPC','static','Intermediate → expert','Still important in numerical science and high-performance legacy/new scientific codes.','https://fortran-lang.org/learn/'],
    ['Zig','systems / tooling','static','Intermediate → expert','Explicit low-level programming, C interoperability and build tooling.','https://ziglang.org/learn/'],
    ['Dart','cross-platform apps','static','Beginner → advanced','Language behind Flutter applications and reactive UI development.','https://dart.dev/language'],
    ['Scala','JVM / data / functional','static','Intermediate → expert','Object-functional programming, strong type system and distributed-data ecosystems.','https://docs.scala-lang.org/'],
    ['Haskell','functional / research','static','Intermediate → expert','Pure functional programming, algebraic data types, typeclasses and lazy evaluation.','https://www.haskell.org/documentation/'],
    ['OCaml','functional / compilers','static','Intermediate → expert','Algebraic types, pattern matching, modules and compiler/research systems.','https://ocaml.org/docs'],
    ['Elixir','distributed / concurrent','dynamic','Intermediate → advanced','BEAM/OTP concurrency, fault isolation and distributed services.','https://elixir-lang.org/getting-started/introduction.html'],
    ['Erlang','telecom / distributed','dynamic','Intermediate → expert','Actor-style concurrency, supervision and highly available systems.','https://www.erlang.org/doc/system/getting_started.html'],
    ['Ruby','web / scripting','dynamic','Beginner → advanced','Expressive scripting and web development; learn objects, blocks and testing.','https://www.ruby-lang.org/en/documentation/quickstart/'],
    ['PHP','web / backend','dynamic','Beginner → advanced','Server-side web development across a large production ecosystem.','https://www.php.net/manual/en/getting-started.php'],
    ['Lua','games / embedded scripting','dynamic','Beginner → advanced','Small embeddable language widely used for game and application scripting.','https://www.lua.org/manual/5.4/'],
    ['Assembly','architecture / embedded / reversing','machine-specific','Advanced → expert','Registers, calling conventions, instructions, memory layout and hardware-level reasoning.','https://www.nasm.us/docs.php'],
    ['SystemVerilog / Verilog','FPGA / ASIC','HDL','Intermediate → expert','Describe and verify digital hardware, clocks, state machines and interfaces.','https://www.chipverify.com/systemverilog/systemverilog-tutorial'],
    ['VHDL','FPGA / ASIC','HDL','Intermediate → expert','Strongly typed hardware description for digital design and verification.','https://standards.ieee.org/standard/1076-2019.html'],
    ['CUDA C++','GPU / HPC / AI','parallel native','Advanced → expert','Kernels, warps, memory hierarchy and GPU performance engineering.','https://docs.nvidia.com/cuda/cuda-c-programming-guide/'],
    ['WGSL','WebGPU shaders / compute','shader','Advanced','Shader and compute language for WebGPU pipelines.','https://www.w3.org/TR/WGSL/'],
    ['GLSL','OpenGL / Vulkan shaders','shader','Advanced','Programmable graphics stages, vector math and GPU rendering.','https://registry.khronos.org/OpenGL/index_gl.php'],
    ['HLSL','Direct3D / shaders','shader','Advanced','Microsoft shader language for programmable rendering and GPU compute.','https://learn.microsoft.com/windows/win32/direct3dhlsl/dx-graphics-hlsl'],
    ['Qiskit / Python','quantum circuits','quantum SDK','Intermediate → research','Construct, transpile, simulate and run quantum circuits from Python.','https://quantum.cloud.ibm.com/docs/'],
    ['Cirq / Python','quantum circuits','quantum SDK','Intermediate → research','Device-aware quantum circuit construction and simulation.','https://quantumai.google/cirq'],
    ['Q#','quantum algorithms','quantum language','Intermediate → research','Quantum programming language and resource-estimation ecosystem.','https://learn.microsoft.com/azure/quantum/qsharp-overview'],
    ['HTML','web structure','markup','Beginner','Semantic document and application structure; pair with CSS and JavaScript.','https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content'],
    ['CSS','web presentation','stylesheet','Beginner → expert','Layout, cascade, responsive design, animation and design-system implementation.','https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics']
  ];
  function renderLanguages(){
    const q=($('language-filter')?.value||'').trim().toLowerCase();
    const body=$('language-rows'); if(!body)return;
    const rows=languages.filter(r=>r.join(' ').toLowerCase().includes(q)).map(r=>{
      const tr=document.createElement('tr');
      r.slice(0,5).forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});
      const td=document.createElement('td'),a=document.createElement('a');a.href=r[5];a.target='_blank';a.rel='noopener noreferrer';a.textContent='Official / primary docs ↗';td.append(a);tr.append(td);return tr;
    });
    body.replaceChildren(...rows); $('language-count').textContent=rows.length+' ecosystems shown';
  }
  $('language-filter')?.addEventListener('input',renderLanguages); renderLanguages();

  const frame=$('code-frame'),code=$('code-input'),mode=$('sandbox-mode'),out=$('code-output');
  const examples={
    javascript:`const values = [4, 8, 15, 16, 23, 42];
const mean = values.reduce((a,b) => a+b, 0) / values.length;
console.log({count: values.length, mean});
console.log(values.filter(x => x > mean));`,
    html:`<!doctype html>
<meta charset="utf-8">
<style>
  body{font:16px system-ui;padding:1rem}
  button{padding:.6rem 1rem}
</style>
<h1>Hello, browser.</h1>
<button id="b">Count: 0</button>
<script>
let n=0;
b.onclick=()=>b.textContent='Count: '+(++n);
<\/script>`
  };
  function safeScript(value){return value.replace(/<\/script/gi,'<\\/script');}
  function runSandbox(){
    if(!frame||!code)return;
    out.textContent='Running in a sandboxed frame with network access blocked…';
    const selected=mode.value;
    if(selected==='html'){
      frame.srcdoc=`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: blob:"><meta charset="utf-8">${code.value}`;
      out.textContent='HTML/CSS/JavaScript preview loaded. The frame cannot access this page or make network requests.';
      return;
    }
    const user=safeScript(code.value);
    frame.srcdoc=`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><pre id="o"></pre><script>
const lines=[];const print=(kind,args)=>{lines.push(kind+': '+args.map(x=>{try{return typeof x==='string'?x:JSON.stringify(x)}catch{return String(x)}}).join(' '));o.textContent=lines.join('\\n')};
console.log=(...a)=>print('log',a);console.error=(...a)=>print('error',a);
addEventListener('error',e=>print('exception',[e.message]));
try{(async()=>{${user}
})().catch(e=>print('rejection',[e&&e.stack||String(e)]))}catch(e){print('exception',[e&&e.stack||String(e)])}
<\/script>`;
    out.textContent='JavaScript executed in the isolated frame. Read console output inside the preview.';
  }
  $('run-code')?.addEventListener('click',runSandbox);
  $('reset-code')?.addEventListener('click',()=>{code.value=examples[mode.value];runSandbox();});
  mode?.addEventListener('change',()=>{code.value=examples[mode.value];runSandbox();});
  if(code&&mode){code.value=examples[mode.value];runSandbox();}

  const complexity={
    constant:n=>1,
    logarithmic:n=>Math.max(1,Math.log2(n)),
    linear:n=>n,
    nlogn:n=>n*Math.max(1,Math.log2(n)),
    quadratic:n=>n*n,
    cubic:n=>n*n*n,
    exponential:n=>Math.pow(2,Math.min(n,52))
  };
  function calcComplexity(){
    const n=Math.max(1,Math.min(1e7,Number($('complexity-n').value)||1));
    const key=$('complexity-class').value,ops=complexity[key](n);
    const label=ops>1e15?ops.toExponential(3):Math.round(ops).toLocaleString();
    const ratio=Math.min(100,Math.max(1,Math.log10(Math.max(10,ops))/15*100));
    $('complexity-output').innerHTML='<strong>Relative work estimate: '+label+' operations</strong><p>This is a growth-rate teaching model, not a benchmark. Constants, cache behavior, vectorization, I/O, compiler optimization, hardware and input distribution can dominate real runtime.</p>';
    $('complexity-meter').style.width=ratio+'%';
  }
  $('complexity-n')?.addEventListener('input',calcComplexity);
  $('complexity-class')?.addEventListener('change',calcComplexity); calcComplexity();

  const debugStages={
    syntax:['Read the exact parser/compiler message.','Reduce to the smallest failing statement.','Check delimiters, types, imports and language version.','Add a regression test once fixed.'],
    runtime:['Capture the stack trace and inputs.','Reproduce deterministically.','Inspect invariants before the failing line.','Fix the cause, not the exception text; add a regression test.'],
    logic:['Write the expected behavior as examples.','Instrument intermediate state.','Bisect the computation and compare expected vs actual values.','Turn the discovered case into a unit/property test.'],
    performance:['Measure before optimizing.','Profile CPU, allocation, I/O and contention.','Identify the dominant hot path.','Change one factor, benchmark again, and preserve correctness tests.'],
    concurrency:['Record ordering, ownership and shared state.','Make races reproducible with stress or deterministic scheduling where possible.','Remove unnecessary sharing; use clear synchronization/message boundaries.','Add race/deadlock/time-out tests and observability.'],
    distributed:['Separate local code failures from network/consistency failures.','Track request IDs, retries, deadlines and idempotency.','Model partial failure and stale data explicitly.','Test partitions, duplication, reordering and recovery.']
  };
  function makeDebugPlan(){
    const kind=$('debug-kind').value;
    const symptom=($('debug-symptom').value||'the reported failure').trim().slice(0,240);
    const ol=document.createElement('ol');
    debugStages[kind].forEach((x,i)=>{const li=document.createElement('li');li.textContent=(i===0?'For “'+symptom+'”: ':'')+x;ol.append(li);});
    const target=$('debug-output');target.replaceChildren(ol);
  }
  $('build-debug-plan')?.addEventListener('click',makeDebugPlan);makeDebugPlan();

  const tracks={
    web:['Semantic HTML + CSS + JavaScript','HTTP, browser APIs and accessibility','TypeScript and a framework after fundamentals','Backend/API + database','Testing, performance, security and deployment','Ship an accessible full-stack application'],
    systems:['C and computer architecture','Memory, processes, threads and filesystems','Rust or modern C++','Networking and concurrency','Profiling, debugging and build systems','Build a systems tool with benchmarks and fault tests'],
    data:['Python + SQL','Statistics and data cleaning','NumPy/pandas + visualization','Data modeling and pipelines','ML foundations + evaluation','Ship a reproducible analysis or data service'],
    ai:['Python + linear algebra/probability','Data pipelines and classical ML','Deep learning + transformers','Retrieval, tools, agents and evaluation','Safety, security, observability and cost','Ship an evaluated AI system with failure cases'],
    game:['Programming + vectors/matrices','Game loop, input and state','Rendering, physics and animation','AI, audio and asset pipelines','Profiling, platform adaptation and QA','Ship a small polished game before building an engine'],
    embedded:['C + digital logic','MCUs, memory-mapped I/O and interrupts','Protocols: UART/SPI/I²C/CAN','RTOS/concurrency and timing','Debug probes, power and reliability','Build hardware-in-the-loop tests'],
    hpc:['C/C++/Fortran or Julia + numerical methods','Caches, SIMD and performance models','Threads/OpenMP','MPI/distributed memory','GPU programming and profiling','Validate scaling, numerical error and reproducibility'],
    quantum:['Linear algebra + complex probability','Qubits, gates, measurement and circuits','Classical simulation and noise','Algorithms + complexity assumptions','Error correction and hardware constraints','Implement with Qiskit/Cirq and compare simulator vs hardware limits']
  };
  function renderTrack(){
    const t=tracks[$('track-select').value],ol=document.createElement('ol');
    t.forEach(x=>{const li=document.createElement('li');li.textContent=x;ol.append(li);});
    $('track-output').replaceChildren(ol);
  }
  $('track-select')?.addEventListener('change',renderTrack);renderTrack();
})();
