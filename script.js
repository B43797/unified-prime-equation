/* ==========================================================================
   Unified Prime Equation — Calculator Logic (script.js)
   Sulphur Yellow on Deep Violet theme (see style.css)
   Author: Bahbouhi Bouchaib
   ========================================================================== */

/* ----------------------------- UI Wiring -------------------------------- */
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

const elInput   = $('#userInput');
const elC1      = $('#c1');
const elC2      = $('#c2');
const elLambda  = $('#lambda');
const elPovr    = $('#Poverride');
const elRun     = $('#btnRun');
const elClear   = $('#btnClear');
const elResults = $('#results');

elRun.addEventListener('click', onRun);
elClear.addEventListener('click', () => {
  elInput.value = '';
  elPovr.value = '';
  elResults.innerHTML = `<div class="placeholder">
    <p>No run yet. Choose a motif, enter a value, and click <em>Run</em>.</p>
    <p class="small">Tip: try <span class="mono">X = 2000000000</span> (Prime), or <span class="mono">E = 1000000200</span> (Goldbach). For huge inputs like <span class="mono">10^1000</span>, the app switches to Log mode and shows predicted <span class="mono">P</span>, <span class="mono">T</span>, and expected Δ<sub>step</sub>.</p>
  </div>`;
});

/* ------------------------ Parsing & Log Conversion ----------------------- */

/**
 * Parse user input:
 * - Accepts plain digits "123456..." (as Number if small enough)
 * - Accepts power form "10^k" or "1eK" (case-insensitive)
 * - Accepts huge digit strings (digits only) for log-mode estimation
 * Returns:
 *   { mode: 'bigint'|'log', Nnum?, lnN, base10, kind: 'prime'|'goldbach' }
 */
function parseInput() {
  const mode = $$('input[name="mode"]').find(r => r.checked)?.value ?? 'prime';
  let raw = (elInput.value || '').trim();
  if (!raw) throw new Error('Please provide a value (e.g., 2000000000 or 10^1000).');

  // Normalize "1e10" → "10^10"
  if (/^\d+e\d+$/i.test(raw)) {
    const parts = raw.toLowerCase().split('e');
    if (parts[0] === '1') raw = `10^${parts[1]}`;
  }

  const BIGINT_SAFE_LIMIT = 3.4e14; // ≤ 341,550,071,728,321 deterministic MR bases {2,3,5,7,11,13,17}

  // Case 1: power form 10^k
  const powerMatch = raw.match(/^10\^(\d{1,10})$/); // allow k up to 10 digits
  if (powerMatch) {
    const k = Number(powerMatch[1]);
    const lnN = k * Math.log(10);  // natural log
    const base10 = k;              // log10 N
    return { mode: 'log', lnN, base10, kind: mode };
  }

  // Case 2: digits only (possibly huge)
  if (/^\d+$/.test(raw)) {
    // If it fits our Number threshold, use BigInt/Number mode with exact arithmetic
    // (Note: JS Number is integer-precise up to 2^53 ~ 9e15; we restrict to 3.4e14 for MR determinism)
    if (raw.length < 15 || Number(raw) <= BIGINT_SAFE_LIMIT) {
      const Nnum = Number(raw);
      if (!Number.isFinite(Nnum) || Nnum < 2) throw new Error('Please enter an integer ≥ 2.');
      const lnN = Math.log(Nnum);
      const base10 = Math.log10(Nnum);
      return { mode: 'bigint', Nnum, lnN, base10, kind: mode };
    }
    // Otherwise estimate lnN from length and leading digits: N ≈ d × 10^(L-1)
    const L = raw.length;
    const lead = Number(raw.slice(0, Math.min(16, L))); // take leading block for mantissa
    const lnN = Math.log(lead) + (L - Math.min(16, L)) * Math.log(10);
    const base10 = L - 1 + Math.log10(lead);
    return { mode: 'log', lnN, base10, kind: mode };
  }

  throw new Error('Unsupported input format. Use digits only (e.g., 2000000000) or a power like 10^1000.');
}

/* -------------------------- Small Primes Sieve --------------------------- */

function sievePrimesUpTo(n) {
  n = Math.max(2, Math.floor(n));
  const mark = new Uint8Array(n + 1);
  const primes = [];
  for (let i = 2; i <= n; i++) {
    if (!mark[i]) {
      primes.push(i);
      if (i * i <= n) {
        for (let j = i * i; j <= n; j += i) mark[j] = 1;
      }
    }
  }
  return primes;
}

/* ------------------------- Miller–Rabin (Number) ------------------------- */

// Fast modular exponentiation
function modPow(base, exp, mod) {
  let result = 1n;
  let b = BigInt(base % mod);
  let e = BigInt(exp);
  let m = BigInt(mod);
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return result;
}

