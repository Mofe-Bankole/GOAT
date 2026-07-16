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
    background: #0a0a0b; color: #e4e4e7; line-height: 1.5;
    min-height: 100vh;
  }
  .container { max-width: 960px; margin: 0 auto; padding: 2rem 1rem; }

  /* Header */
  header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 2rem; padding-bottom: 1rem;
    border-bottom: 1px solid #27272a;
  }
  header h1 { font-size: 1.5rem; font-weight: 700; color: #f4f4f5; }
  header h1 span { color: #22c55e; }
  .badge {
    font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 999px;
    background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44;
  }

  /* Health */
  .health {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-size: 0.875rem; color: #a1a1aa; margin-bottom: 1.5rem;
  }
  .health-dot { width: 8px; height: 8px; border-radius: 50%; }
  .health-dot.ok { background: #22c55e; }
  .health-dot.error { background: #ef4444; }

  /* Cards */
  .card {
    background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem;
    padding: 1.5rem; margin-bottom: 1.5rem;
  }
  .card h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #f4f4f5; }

  /* Form */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-group { display: flex; flex-direction: column; gap: 0.375rem; }
  .form-group.full { grid-column: 1 / -1; }
  .form-group label { font-size: 0.75rem; font-weight: 500; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-group input, .form-group select {
    background: #09090b; border: 1px solid #3f3f46; border-radius: 0.5rem;
    padding: 0.625rem 0.75rem; color: #e4e4e7; font-size: 0.875rem;
    transition: border-color 0.15s;
  }
  .form-group input:focus, .form-group select:focus {
    outline: none; border-color: #22c55e; box-shadow: 0 0 0 1px #22c55e44;
  }
  .form-group input::placeholder { color: #52525b; }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.625rem 1.25rem; border-radius: 0.5rem; font-size: 0.875rem;
    font-weight: 500; cursor: pointer; border: none; transition: all 0.15s;
  }
  .btn-primary { background: #22c55e; color: #052e16; }
  .btn-primary:hover { background: #16a34a; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Results */
  .result-stats {
    display: flex; gap: 1.5rem; margin-bottom: 1rem;
    font-size: 0.875rem; color: #a1a1aa;
  }
  .result-stats strong { color: #f4f4f5; }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  th {
    text-align: left; padding: 0.625rem 0.75rem;
    border-bottom: 1px solid #27272a; color: #a1a1aa;
    font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
    white-space: nowrap;
  }
  td { padding: 0.625rem 0.75rem; border-bottom: 1px solid #1f1f23; white-space: nowrap; }
  tr:hover td { background: #1f1f23; }

  .risk-1 { color: #22c55e; } .risk-2 { color: #86efac; }
  .risk-3 { color: #facc15; } .risk-4 { color: #f97316; } .risk-5 { color: #ef4444; }
  .onchain-yes { color: #22c55e; } .onchain-no { color: #ef4444; } .onchain-null { color: #a1a1aa; }

  .empty-state { text-align: center; padding: 2rem; color: #52525b; }

  /* Error */
  .error-msg {
    background: #ef444422; border: 1px solid #ef444444; border-radius: 0.5rem;
    padding: 0.75rem 1rem; color: #fca5a5; font-size: 0.875rem; margin-bottom: 1rem;
  }

  /* Sub section */
  .sub-info {
    margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #27272a;
  }
  .sub-info code {
    background: #09090b; padding: 0.125rem 0.375rem; border-radius: 0.25rem;
    font-size: 0.8125rem; color: #a1a1aa;
  }

  @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Demeter <span>Yield Optimizer</span></h1>
    <span class="badge">x402 · $0.02/call</span>
  </header>

  <div class="health" id="health">
    <span class="health-dot" id="healthDot"></span>
    <span id="healthText">Checking API health...</span>
  </div>

  <div class="card">
    <h2>Query Parameters</h2>
    <form id="queryForm" class="form-grid">
      <div class="form-group full">
        <label for="assets">Assets <span style="color:#ef4444;">*</span></label>
        <input id="assets" type="text" placeholder="USDC, ETH, USDT" value="USDC">
      </div>
      <div class="form-group">
        <label for="chains">Chains (optional)</label>
        <input id="chains" type="text" placeholder="eip155:196, eip155:8453">
      </div>
      <div class="form-group">
        <label for="riskTolerance">Risk Tolerance</label>
        <select id="riskTolerance">
          <option value="low">Low</option>
          <option value="moderate" selected>Moderate</option>
          <option value="high">High</option>
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
        <label for="minApy">Min APY % (optional)</label>
        <input id="minApy" type="number" placeholder="0" step="0.1">
      </div>
    </form>
    <button class="btn btn-primary" id="queryBtn" style="margin-top: 1rem;" onclick="runQuery()">
      Scan Yields
    </button>
  </div>

  <div id="results"></div>

  <div class="card">
    <h2>Quick Start (curl)</h2>
    <pre style="background:#09090b; padding:1rem; border-radius:0.5rem; overflow-x:auto; font-size:0.8125rem; color:#a1a1aa;">curl -X POST https://demeter-yield-asp.vercel.app/api/optimize \
  -H "Content-Type: application/json" \
  -d '{"assets":["USDC"],"risk_tolerance":"moderate"}'</pre>
  </div>

  <div class="card sub-info">
    <h2>Webhook Subscriptions</h2>
    <p style="font-size:0.875rem; color:#a1a1aa; margin-bottom:0.75rem;">
      Agents can subscribe to yield changes and get pushed updates instead of polling.
    </p>
    <pre style="background:#09090b; padding:1rem; border-radius:0.5rem; overflow-x:auto; font-size:0.8125rem; color:#a1a1aa;">curl -X POST https://demeter-yield-asp.vercel.app/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"webhook_url":"https://youragent.com/hook","params":{"assets":["USDC"]}}'</pre>
  </div>
</div>

<script>
const API_BASE = window.location.origin

async function checkHealth() {
  const dot = document.getElementById('healthDot')
  const text = document.getElementById('healthText')
  try {
    const res = await fetch(API_BASE + '/health')
    const data = await res.json()
    dot.className = 'health-dot ok'
    text.textContent = 'API healthy — ' + new Date(data.timestamp).toLocaleTimeString()
  } catch {
    dot.className = 'health-dot error'
    text.textContent = 'API unreachable'
  }
}

function riskClass(score) {
  return 'risk-' + score
}

function onchainBadge(v) {
  if (v === true) return '<span class="onchain-yes">verified</span>'
  if (v === false) return '<span class="onchain-no">missing</span>'
  return '<span class="onchain-null">unchecked</span>'
}

function formatApy(n) { return (n ?? 0).toFixed(2) + '%' }

async function runQuery() {
  const btn = document.getElementById('queryBtn')
  const resultsDiv = document.getElementById('results')
  btn.disabled = true
  btn.textContent = 'Scanning...'

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
      resultsDiv.innerHTML = '<div class="error-msg">Error ' + res.status + ': ' + (err.message || res.statusText) + '</div>'
      return
    }

    const data = await res.json()

    if (!data.results || data.results.length === 0) {
      resultsDiv.innerHTML = '<div class="card"><div class="empty-state">No pools matched your criteria. Try broader assets or lower min TVL.</div></div>'
      return
    }

    const rows = data.results.map(p => '<tr>' +
      '<td>' + p.rank + '</td>' +
      '<td>' + p.protocol + '</td>' +
      '<td>' + p.chain + '</td>' +
      '<td>' + p.asset + '</td>' +
      '<td><strong>' + formatApy(p.apy.total) + '</strong></td>' +
      '<td>' + (p.apy.net_estimated != null ? formatApy(p.apy.net_estimated) : '-') + '</td>' +
      '<td>$' + (p.tvl_usd / 1e6).toFixed(1) + 'M</td>' +
      '<td><span class="' + riskClass(p.risk_score) + '"><strong>' + p.risk_score + '</strong></span></td>' +
      '<td>' + onchainBadge(p.onchain?.verified) + '</td>' +
    '</tr>').join('')

    resultsDiv.innerHTML = '<div class="card">' +
      '<div class="result-stats">' +
        '<span>Pools scanned: <strong>' + data.meta.total_pools_scanned + '</strong></span>' +
        '<span>Chains: <strong>' + data.meta.chains_covered.join(', ') + '</strong></span>' +
        '<span>Query: <strong>' + data.query_id.slice(0, 8) + '...</strong></span>' +
      '</div>' +
      '<div class="table-wrap"><table>' +
        '<thead><tr>' +
          '<th>#</th><th>Protocol</th><th>Chain</th><th>Asset</th><th>APY</th><th>Net APY</th><th>TVL</th><th>Risk</th><th>On-chain</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
    '</div>'

  } catch (err) {
    resultsDiv.innerHTML = '<div class="error-msg">Network error: ' + err.message + '</div>'
  } finally {
    btn.disabled = false
    btn.textContent = 'Scan Yields'
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
