// ── Right panel: planet detail / stats ───────────────────────────────────────
// panel and panelBody are globals defined in overview.js

function openPanelForZoom(p) {
  const moon = (typeof moonEntries !== 'undefined')
    ? moonEntries.find(m => m.parentPlanet === p || m.parentPlanetName === (p.en || ''))
    : null;
  const actualParent = (typeof planetMeshes !== 'undefined' && p.parentPlanetName)
    ? planetMeshes.find(pp => pp.en === p.parentPlanetName)
    : null;

  let subtitleHTML = '';
  if (moon) {
    subtitleHTML = `<span class="p-subtitle-link" data-zoom-target="moon">月球 MOON</span>`;
  } else if (actualParent) {
    subtitleHTML = `<span class="p-subtitle-link" data-zoom-target="planet">${actualParent.name} ${actualParent.en.toUpperCase()}</span>`;
  }

  panelBody.innerHTML = `
    <div class="p-header">
      <div class="p-name-row">
        <span class="p-name">${p.name}</span>
        ${subtitleHTML}
      </div>
      <div class="p-en">${p.en.toUpperCase()}</div>
      <div class="p-tagline">${p.tagline}</div>
    </div>
    <div class="p-section">
      <div class="p-section-title">概述</div>
      <p>${p.desc}</p>
    </div>
    <div class="p-section">
      <div class="p-section-title">地形与地质</div>
      <p>${p.geology}</p>
    </div>
    <div class="p-section">
      <div class="p-section-title">天体物理数据</div>
      <div class="p-stats">
        ${p.stats.map(s => `
          <div class="p-stat">
            <div class="p-stat-label">${s.label}</div>
            <div class="p-stat-value">${s.value}</div>
          </div>`).join('')}
      </div>
    </div>`;

  const link = panelBody.querySelector('.p-subtitle-link');
  if (link) {
    link.addEventListener('click', () => {
      if (moon) switchZoomTarget(moon);
      else if (actualParent) switchZoomTarget(actualParent);
    });
  }

  panel.classList.add('open');
}
