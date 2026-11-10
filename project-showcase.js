(() => {
  const root = document.querySelector('[data-showcase-lab]');
  if (!root) return;

  const type = root.dataset.showcaseLab;
  const statusEl = root.querySelector('.showcase-lab-status');
  const visualEl = root.querySelector('.showcase-lab-visual');
  const outputEl = root.querySelector('.showcase-lab-output');
  let step = 0;

  const metric = (label, value) =>
    '<div class="showcase-metric"><span>' + label + '</span><strong>' + value + '</strong></div>';

  const metrics = (items) =>
    '<div class="showcase-metrics">' + items.map(([label, value]) => metric(label, value)).join('') + '</div>';

  const table = (headers, rows) =>
    '<div style="overflow:auto"><table class="showcase-table"><thead><tr>' +
    headers.map((h) => '<th>' + h + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map((row) => '<tr>' + row.map((cell) => '<td>' + cell + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';

  const callout = (text) => '<div class="showcase-callout">' + text + '</div>';

  const nodes = (items) =>
    '<div class="showcase-topology">' +
    items.map(([name, cls, note]) =>
      '<div class="showcase-node ' + (cls || '') + '"><strong>' + name + '</strong><br><small>' + (note || '') + '</small></div>'
    ).join('') +
    '</div>';

  function renderDigitalTwin() {
    const failed = step === 1 ? 'CORE-B ↔ DIST-2' : step === 2 ? 'DIST-1 ↔ EDGE-1' : 'none';
    const score = failed === 'none' ? 96 : failed.includes('CORE-B') ? 78 : 84;
    return {
      status: 'Synthetic topology · ' + (failed === 'none' ? 'baseline' : 'failure: ' + failed),
      visual:
        metrics([
          ['Reachability', failed === 'none' ? '100%' : '92%'],
          ['Resilience', score + '/100'],
          ['Single points', failed === 'none' ? '0' : '1'],
          ['Risk', score > 90 ? 'LOW' : 'MEDIUM']
        ]) +
        nodes([
          ['CORE-A', '', 'healthy'],
          ['CORE-B', failed.includes('CORE-B') ? 'down' : '', 'healthy'],
          ['DIST-1', '', '2 uplinks'],
          ['DIST-2', failed.includes('DIST-2') ? 'hot' : '', 'alternate path'],
          ['EDGE-1', failed.includes('EDGE-1') ? 'down' : '', 'robotics VLAN']
        ]),
      output: callout(
        failed === 'none'
          ? 'All modeled services retain redundant paths.'
          : 'Reachability mostly survives, but the change creates a single-path condition and a clear rollback trigger.'
      )
    };
  }

  function renderRf() {
    const traceA = [
      ['10:00:58', 'AP-04', '-58', '31', '8%', '11%', 'associated'],
      ['10:01:04', 'AP-04', '-66', '23', '19%', '18%', 'roam candidate'],
      ['10:01:09', 'AP-01', '-61', '28', '22%', '16%', 'auth rejection'],
      ['10:01:13', 'AP-01', '-59', '30', '9%', '15%', 'connected']
    ];
    const traceB = [
      ['19:00', 'AP-12', '-55', '34', '21%', '13%', 'stable'],
      ['19:05', 'AP-12', '-56', '33', '20%', '14%', 'stable'],
      ['19:10', 'AP-12', '-54', '35', '19%', '13%', 'stable']
    ];
    const alternate = step === 2;
    const rows = alternate ? traceB : traceA;
    return {
      status: 'Client evidence window ' + (alternate ? 'B' : 'A'),
      visual:
        metrics([
          ['Hypothesis', alternate ? 'client-local' : 'roam + auth'],
          ['RF interference', 'stable'],
          ['Retry spike', alternate ? 'no' : 'localized'],
          ['Confidence', alternate ? '72%' : '88%']
        ]) +
        table(['Time', 'AP', 'RSSI', 'SNR', 'Retries', 'RX util', 'Event'], rows),
      output: callout(
        alternate
          ? 'Stable RF conditions do not support a facility-wide interference event.'
          : 'The strongest evidence aligns the roam attempt with authentication failure rather than a site-wide RF spike.'
      )
    };
  }

  function renderRouting() {
    const failed = step === 1;
    const metricChanged = step === 2;
    const rows = failed
      ? [['A-D-C', '27', 'selected'], ['A-B-C', '—', 'link down']]
      : metricChanged
        ? [['A-D-C', '27', 'selected'], ['A-B-C', '31', 'de-preferred']]
        : [['A-B-C', '20', 'selected'], ['A-D-C', '27', 'alternate']];
    return {
      status: 'Routing domain · ' + (failed ? 'preferred link failed' : metricChanged ? 'metric changed' : 'baseline'),
      visual:
        metrics([
          ['Selected', rows[0][0]],
          ['Cost', rows[0][1]],
          ['Alternate', rows[1][0]],
          ['Loop', 'NO']
        ]) +
        table(['Path', 'Cost', 'State'], rows),
      output: callout(
        failed
          ? 'Convergence succeeds because the alternate path remains loop-free.'
          : 'Path selection follows the modeled cost and keeps the alternate visible before a change.'
      )
    };
  }

  function renderFailover() {
    const degraded = step === 1;
    const wired = degraded ? { lat: 168, loss: 6.2, jit: 44 } : { lat: 12, loss: 0.1, jit: 2 };
    return {
      status: 'Edge path decision · ' + (degraded ? 'primary violates SLA' : 'baseline'),
      visual:
        metrics([
          ['Active', degraded ? '5G backup' : 'wired primary'],
          ['Wired latency', wired.lat + ' ms'],
          ['Wired loss', wired.loss + '%'],
          ['5G latency', '38 ms']
        ]) +
        table(
          ['Path', 'Latency', 'Loss', 'Jitter', 'Decision'],
          [
            ['Wired', wired.lat + ' ms', wired.loss + '%', wired.jit + ' ms', degraded ? 'fail SLA' : 'preferred'],
            ['5G', '38 ms', '0.4%', '8 ms', degraded ? 'active' : 'standby']
          ]
        ),
      output: callout(
        degraded
          ? 'Failover occurs because loss and latency breach policy together—not merely because an interface changed state.'
          : 'Primary stays preferred while measured service objectives remain healthy.'
      )
    };
  }

  function renderRustFlow() {
    const allFlows = [
      ['10.0.0.12', '10.0.8.20', 'TCP', 1843200, 1460, 12],
      ['10.0.0.44', '10.0.8.20', 'UDP', 820000, 910, 28],
      ['10.0.0.12', '10.0.4.7', 'TCP', 430000, 390, 9],
      ['10.0.0.81', '10.0.9.10', 'UDP', 160000, 220, 48]
    ];
    const protocol = step === 2 ? 'TCP' : 'ALL';
    const rows = allFlows.filter((f) => protocol === 'ALL' || f[2] === protocol);
    const totalBytes = rows.reduce((sum, row) => sum + row[3], 0);
    return {
      status: 'Rust aggregation model · ' + protocol,
      visual:
        metrics([
          ['Flows', String(rows.length)],
          ['Bytes', totalBytes.toLocaleString()],
          ['Top talker', rows[0][0]],
          ['Max latency', Math.max(...rows.map((row) => row[5])) + ' ms']
        ]) +
        table(['Source', 'Destination', 'Proto', 'Bytes', 'Packets', 'Latency'], rows),
      output: callout(
        'A Rust standard-library CLI in the repository implements the same aggregation model against synthetic CSV flow records.'
      )
    };
  }

  function renderIncident() {
    const conflicting = step === 2;
    const rows = [
      ['14:03:11', 'network', 'edge-02', 'packet loss 7.8%', 'high'],
      ['14:03:14', 'system', 'robot-gw', 'retransmits rising', 'medium'],
      ['14:03:17', 'app', 'teleop', 'latency SLA breach', 'high'],
      ['14:03:21', 'security', 'edge-02', conflicting ? 'no policy change' : 'ACL change 4m earlier', conflicting ? 'info' : 'medium']
    ];
    return {
      status: 'Evidence graph · ' + (conflicting ? 'conflicting signal' : 'baseline'),
      visual:
        metrics([
          ['Signals', String(rows.length)],
          ['Entities', '3'],
          ['Hypothesis', conflicting ? 'path impairment' : 'network change'],
          ['Confidence', conflicting ? '67%' : '86%']
        ]) +
        table(['Time', 'Domain', 'Entity', 'Evidence', 'Weight'], rows),
      output: callout(
        conflicting
          ? 'Confidence drops because contradictory evidence is preserved instead of ignored.'
          : 'Temporal/entity correlation ranks the network-change hypothesis highest while showing its evidence.'
      )
    };
  }

  function renderZeroTrust() {
    const drift = step === 2;
    const rows = drift
      ? [
          ['Identity', 'contractor', 'limited'],
          ['Device', 'unmanaged', 'fail'],
          ['Zone', 'guest', 'external'],
          ['Resource', 'robot-admin', 'critical'],
          ['Policy', 'broad exception', 'DRIFT']
        ]
      : [
          ['Identity', 'engineer', 'verified'],
          ['Device', 'managed', 'pass'],
          ['MFA', 'phishing-resistant', 'pass'],
          ['Zone', 'corp', 'trusted'],
          ['Resource', 'telemetry-read', 'moderate']
        ];
    return {
      status: 'Policy evaluation · ' + (drift ? 'drift' : 'baseline'),
      visual:
        metrics([
          ['Decision', drift ? 'DENY / REVIEW' : 'ALLOW'],
          ['Risk', drift ? 'HIGH' : 'LOW'],
          ['Policy drift', drift ? 'YES' : 'NO'],
          ['Blast radius', drift ? 'admin plane' : 'read-only']
        ]) +
        table(['Context', 'Value', 'Result'], rows),
      output: callout(
        drift
          ? 'The exception would over-broaden access to a critical resource; the blast radius is visible before publication.'
          : 'The request meets identity, device and resource constraints without broadening access.'
      )
    };
  }

  function renderChaos() {
    const mode = step;
    const up = mode === 0 ? 5 : mode === 1 ? 3 : 4;
    return {
      status: 'Five-node service · ' + (mode === 0 ? 'healthy' : mode === 1 ? 'network partition' : 'leader failure'),
      visual:
        metrics([
          ['Nodes', up + '/5'],
          ['Quorum', '3'],
          ['Writes', up >= 3 ? 'YES' : 'NO'],
          ['Invariant', 'single committed value']
        ]) +
        nodes([
          ['N1', mode === 2 ? 'down' : '', 'leader'],
          ['N2', mode === 1 ? 'hot' : '', 'follower'],
          ['N3', '', 'follower'],
          ['N4', mode === 1 ? 'hot' : '', 'follower'],
          ['N5', '', 'follower']
        ]),
      output: callout(
        mode === 0
          ? 'Healthy cluster has quorum.'
          : mode === 1
            ? 'The majority can commit; the minority partition cannot.'
            : 'Leader loss remains survivable while quorum is intact.'
      )
    };
  }

  function renderHpc() {
    const hot = step === 2;
    const rows = hot
      ? [['NODE-A', '2', '80 GB', 'hot link', '52'], ['NODE-B', '4', '320 GB', 'remote', '70'], ['NODE-C/D', '4', '304 GB', 'paired', '88']]
      : [['NODE-A', '4', '320 GB', 'local', '96'], ['NODE-B', '4', '320 GB', 'remote', '72'], ['NODE-C', '2', '160 GB', 'local', '80']];
    return {
      status: 'Synthetic GPU fabric · ' + (hot ? 'hotspot injected' : 'baseline'),
      visual:
        metrics([
          ['Workload', hot ? 'LLM fine-tune' : 'CFD solver'],
          ['GPU request', hot ? '4' : '2'],
          ['Memory', hot ? '72 GB/GPU' : '28 GB/GPU'],
          ['Placement', hot ? 'NODE-C / D' : 'NODE-A']
        ]) +
        table(['Node', 'Free GPUs', 'VRAM', 'Locality', 'Score'], rows),
      output: callout(
        hot
          ? 'The scheduler trades simplicity for better fabric locality.'
          : 'Single-node placement minimizes communication cost and preserves capacity.'
      )
    };
  }

  function renderHybrid() {
    const queued = step === 2;
    const rows = [
      ['Linear algebra', 'GPU', '0.93', 'low queue'],
      ['Classical search', 'CPU/GPU', '0.82', 'parallel'],
      ['Variational circuit', queued ? 'CPU simulator' : 'QPU', '0.76', queued ? 'QPU queue high' : 'candidate'],
      ['Validation', 'CPU', '1.00', 'required']
    ];
    return {
      status: 'Hybrid router · ' + (queued ? 'QPU queue high' : 'baseline'),
      visual:
        metrics([
          ['Selected', queued ? 'GPU + CPU sim' : 'QPU + CPU verify'],
          ['QPU queue', queued ? '42 min' : '4 min'],
          ['Verification', 'classical'],
          ['Decision trace', 'visible']
        ]) +
        table(['Task', 'Backend', 'Suitability', 'Reason'], rows),
      output: callout(
        queued
          ? 'The router avoids QPU use when queue cost dominates the modeled benefit.'
          : 'QPU use is limited to a candidate task and still requires classical verification.'
      )
    };
  }

  const renderers = {
    'digital-twin': renderDigitalTwin,
    rf: renderRf,
    routing: renderRouting,
    failover: renderFailover,
    'rust-flow': renderRustFlow,
    incident: renderIncident,
    'zero-trust': renderZeroTrust,
    chaos: renderChaos,
    hpc: renderHpc,
    hybrid: renderHybrid
  };

  function render() {
    const renderer = renderers[type];
    if (!renderer) return;
    const result = renderer();
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