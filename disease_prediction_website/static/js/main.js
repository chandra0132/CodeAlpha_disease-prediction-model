/* ════════════════════════════════════════════
   HealthAI — Main JavaScript
   ════════════════════════════════════════════ */

/* ── Particles ── */
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const dur = Math.random() * 8 + 6;
    const delay = Math.random() * 6;
    const colors = ['#00ffff', '#ff00aa', '#00ff88', '#bb00ff', '#ffee00'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `
      position:absolute;
      width:${size}px;height:${size}px;
      left:${x}%;top:${y}%;
      background:${col};
      border-radius:50%;
      opacity:${Math.random() * 0.6 + 0.1};
      animation:float-up ${dur}s ${delay}s ease-in-out infinite;
      box-shadow:0 0 ${size * 3}px ${col};
    `;
    container.appendChild(p);
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float-up {
      0%,100% { transform:translateY(0) scale(1); opacity:0.2; }
      50%      { transform:translateY(-40px) scale(1.3); opacity:0.7; }
    }
  `;
  document.head.appendChild(style);
})();

/* ── Active nav link on scroll ── */
(function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
  const style = document.createElement('style');
  style.textContent = `.nav-link.active { color: var(--neon-cyan) !important; background: rgba(0,255,255,0.08) !important; }`;
  document.head.appendChild(style);
})();

/* ── Dataset stats from API ── */
async function loadDatasetStats() {
  try {
    const res  = await fetch('/api/dataset_stats');
    const data = await res.json();
    set('ds-total',    data.total_samples);
    set('ds-features', data.features);
    set('ds-positive', data.positive_cases);
    set('ds-negative', data.negative_cases);
    set('ds-missing',  data.missing_values);
    set('ds-train',    data.train_split);
    set('ds-test',     data.test_split);
  } catch (e) { console.warn('Stats load failed', e); }
}
function set(id, val) {
  const el = document.getElementById(id);
  if (el) animCount(el, parseInt(val) || val);
}
function animCount(el, target) {
  if (typeof target !== 'number') { el.textContent = target; return; }
  let cur = 0; const step = Math.ceil(target / 40);
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(t);
  }, 30);
}

/* ── Models table from API ── */
async function loadModels() {
  try {
    const res  = await fetch('/api/metrics');
    const data = await res.json();
    const tbody = document.getElementById('models-tbody');
    if (!tbody) return;

    const sorted = Object.entries(data).sort((a,b) => b[1].accuracy - a[1].accuracy);
    tbody.innerHTML = '';
    const rankClass = ['rank-1','rank-2','rank-3','rank-other','rank-other'];
    const rankLabel = ['🥇 Best','🥈 2nd','🥉 3rd','4th','5th'];

    sorted.forEach(([name, m], i) => {
      const tr = document.createElement('tr');
      if (i === 0) tr.classList.add('best-model');
      tr.innerHTML = `
        <td style="font-weight:700;color:${i===0?'var(--neon-green)':'var(--text-main)'}">${name}</td>
        <td>${bar(m.accuracy, '#00ff88')}</td>
        <td>${bar(m.precision,'#00ffff')}</td>
        <td>${bar(m.recall,   '#ff00aa')}</td>
        <td>${bar(m.f1,       '#bb00ff')}</td>
        <td>${bar(m.roc_auc,  '#ffee00')}</td>
        <td><span class="rank-badge ${rankClass[i]}">${rankLabel[i]}</span></td>
      `;
      tbody.appendChild(tr);
    });

    drawAccuracyChart(sorted);
    drawFeatureChart();
  } catch (e) { console.warn('Models load failed', e); }
}

function bar(val, color) {
  return `<div style="display:flex;align-items:center;gap:.5rem">
    <div style="width:60px;height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden">
      <div style="width:${val}%;height:100%;background:${color};border-radius:3px;box-shadow:0 0 6px ${color}88"></div>
    </div>
    <span style="font-family:var(--font-mono);font-size:.82rem">${val}%</span>
  </div>`;
}

/* ── Accuracy Chart (pure canvas) ── */
function drawAccuracyChart(sorted) {
  const canvas = document.getElementById('accuracyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top:20, right:20, bottom:60, left:50 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0)';

  const labels = sorted.map(([n]) => n.replace(' ', '\n'));
  const values = sorted.map(([,m]) => m.accuracy);
  const colors = ['#00ff88','#00ffff','#bb00ff','#ff00aa','#ffee00'];

  const minVal = 70;
  const barW = chartW / values.length;

  // Grid lines
  for (let v = minVal; v <= 100; v += 5) {
    const y = pad.top + chartH - ((v - minVal) / (100 - minVal)) * chartH;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#3a4a6b';
    ctx.font = '10px Share Tech Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(v + '%', pad.left - 6, y + 4);
  }

  // Bars
  values.forEach((val, i) => {
    const x = pad.left + i * barW + barW * 0.15;
    const bW = barW * 0.7;
    const bH = ((val - minVal) / (100 - minVal)) * chartH;
    const y = pad.top + chartH - bH;
    const col = colors[i];

    // Glow
    const grd = ctx.createLinearGradient(x, y, x, pad.top + chartH);
    grd.addColorStop(0, col);
    grd.addColorStop(1, col + '44');
    ctx.fillStyle = grd;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(x, y, bW, bH, [4,4,0,0]);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Value label
    ctx.fillStyle = col;
    ctx.font = 'bold 11px Share Tech Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(val + '%', x + bW / 2, y - 6);

    // X label
    ctx.fillStyle = '#6b7ba4';
    ctx.font = '10px Rajdhani, sans-serif';
    const parts = sorted[i][0].split(' ');
    parts.forEach((part, pi) => {
      ctx.fillText(part, x + bW / 2, pad.top + chartH + 16 + pi * 13);
    });
  });
}

/* ── Feature Importance Chart (horizontal bar, pure canvas) ── */
async function drawFeatureChart() {
  const canvas = document.getElementById('featureChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  try {
    const res  = await fetch('/api/feature_importance');
    const data = await res.json();
    const entries = Object.entries(data).sort((a,b) => b[1]-a[1]).slice(0,8);

    ctx.clearRect(0,0,W,H);
    const pad = { top:10, right:60, bottom:10, left:130 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const rowH   = chartH / entries.length;
    const maxVal = entries[0][1];
    const colors = ['#00ffff','#00ff88','#bb00ff','#ff00aa','#ffee00','#ff6600','#00aaff','#ff0055'];

    entries.forEach(([name, val], i) => {
      const y = pad.top + i * rowH;
      const bH = rowH * 0.55;
      const bW = (val / maxVal) * chartW;
      const col = colors[i % colors.length];

      // Label
      ctx.fillStyle = '#6b7ba4';
      ctx.font = '11px Rajdhani, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(name, pad.left - 8, y + bH / 2 + 4);

      // Bar
      const grd = ctx.createLinearGradient(pad.left, 0, pad.left + chartW, 0);
      grd.addColorStop(0, col);
      grd.addColorStop(1, col + '44');
      ctx.fillStyle = grd;
      ctx.shadowColor = col;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(pad.left, y + (rowH - bH)/2, bW, bH, 3);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Value
      ctx.fillStyle = col;
      ctx.font = 'bold 10px Share Tech Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText((val * 100).toFixed(1) + '%', pad.left + bW + 6, y + bH/2 + 4);
    });
  } catch(e) { console.warn('Feature chart failed', e); }
}

/* ════════════════════════════════════════════
   PREDICTION
   ════════════════════════════════════════════ */
async function runPrediction() {
  const btn = document.getElementById('predict-btn');
  const box = document.getElementById('result-box');
  if (!btn || !box) return;

  btn.disabled = true;
  btn.innerHTML = '<span>Analyzing…</span>';
  box.innerHTML = `<div style="text-align:center"><div class="spinner"></div><p style="color:var(--text-muted);font-size:.85rem">Running ML inference…</p></div>`;

  const fields = ['age','sex','chest_pain_type','resting_bp','cholesterol',
                  'fasting_blood_sugar','resting_ecg','max_heart_rate',
                  'exercise_angina','oldpeak','slope','num_vessels','thal'];
  const body = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) body[f] = el.value;
  });

  try {
    const res  = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Unknown error');

    const rl  = data.risk_level;                       // danger | warning | safe
    const col = rl === 'danger' ? 'var(--neon-pink)' :
                rl === 'safe'   ? 'var(--neon-green)' : 'var(--neon-yellow)';
    const icon = rl === 'danger' ? '⚠️' : rl === 'safe' ? '✅' : '⚡';

    box.innerHTML = `
      <div class="result-content">
        <div style="font-size:2.5rem;margin-bottom:.5rem">${icon}</div>
        <div class="result-label ${rl}">${data.label}</div>
        <div style="color:var(--text-muted);font-size:.82rem;margin-bottom:1rem">
          Disease Probability: <span style="color:${col};font-family:var(--font-mono)">${data.probability}%</span>
        </div>
        <div class="prob-bar-wrap">
          <div class="prob-label">Risk Probability</div>
          <div class="prob-bar">
            <div class="prob-fill ${rl}" id="prob-fill-bar" style="width:0%"></div>
          </div>
        </div>
        <div class="prob-pct" style="color:${col};margin-top:.75rem">${data.probability}%</div>
        <div style="margin-top:.75rem;font-size:.8rem;color:var(--text-muted)">
          Confidence: <span style="color:var(--neon-cyan);font-family:var(--font-mono)">${data.confidence}%</span>
        </div>
        <div style="margin-top:.5rem;font-family:var(--font-mono);font-size:.72rem;color:var(--text-dim)">
          Model: XGBoost · Dataset: UCI Heart Disease
        </div>
      </div>
    `;

    // Animate bar
    setTimeout(() => {
      const fill = document.getElementById('prob-fill-bar');
      if (fill) fill.style.width = data.probability + '%';
    }, 100);

  } catch (err) {
    box.innerHTML = `<div style="color:var(--neon-pink);text-align:center">
      <div style="font-size:2rem;margin-bottom:.5rem">❌</div>
      <strong>Prediction failed</strong><br/>
      <span style="font-size:.8rem;color:var(--text-muted)">${err.message}</span>
    </div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>⚡ Analyze &amp; Predict</span>';
  }
}

/* ── Scroll-reveal animation ── */
(function initReveal() {
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity:0; transform:translateY(28px); transition:opacity .6s ease, transform .6s ease; }
    .reveal.visible { opacity:1; transform:none; }
  `;
  document.head.appendChild(style);

  const targets = document.querySelectorAll('.about-card,.doc-card,.wf-step,.db-stat,.ri-card');
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 6) * 80 + 'ms';
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  targets.forEach(el => io.observe(el));
})();

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  loadDatasetStats();
  loadModels();
});
