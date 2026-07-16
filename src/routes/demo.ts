import type { FastifyInstance } from 'fastify'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Demeter Yield Optimizer — Demo</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: #09090b; color: #e4e4e7; line-height: 1.5;
    min-height: 100vh;
  }
  .container { max-width: 1040px; margin: 0 auto; padding: 2rem 1rem; }

  header {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;
    margin-bottom: 2rem; padding-bottom: 1rem;
    border-bottom: 1px solid #27272a;
  }
  header h1 { font-size: 1.5rem; font-weight: 700; color: #f4f4f5; display: flex; align-items: center; gap: 0.5rem; }
  header h1 .accent { color: #22c55e; }
  .header-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .badge {
    font-size: 0.7rem; padding: 0.25rem 0.65rem; border-radius: 999px;
    background: #22c55e15; color: #4ade80; border: 1px solid #22c55e30;
    font-weight: 500; letter-spacing: 0.02em;
  }
  .badge-purple { background: #a855f715; color: #c084fc; border-color: #a855f730; }
  .badge-amber { background: #f59e0b15; color: #fbbf24; border-color: #f59e0b30; }

  .health {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-size: 0.8rem; color: #a1a1aa; margin-bottom: 1.5rem;
    padding: 0.4rem 1rem; border-radius: 999px; background: #18181b;
    border: 1px solid #27272a;
  }
  .health-dot { width: 7px; height: 7px; border-radius: 50%; }
  .health-dot.ok { background: #22c55e; box-shadow: 0 0 6px #22c55e88; }
  .health-dot.error { background: #ef4444; }

  .card {
    background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem;
    padding: 1.5rem; margin-bottom: 1.25rem;
  }
  .card h2 {
    font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem; color: #f4f4f5;
    display: flex; align-items: center; gap: 0.5rem;
  }

  .trust-banner {
    background: linear-gradient(135deg, #052e16 0%, #18181b 100%);
    border: 1px solid #22c55e25; border-radius: 0.75rem;
    padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
    display: flex; align-items: flex-start; gap: 1rem;
  }
  .trust-banner .shield {
    font-size: 1.75rem; flex-shrink: 0; margin-top: 0.1rem;
  }
  .trust-banner h3 { font-size: 0.9rem; font-weight: 600; color: #4ade80; margin-bottom: 0.3rem; }
  .trust-banner p { font-size: 0.8rem; color: #a1a1aa; line-height: 1.6; }
  .trust-banner p strong { color: #e4e4e7; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
  .form-group.full { grid-column: 1 / -1; }
  .form-group label { font-size: 0.7rem; font-weight: 500; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-group input, .form-group select {
    background: #09090b; border: 1px solid #3f3f46; border-radius: 0.45rem;
    padding: 0.55rem 0.7rem; color: #e4e4e7; font-size: 0.85rem;
    transition: border-color 0.15s;
  }
  .form-group input:focus, .form-group select:focus {
    outline: none; border-color: #22c55e; box-shadow: 0 0 0 1px #22c55e30;
  }

  .btn {
    display: inline-flex; align-items: center; gap: 0.45rem;
    padding: 0.6rem 1.25rem; border-radius: 0.45rem; font-size: 0.85rem;
    font-weight: 600; cursor: pointer; border: none; transition: all 0.15s;
  }
  .btn-primary {
    background: linear-gradient(135deg, #22c55e, #16a34a); color: #052e16;
    box-shadow: 0 1px 8px #22c55e30;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 2px 12px #22c55e50; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .result-stats {
    display: flex; gap: 1.5rem; margin-bottom: 1rem;
    font-size: 0.8rem; color: #a1a1aa; flex-wrap: wrap;
  }
  .result-stats strong { color: #f4f4f5; }

  .risk-label {
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.15rem 0.5rem; border-radius: 999px;
    font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;
  }
  .risk-1 { background: #22c55e20; color: #4ade80; border: 1px solid #22c55e30; }
  .risk-2 { background: #86efac20; color: #86efac; border: 1px solid #86efac30; }
  .risk-3 { background: #facc1520; color: #facc15; border: 1px solid #facc1530; }
  .risk-4 { background: #f9731620; color: #f97316; border: 1px solid #f9731630; }
  .risk-5 { background: #ef444420; color: #ef4444; border: 1px solid #ef444430; }

  .shield-badge {
    display: inline-flex; align-items: center; gap: 0.3rem;
    padding: 0.15rem 0.5rem; border-radius: 999px;
    font-size: 0.7rem; font-weight: 500;
  }
  .shield-ok {
    background: #22c55e15; color: #4ade80; border: 1px solid #22c55e25;
    animation: pulseGlow 2s ease-in-out infinite;
  }
  .shield-fail { background: #ef444415; color: #ef4444; border: 1px solid #ef444425; }
  .shield-na { background: #a1a1aa15; color: #a1a1aa; border: 1px solid #a1a1aa25; }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 4px #22c55e20; }
    50% { box-shadow: 0 0 10px #22c55e50; }
  }

  .table-wrap { overflow-x: auto; border-radius: 0.5rem; border: 1px solid #27272a; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  th {
    text-align: left; padding: 0.6rem 0.75rem;
    background: #1a1a1d; color: #a1a1aa;
    font-weight: 500; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em;
    white-space: nowrap;
  }
  td { padding: 0.6rem 0.75rem; border-top: 1px solid #1f1f23; white-space: nowrap; }
  tr:hover td { background: #1f1f23; }

  .empty-state { text-align: center; padding: 2.5rem; color: #52525b; }
  .empty-state .icon { font-size: 2rem; margin-bottom: 0.5rem; }
  .empty-state p { font-size: 0.85rem; }

  .error-msg {
    background: #ef444410; border: 1px solid #ef444425; border-radius: 0.5rem;
    padding: 0.75rem 1rem; color: #fca5a5; font-size: 0.85rem; margin-bottom: 1rem;
  }

  pre {
    background: #09090b; padding: 1rem; border-radius: 0.5rem;
    overflow-x: auto; font-size: 0.8rem; color: #a1a1aa;
    border: 1px solid #1f1f23; line-height: 1.6;
  }
  pre .hl { color: #4ade80; }
  pre .cm { color: #52525b; }

  .sub-info { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #27272a; }

  @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#22c55e"/>
        <path d="M16 6c-5 0-9 3-9 8s4 8 9 8 9-3 9-8-4-8-9-8zm0 13c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" fill="#052e16"/>
        <path d="M16 9l1.5 3h3l-2.5 2 1 3.5L16 16l-3 1.5 1-3.5-2.5-2h3L16 9z" fill="#22c55e"/>
      </svg>
      Demeter <span class="accent">Yield Optimizer</span>
    </h1>
    <div class="header-badges">
      <span class="badge">x402 · $0.02/call</span>
      <span class="badge badge-purple">3 chains</span>
      <span class="badge badge-amber">on-chain verified</span>
    </div>
  </header>

  <div class="health" id="health">
    <span class="health-dot" id="healthDot"></span>
    <span id="healthText">Checking API health...</span>
  </div>

  <div class="trust-banner">
    <div class="shield">&#9971;</div>
    <div>
      <h3>Trust Over Noise</h3>
      <p>
        Most yield scrapers just mirror DefiLlama. <strong>Demeter goes further</strong> — every pool contract is
        verified on-chain via <strong>eth_getCode</strong> before it reaches you. Autonomous agents moving real capital
        get deterministic trust, not stale off-chain metadata. <strong>This is the security layer of DeFi AI.</strong>
      </p>
    </div>
  </div>

  <div class="card">
    <h2>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2">
        <path d="M12 20V10M18 20V4M6 20v-4"/>
      </svg>
      Query Parameters
    </h2>
    <form id="queryForm" class="form-grid">
      <div class="form-group full">
        <label for="assets">Assets <span style="color:#ef4444;">*</span></label>
        <input id="assets" type="text" placeholder="USDC, ETH, USDT" value="USDC">
      </div>
      <div class="form-group">
        <label for="chains">Chains</label>
        <input id="chains" type="text" placeholder="eip155:196, eip155:8453">
      </div>
      <div class="form-group">
        <label for="riskTolerance">Risk Tolerance</label>
        <select id="riskTolerance">
          <option value="low">Low — treasury grade only</option>
          <option value="moderate" selected>Moderate — balanced</option>
          <option value="high">High — max yield</option>
        </select>
      </div>
      <div class="form-group">
        <label for="minTvl">Min TVL (USD)</label>
        <input id="minTvl" type="number" placeholder="100000" value="100000">
      </div>
      <div class="form-group">
        <label for="maxResults">Max Results</label>
        <input id="maxResults" type="number" placeholder="10" value="10">
      </div>
      <div class="form-group">
        <label for="minApy">Min APY %</label>
        <input id="minApy" type="number" placeholder="0" step="0.1">
      </div>
    </form>
    <button class="btn btn-primary" id="queryBtn" onclick="runQuery()" style="margin-top: 0.75rem;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      Scan Yields
    </button>
  </div>

  <div id="results"></div>

  <div class="card">
    <h2>&#9998; Quick Start</h2>
    <pre>$ curl -X POST https://demeter-yield-asp.vercel.app/api/optimize \<br>  -H <span class="hl">"Content-Type: application/json"</span> \<br>  -d '<span class="hl">{</span><span class="cm">"assets"</span><span class="hl">:[</span><span class="cm">"USDC"</span><span class="hl">],</span><span class="cm">"risk_tolerance"</span><span class="hl">:</span><span class="cm">"moderate"</span><span class="hl">}</span>'</pre>
  </div>

  <div class="card sub-info">
    <h2>&#128276; Webhook Subscriptions</h2>
    <p style="font-size:0.8rem; color:#a1a1aa; margin-bottom:0.75rem;">
      Subscribe to yield changes once — Demeter pushes updates when APY shifts by &#8805;0.5%.
      No polling required.
    </p>
    <pre>curl -X POST https://demeter-yield-asp.vercel.app/api/subscribe \<br>  -H <span class="hl">"Content-Type: application/json"</span> \<br>  -d '<span class="hl">{</span><span class="cm">"webhook_url"</span><span class="hl">:</span><span class="cm">"https://agent.com/hook"</span><span class="hl">,</span><span class="cm">"params"</span><span class="hl">:{</span><span class="cm">"assets"</span><span class="hl">:[</span><span class="cm">"USDC"</span><span class="hl">]}}</span>'</pre>
  </div>
</div>

<script>
const API_BASE = window.location.origin
const RISK_LABELS = { 1: 'Treasury', 2: 'Safe', 3: 'Moderate', 4: 'Risky', 5: 'Speculative' }

async function checkHealth() {
  const dot = document.getElementById('healthDot')
  const text = document.getElementById('healthText')
  try {
    const res = await fetch(API_BASE + '/health')
    const data = await res.json()
    dot.className = 'health-dot ok'
    text.textContent = 'All systems nominal — ' + new Date(data.timestamp).toLocaleTimeString()
  } catch {
    dot.className = 'health-dot error'
    text.textContent = 'API unreachable'
  }
}

  function shieldHtml(v) {
  if (v === true) return '<span class="shield-badge shield-ok">\u2691 Verified</span>'
  if (v === false) return '<span class="shield-badge shield-fail">\u26A0 Missing</span>'
  return '<span class="shield-badge shield-na">\u2014</span>'
}

function adminHtml(p) {
  if (!p.onchain || p.onchain.upgradeable === null || p.onchain.upgradeable === false) {
    return '<span class="shield-badge shield-na">\u2014</span>'
  }
  if (p.onchain.admin_type === 'eoa') {
    return '<span class="shield-badge shield-fail">\u26A0 EOA admin</span>'
  }
  if (p.onchain.admin_type === 'contract') {
    return '<span class="shield-badge shield-ok">\u2691 Multisig</span>'
  }
  return '<span class="shield-badge shield-na">Upgradeable</span>'
}

function formatApy(n) { return (n ?? 0).toFixed(2) + '%' }
function formatUsd(n) {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K'
  return '$' + n
}

async function runQuery() {
  const btn = document.getElementById('queryBtn')
  const resultsDiv = document.getElementById('results')
  btn.disabled = true
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg> Scanning...'

  const assets = document.getElementById('assets').value.split(',').map(s => s.trim()).filter(Boolean)
  const chainsRaw = document.getElementById('chains').value
  const chains = chainsRaw ? chainsRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined
  const risk_tolerance = document.getElementById('riskTolerance').value
  const min_tvl_usd = parseInt(document.getElementById('minTvl').value) || undefined
  const max_results = parseInt(document.getElementById('maxResults').value) || undefined
  const min_apy = parseFloat(document.getElementById('minApy').value) || undefined

  const payload = { assets }
  if (chains && chains.length) payload.chains = chains
  if (risk_tolerance !== 'moderate') payload.risk_tolerance = risk_tolerance
  if (min_tvl_usd) payload.min_tvl_usd = min_tvl_usd
  if (max_results) payload.max_results = max_results
  if (min_apy) payload.min_apy = min_apy

  try {
    const res = await fetch(API_BASE + '/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      resultsDiv.innerHTML = '<div class="error-msg">Error ' + res.status + ': ' + (err.message || 'unknown') + '</div>'
      return
    }

    const data = await res.json()

    if (!data.results || data.results.length === 0) {
      resultsDiv.innerHTML = '<div class="card"><div class="empty-state"><div class="icon">\uD83D\uDEE0\uFE0F</div><p>No pools matched. Try broader assets or lower the minimum TVL.</p></div></div>'
      return
    }

    const rows = data.results.map(p => '<tr>' +
      '<td style="color:#52525b; font-weight:500;">' + p.rank + '</td>' +
      '<td><strong>' + p.protocol + '</strong></td>' +
      '<td>' + p.chain + '</td>' +
      '<td>' + p.asset + '</td>' +
      '<td><strong style="color:#f4f4f5;">' + formatApy(p.apy.total) + '</strong></td>' +
      '<td style="color:#a1a1aa;">' + (p.apy.net_estimated != null ? formatApy(p.apy.net_estimated) : '-') + '</td>' +
      '<td style="color:#a1a1aa;">' + formatUsd(p.tvl_usd) + '</td>' +
      '<td><span class="risk-label risk-' + p.risk_score + '">' + RISK_LABELS[p.risk_score] + '</span></td>' +
      '<td>' + shieldHtml(p.onchain?.verified) + '</td>' +
      '<td>' + adminHtml(p) + '</td>' +
    '</tr>').join('')

    resultsDiv.innerHTML = '<div class="card">' +
      '<div class="result-stats">' +
        '<span>Pools scanned: <strong>' + data.meta.total_pools_scanned + '</strong></span>' +
        '<span>Chains: <strong>' + data.meta.chains_covered.join(', ') + '</strong></span>' +
        '<span>Data age: <strong>' + data.meta.data_freshness_seconds + 's</strong></span>' +
      '</div>' +
      '<div class="table-wrap"><table>' +
        '<thead><tr>' +
          '<th>#</th><th>Protocol</th><th>Chain</th><th>Asset</th><th>APY</th><th>Net APY</th><th>TVL</th><th>Risk</th><th>Contract</th><th>Authority</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
    '</div>'

    resultsDiv.querySelector('.table-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (err) {
    resultsDiv.innerHTML = '<div class="error-msg">Network error: ' + err.message + '</div>'
  } finally {
    btn.disabled = false
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Scan Yields'
  }
}

checkHealth()
document.getElementById('assets').addEventListener('keydown', e => { if (e.key === 'Enter') runQuery() })
</script>
</body>
</html>`

export default async function demoRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (_request, reply) => {
    return reply.type('text/html').send(HTML)
  })
}
