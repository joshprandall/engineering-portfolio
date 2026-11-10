(() => {
  const root = document.querySelector('[data-software-lab]');
  if (!root) return;

  const type = root.dataset.softwareLab;
  const statusEl = root.querySelector('.showcase-lab-status');
  const visualEl = root.querySelector('.showcase-lab-visual');
  const outputEl = root.querySelector('.showcase-lab-output');
  let step = 0;

  const metric = (label, value) =>
    '<div class="showcase-metric"><span>' + label + '</span><strong>' + value + '</strong></div>';

  const metrics = (items) =>
    '<div class="showcase-metrics">' + items.map(([a,b]) => metric(a,b)).join('') + '</div>';

  const table = (headers, rows) =>
    '<div style="overflow:auto"><table class="showcase-table"><thead><tr>' +
    headers.map(h => '<th>' + h + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';

  const callout = (text) => '<div class="showcase-callout">' + text + '</div>';

  function workflow() {
    const failed = step === 1;
    const replay = step === 2;
    const rows = [
      ['1','OrderCreated','accepted','evt-1001'],
      ['2','PaymentReserved',failed ? 'retrying' : 'complete','evt-1002'],
      ['3',failed ? 'PaymentReserved' : 'InventoryAllocated',failed ? 'deduplicated' : 'complete',failed ? 'evt-1002' : 'evt-1003'],
      ['4',replay ? 'ReplayCheckpoint' : 'ShipmentQueued',replay ? 'verified' : failed ? 'blocked' : 'complete','evt-1004']
    ];
    return {
      status: 'Workflow engine · ' + (failed ? 'worker failure injected' : replay ? 'event stream replayed' : 'baseline'),
      visual: metrics([
        ['State', failed ? 'PAYMENT_PENDING' : 'READY_TO_SHIP'],
        ['Events', String(rows.length)],
        ['Duplicate effects', '0'],
        ['Replay deterministic', 'YES']
      ]) + table(['Seq','Event','Result','Idempotency key'], rows),
      output: callout(failed
        ? 'The duplicate delivery reuses the same idempotency key, so the side effect is not applied twice.'
        : replay
          ? 'Replaying the immutable event stream reconstructs the same aggregate state without consulting mutable history.'
          : 'The state machine advances only through explicit events, making transitions auditable and testable.')
    };
  }

  function apiContract() {
    const breaking = step === 1;
    const additive = step === 2;
    const rows = breaking
      ? [['GET /users/{id}','response.email','removed','BREAKING'],['POST /users','request.name','required','BREAKING'],['GET /users','response.pageToken','added','compatible']]
      : additive
        ? [['GET /users/{id}','response.timezone','added','compatible'],['POST /users','request.locale','optional','compatible'],['GET /users','query.limit','widened','compatible']]
        : [['GET /users/{id}','response.id','unchanged','compatible'],['POST /users','request.name','unchanged','compatible'],['GET /users','response.items','unchanged','compatible']];
    return {
      status: 'API compatibility analysis · ' + (breaking ? 'breaking diff' : additive ? 'additive diff' : 'baseline'),
      visual: metrics([
        ['Breaking changes', breaking ? '2' : '0'],
        ['Compatible changes', breaking ? '1' : additive ? '3' : '3'],
        ['Endpoints checked','3'],
        ['Release gate', breaking ? 'BLOCK' : 'PASS']
      ]) + table(['Endpoint','Contract element','Change','Verdict'], rows),
      output: callout(breaking
        ? 'The release gate blocks removal of a response field and introduction of a new required request field.'
        : 'Additive optional fields and widened constraints remain backward-compatible for existing clients.')
    };
  }

  function migration() {
    const destructive = step === 1;
    const expanded = step === 2;
    const rows = destructive
      ? [['1','ALTER users DROP COLUMN legacy_name','high','table rewrite / client break'],['2','Deploy app','high','old version incompatible'],['3','Rollback','high','data lost']]
      : expanded
        ? [['1','ADD display_name nullable','low','online'],['2','Dual-write + backfill','medium','bounded batches'],['3','Switch reads','low','feature flag'],['4','Remove legacy later','low','after verification']]
        : [['1','ADD index concurrently','low','online'],['2','Verify query plan','low','read-only'],['3','Promote','low','reversible']];
    return {
      status: 'Migration planner · ' + (destructive ? 'destructive change' : expanded ? 'expand / contract plan' : 'baseline'),
      visual: metrics([
        ['Risk', destructive ? 'HIGH' : expanded ? 'LOW' : 'LOW'],
        ['Backward compatible', destructive ? 'NO' : 'YES'],
        ['Rollback path', destructive ? 'WEAK' : 'STRONG'],
        ['Blocking step', destructive ? 'YES' : 'NO']
      ]) + table(['Step','Operation','Risk','Reason'], rows),
      output: callout(destructive
        ? 'The direct destructive migration couples schema change and application deployment, producing a weak rollback path.'
        : 'Expand/contract separates schema evolution from application cutover so old and new versions can overlap safely.')
    };
  }

  function scheduler() {
    const spike = step === 1;
    const scale = step === 2;
    const queued = spike ? 48 : scale ? 16 : 9;
    const workers = scale ? 8 : 4;
    const rows = [
      ['interactive-api','high',spike ? 'running' : 'running','120 ms'],
      ['report-001','normal',spike ? 'queued' : 'running','2.1 s'],
      ['etl-042','bulk',spike ? 'deferred' : scale ? 'running' : 'queued','8.4 s'],
      ['thumbnail-77','normal',spike ? 'queued' : 'running','310 ms']
    ];
    return {
      status: 'Concurrent scheduler · ' + (spike ? 'queue spike' : scale ? 'worker pool scaled' : 'baseline'),
      visual: metrics([
        ['Workers', String(workers)],
        ['Queued jobs', String(queued)],
        ['Admission policy', spike ? 'BACKPRESSURE' : 'OPEN'],
        ['High-priority SLA', spike ? 'PROTECTED' : 'HEALTHY']
      ]) + table(['Job','Priority','State','Expected service'], rows),
      output: callout(spike
        ? 'Backpressure prevents unbounded queue growth and protects high-priority work instead of letting overload collapse every request class.'
        : scale
          ? 'Increasing worker capacity reduces queue depth while preserving priority ordering and bounded concurrency.'
          : 'The scheduler caps concurrency, separates priority classes, and keeps queue behavior observable.')
    };
  }

  function cache() {
    const invalidated = step === 1;
    const singleFlight = step === 2;
    const rows = invalidated
      ? [['profile:42','MISS','origin','18 req','stampede risk'],['permissions:42','HIT','cache','1 req','fresh']]
      : singleFlight
        ? [['profile:42','MISS','single-flight','1 origin req','coalesced'],['permissions:42','HIT','cache','0 origin req','fresh']]
        : [['profile:42','HIT','cache','0 origin req','fresh'],['permissions:42','HIT','cache','0 origin req','fresh']];
    return {
      status: 'Cache consistency model · ' + (invalidated ? 'hot key invalidated' : singleFlight ? 'single-flight enabled' : 'baseline'),
      visual: metrics([
        ['Hit ratio', invalidated ? '51%' : singleFlight ? '92%' : '97%'],
        ['Origin requests', invalidated ? '19' : singleFlight ? '1' : '0'],
        ['Stale reads','0'],
        ['Stampede protection', singleFlight ? 'ON' : invalidated ? 'OFF' : 'ON']
      ]) + table(['Key','Cache result','Path','Origin load','Consistency'], rows),
      output: callout(invalidated
        ? 'A hot-key invalidation without request coalescing can create a thundering herd against the origin.'
        : singleFlight
          ? 'Single-flight collapses concurrent misses into one origin request while preserving a fresh cache fill.'
          : 'Baseline cache-aside behavior is healthy while freshness and origin load stay explicit.')
    };
  }

  function release() {
    const degraded = step === 1;
    const advance = step === 2;
    const pct = degraded ? 10 : advance ? 50 : 5;
    const error = degraded ? 4.8 : advance ? 0.7 : 0.5;
    const rows = [
      ['stable','v2.8.3',(100-pct)+'%', '0.4%','healthy'],
      ['canary','v2.9.0',pct+'%', error+'%', degraded ? 'rollback' : advance ? 'advance' : 'observe']
    ];
    return {
      status: 'Progressive delivery · ' + (degraded ? 'canary degraded' : advance ? 'rollout advanced' : 'baseline'),
      visual: metrics([
        ['Canary traffic', pct+'%'],
        ['Canary error rate', error+'%'],
        ['SLO threshold','2.0%'],
        ['Decision', degraded ? 'ROLLBACK' : advance ? 'ADVANCE' : 'HOLD']
      ]) + table(['Cohort','Version','Traffic','Errors','Action'], rows),
      output: callout(degraded
        ? 'The rollout automatically stops because the canary error rate exceeds the modeled SLO threshold.'
        : advance
          ? 'The canary remains inside its guardrail, so the next cohort can receive the release.'
          : 'Progressive delivery keeps blast radius small while collecting evidence before a wider rollout.')
    };
  }

  function compiler() {
    const error = step === 2;
    const rows = error
      ? [['let','KEYWORD','line 1'],['count','IDENT','line 1'],['=','ASSIGN','line 1'],['"five"','STRING','line 1'],['+','PLUS','line 2'],['1','NUMBER','line 2']]
      : [['let','KEYWORD','line 1'],['count','IDENT','line 1'],['=','ASSIGN','line 1'],['5','NUMBER','line 1'],['+','PLUS','line 2'],['1','NUMBER','line 2']];
    return {
      status: step === 0 ? 'Source program ready · compile' : error ? 'Mini compiler pipeline · type error detected' : 'Mini compiler pipeline · valid program compiled',
      visual: metrics([
        ['Tokens','6'],
        ['AST nodes','5'],
        ['Type errors', error ? '1' : '0'],
        ['Compile result', error ? 'FAIL' : 'PASS']
      ]) + table(['Lexeme','Token','Location'], rows),
      output: callout(error
        ? 'Static analysis rejects STRING + NUMBER before execution and reports the source location.'
        : 'The tokenizer, parser and type checker agree on a numeric expression, producing a valid typed AST.')
    };
  }

  function messaging() {
    const duplicate = step === 1;
    const protectedMode = step === 2;
    const rows = duplicate
      ? [['msg-201','order.created','attempt 1','processed'],['msg-201','order.created','attempt 2','DUPLICATE'],['msg-202','email.send','attempt 1','processed']]
      : protectedMode
        ? [['msg-201','order.created','attempt 1','processed'],['msg-201','order.created','attempt 2','deduplicated'],['outbox-77','billing.updated','publish','committed']]
        : [['msg-201','order.created','attempt 1','processed'],['msg-202','email.send','attempt 1','processed'],['outbox-77','billing.updated','publish','committed']];
    return {
      status: 'Reliable message processing · ' + (duplicate ? 'duplicate delivery' : protectedMode ? 'idempotency + outbox' : 'baseline'),
      visual: metrics([
        ['Messages','3'],
        ['Duplicate side effects', protectedMode ? '0' : duplicate ? '1 risk' : '0'],
        ['Outbox state','committed'],
        ['Delivery model','at-least-once']
      ]) + table(['ID','Event','Delivery','Result'], rows),
      output: callout(duplicate
        ? 'At-least-once delivery can repeat a message; without idempotency the consumer risks applying the side effect twice.'
        : protectedMode
          ? 'Idempotency keys suppress duplicate effects, while the transactional outbox closes the database/message-publish gap.'
          : 'The baseline flow makes delivery semantics and persistence boundaries explicit rather than assuming exactly-once behavior.')
    };
  }

  const renderers = {
    workflow,
    api: apiContract,
    migration,
    scheduler,
    cache,
    release,
    compiler,
    messaging
  };

  function render() {
    const fn = renderers[type];
    if (!fn) return;
    const result = fn();
    statusEl.textContent = result.status;
    visualEl.innerHTML = result.visual;
    outputEl.innerHTML = result.output;
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-showcase-action]');
    if (!button) return;
    const action = button.dataset.showcaseAction;
    step = action === 'reset' ? 0 : action === 'primary' ? 1 : 2;
    render();
  });

  render();
})();