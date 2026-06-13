// ── Left panel: planet feature cards ─────────────────────────────────────────
const featurePanel = document.getElementById('feature-panel');
const fpBody = document.getElementById('fp-body');

// Helper: resolve planet key from planet object (shared with zoom.js)
function _planetKey(p) {
  return (p === SUN_DATA) ? 'sun' : (p.en || '').toLowerCase();
}

function openFeaturePanel(p) {
  const key = _planetKey(p);
  const def = PLANET_DEFS[key];
  const features = def ? def.features : [];
  if (!features.length) { featurePanel.classList.remove('open'); return; }

  fpBody.innerHTML = features.map(f => `
    <div class="fp-feature">
      <div class="fp-feature-header">
        <canvas class="fp-feature-canvas" width="48" height="48"></canvas>
        <div class="fp-feature-title">${f.title}</div>
      </div>
      <div class="fp-feature-desc">${f.desc}</div>
    </div>`).join('');

  fpBody.querySelectorAll('.fp-feature-canvas').forEach((canvas, i) => {
    if (def) def.drawIllo(features[i].key, canvas.getContext('2d'), 48);
  });

  featurePanel.classList.add('open');
}

function closeFeaturePanel() { featurePanel.classList.remove('open'); }