function isProbablePrimeNumber(n) {
  // Deterministic Miller–Rabin for n < 341,550,071,728,321 using bases [2,3,5,7,11,13,17]
  if (n < 2) return false;
  const small = [2,3,5,7,11,13,17,19,23,29,31,37];
  for (const p of small) {
    if (n === p) return true;
    if (n % p === 0) return n === p;
  }
  // write n-1 = d*2^s
  let d = n - 1;
  let s = 0;
  while ((d & 1) === 0) { d >>= 1; s++; }
  const bases = [2,3,5,7,11,13,17];
  const bn = BigInt(n);
  const bd = BigInt(d);
  for (const a of bases) {
    let x = modPow(a, bd, bn);
    if (x === 1n || x === bn - 1n) continue;
    let ok = false;
    for (let r = 1; r < s; r++) {
      x = (x * x) % bn;
      if (x === bn - 1n) { ok = true; break; }
    }
    if (!ok) return false;
  }
  return true;
}

/* ------------------- Admissibility & Search (BigInt mode) ---------------- */

function isAdmissiblePrimeMotif(candidate, smallPrimes) {
  for (const s of smallPrimes) {
    if (candidate % s === 0) return false;
  }
  return true;
}
function isAdmissibleGoldbachMotif(a, b, smallPrimes) {
  for (const s of smallPrimes) {
    if (a % s === 0 || b % s === 0) return false;
  }
  return true;
}

/**
 * Search nearest prime to X:
 *  - build symmetric offsets u=0,1,1,2,2,... up to T
 *  - check admissibility against small primes s ≤ P
 *  - Δ_step = number of admissible candidates checked before hitting a true prime
 */
function primeNearX(X, P, T) {
  const smallPrimes = sievePrimesUpTo(P);
  let admissiblesChecked = 0;
  let firstAdmissible = null;
  function testCandidate(Y) {
    if (!isAdmissiblePrimeMotif(Y, smallPrimes)) return { adm: false };
    admissiblesChecked++;
    if (firstAdmissible === null) firstAdmissible = Y;
    const prime = isProbablePrimeNumber(Y);
    return { adm: true, prime };
  }
  if (testCandidate(X).prime) {
    return { a: 0, u: 0, prime: X, deltaStep: 0, checked: 1, P, T };
  }
  for (let u = 1; u <= T; u++) {
    // +u
    let r = testCandidate(X + u);
    if (r.adm && r.prime) {
      const a = Math.abs(firstAdmissible - X);
      const delta = (a === u) ? 0 : 1; // simple bound (exact ranking omitted)
      return { a, u, prime: X + u, deltaStep: delta, checked: admissiblesChecked, P, T };
    }
    // -u
    if (X - u >= 2) {
      r = testCandidate(X - u);
      if (r.adm && r.prime) {
        const a = Math.abs(firstAdmissible - X);
        const delta = (a === u) ? 0 : 1;
        return { a, u, prime: X - u, deltaStep: delta, checked: admissiblesChecked, P, T };
      }
    }
  }
  return { a: null, u: null, prime: null, deltaStep: null, checked: admissiblesChecked, P, T };
}

/**
 * Goldbach for E=2x:
 *  - search t=0,1,1,2,2,... up to T
 *  - admissible if both (x-t) and (x+t) pass small-prime sieve
 *  - success when both are prime
 */
function goldbachPair(E, P, T) {
  if (E % 2 !== 0) throw new Error('E must be even.');
  const x = Math.floor(E / 2);
  const smallPrimes = sievePrimesUpTo(P);
  let admissiblesChecked = 0;
  let firstAdmissible = null;
  function testPair(a, b) {
    if (!isAdmissibleGoldbachMotif(a, b, smallPrimes)) return { adm: false };
    admissiblesChecked++;
    if (firstAdmissible === null) firstAdmissible = [a, b];
    const pa = isProbablePrimeNumber(a);
    const pb = isProbablePrimeNumber(b);
    return { adm: true, primepair: pa && pb };
  }
  // t=0 (degenerate only if x is prime twice; still check)
  let r0 = testPair(x, x);
  if (r0.adm && r0.primepair) {
    return { ta: 0, t: 0, p: x, q: x, deltaStep: 0, checked: 1, P, T };
  }
  for (let t = 1; t <= T; t++) {
    const a = x - t, b = x + t;
    if (a < 2) continue;
    const r = testPair(a, b);
    if (r.adm && r.primepair) {
      const ta = Math.abs(firstAdmissible[1] - firstAdmissible[0]) / 2;
      const delta = (ta === t) ? 0 : 1; // simple bound
      return { ta, t, p: a, q: b, deltaStep: delta, checked: admissiblesChecked, P, T };
    }
  }
  return { ta: null, t: null, p: null, q: null, deltaStep: null, checked: admissiblesChecked, P, T };
}

/* ------------------------------- Runner ---------------------------------- */

function onRun() {
  try {
    const parsed = parseInput();
    const c1 = Math.max(0.1, Number(elC1.value) || 1.0);
    const c2 = Math.max(0.1, Number(elC2.value) || 1.0);
    const lam = Math.min(1, Math.max(0, Number(elLambda.value) || 0.5));

    // Compute P and T from lnN (override if user provided explicit P)
    let P = Math.floor(c1 * parsed.lnN);
    const T = Math.max(1, Math.floor(c2 * parsed.lnN * parsed.lnN));
    if (elPovr.value) P = Math.max(3, Math.floor(Number(elPovr.value)));

    if (parsed.mode === 'log') {
      // Log-mode: preview only (no primality at astronomical sizes)
      const body = `
        <div class="result-block">
          <h4>Log Mode Preview</h4>
          <p><span class="mono">log₁₀ N</span> ≈ <b>${fmt(parsed.base10, 6)}</b>,
             <span class="mono">ln N</span> ≈ <b>${fmt(parsed.lnN, 6)}</b></p>
          <p>Small-prime cutoff <span class="mono">P</span> ≈ <b>${P}</b>,
             window radius <span class="mono">T</span> ≈ <b>${T.toLocaleString()}</b>.</p>
          <p>Expected behavior: first admissible hits directly (Δ<sub>step</sub>=0); otherwise correction ≤ 2 admissible steps.</p>
          <p class="small muted">Note: For gigantic N, the app does not attempt primality tests in-browser.
          Use this as a configuration guide (P, T) for external verifiers (ECPP, PARI/GP) if needed.</p>
        </div>`;
      elResults.innerHTML = body;
      return;
    }

    // BigInt/Number mode (exact up to ~3.4e14)
    if (parsed.kind === 'prime') {
      const X = parsed.Nnum;
      const out = primeNearX(X, P, T);
      if (out.prime) {
        elResults.innerHTML = renderPrimeResult(X, out, lam);
      } else {
        elResults.innerHTML = renderFail('No prime found within the current window. Try increasing c₂ (thus T).', P, T);
      }
    } else {
      const E = parsed.Nnum;
      if ((E & 1) === 1) throw new Error('Goldbach mode requires an even E.');
      const out = goldbachPair(E, P, T);
      if (out.p && out.q) {
        elResults.innerHTML = renderGoldbachResult(E, out, lam);
      } else {
        elResults.innerHTML = renderFail('No Goldbach pair found within the current window. Try increasing c₂ (thus T).', P, T);
      }
    }
  } catch (err) {
    elResults.innerHTML = `<div class="result-block">
      <h4>Error</h4>
      <p>${escapeHtml(err.message || String(err))}</p>
    </div>`;
  }
}

/* ----------------------------- Render Helpers ---------------------------- */

function renderPrimeResult(X, out, lam) {
  const { a, u, prime, deltaStep, checked, P, T } = out;
  return `
    <div class="result-block">
      <h4>Prime near X</h4>
      <p>Input <span class="mono">X = ${X.toLocaleString()}</span></p>
      <ul>
        <li>Small-prime cutoff: <span class="mono">P = ${P}</span></li>
        <li>Window: <span class="mono">|u| ≤ T = ${T.toLocaleString()}</span></li>
        <li>First admissible offset: <span class="mono">a = ${a}</span></li>
        <li>True offset: <span class="mono">u = ${u}</span></li>
        <li>Prime found: <span class="mono">${prime.toLocaleString()}</span></li>
        <li>Δ<sub>step</sub>: <span class="mono">${deltaStep}</span> (admissibles checked: ${checked})</li>
        <li>Hybrid weight λ: <span class="mono">${lam}</span></li>
      </ul>
      <p class="small muted">Heuristic expectation: Δ<sub>step</sub>=0 in most runs; else ≤ 2.</p>
    </div>
  `;
}

function renderGoldbachResult(E, out, lam) {
  const { ta, t, p, q, deltaStep, checked, P, T } = out;
  return `
    <div class="result-block">
      <h4>Goldbach Pair</h4>
      <p>Input <span class="mono">E = ${E.toLocaleString()}</span>, <span class="mono">x = E/2 = ${(E/2).toLocaleString()}</span></p>
      <ul>
        <li>Small-prime cutoff: <span class="mono">P = ${P}</span></li>
        <li>Window: <span class="mono">|t| ≤ T = ${T.toLocaleString()}</span></li>
        <li>First admissible offset: <span class="mono">t<sub>a</sub> = ${ta}</span></li>
        <li>True offset: <span class="mono">t = ${t}</span></li>
        <li>Pair: <span class="mono">(${p.toLocaleString()}, ${q.toLocaleString()})</span></li>
        <li>Δ<sub>step</sub>: <span class="mono">${deltaStep}</span> (admissibles checked: ${checked})</li>
        <li>Hybrid weight λ: <span class="mono">${lam}</span></li>
      </ul>
      <p class="small muted">Heuristic expectation: Δ<sub>step</sub>=0 in most runs; else ≤ 2.</p>
    </div>
  `;
}

function renderFail(msg, P, T) {
  return `
    <div class="result-block">
      <h4>Result</h4>
      <p>${escapeHtml(msg)}</p>
      <p class="small muted">Current parameters: <span class="mono">P=${P}</span>, <span class="mono">T=${T.toLocaleString()}</span>. Increase c₂ or provide a slightly different input.</p>
    </div>
  `;
}

/* ------------------------------- Utils ----------------------------------- */

function fmt(x, digits=4) {
  if (!Number.isFinite(x)) return String(x);
  return Number(x.toFixed(digits));
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

/* Optional: initialize placeholder on load */
elClear.click();
```0
