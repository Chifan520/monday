// ── Zoom mode: texture loading + camera zoom ──────────────────────────────────
// Panel functions live in src/panels/feature-panel.js and src/panels/detail-panel.js

const _texLoader = new THREE.TextureLoader();
const REAL_TEX = {};

// 按需加载；URL 来自各天体定义文件
function loadTexIfNeeded(key) {
  if (REAL_TEX[key]) return Promise.resolve(REAL_TEX[key]);
  const url = PLANET_DEFS[key] && PLANET_DEFS[key].texUrl;
  if (!url) return Promise.reject(new Error('no url: ' + key));
  return new Promise((resolve, reject) =>
    _texLoader.load(url, tex => { REAL_TEX[key] = tex; resolve(tex); }, undefined, reject));
}

let prevPhongMat = null;

function makeCloudTex(size) {
  const c = document.createElement('canvas'); c.width = c.height = size || 512;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(c.width, c.width);
  for (let y = 0; y < c.width; y++) for (let x = 0; x < c.width; x++) {
    const n = fbm(x / c.width * 6, y / c.width * 6, 99, 4);
    const a = n > 0.5 ? (n - 0.5) * 3 : 0;
    const i4 = (y * c.width + x) * 4;
    img.data[i4]=255; img.data[i4+1]=255; img.data[i4+2]=255; img.data[i4+3]=Math.min(255, a*255);
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
const dynamicCloudTex = makeCloudTex(512);

// ── Core zoom helpers ─────────────────────────────────────────────────────────
const _worldPos = new THREE.Vector3();

function _cleanupLayers() {
  surfaceAnimLayers.forEach(l => l.mesh.parent && l.mesh.parent.remove(l.mesh));
  surfaceAnimLayers.length = 0;
}

function _applyZoom(p, mat) {
  const key = _planetKey(p);
  loadTexIfNeeded(key).then(tex => {
    if (zoomedPlanet !== p) return;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    mat.map = tex; mat.needsUpdate = true;
  }).catch(() => {});
  const def = PLANET_DEFS[key];
  if (def) def.buildLayers(p.mesh, p.r || 1, surfaceAnimLayers);
}

function zoomToPlanet(p) {
  if (zoomedPlanet === p) return;
  _cleanupLayers();
  zoomedPlanet = p;
  p.mesh.getWorldPosition(_worldPos);
  targetCamPos.copy(_worldPos);
  targetDist = (p.r || 6) * ZOOM_DIST_FACTOR;
  prevPhongMat = p.mesh.material;
  const mat = new THREE.MeshBasicMaterial({ map: prevPhongMat.map, fog: false });
  p.mesh.material = mat;
  _applyZoom(p, mat);
  openFeaturePanel(p);
  openPanelForZoom(p);
}

function zoomOut() {
  if (!zoomedPlanet) return;
  const p = zoomedPlanet;
  closeFeaturePanel();
  _cleanupLayers();
  if (prevPhongMat) {
    p.mesh.material.dispose();
    p.mesh.material = prevPhongMat;
    prevPhongMat = null;
  }
  zoomedPlanet = null;
  targetDist = 73;
  targetCamPos.set(0, 0, 0);
}

// ── Earth ↔ Moon switch (triggered by detail-panel link) ─────────────────────
function switchZoomTarget(target) {
  if (!zoomedPlanet) return;
  _cleanupLayers();
  if (prevPhongMat) {
    zoomedPlanet.mesh.material.dispose();
    zoomedPlanet.mesh.material = prevPhongMat;
    prevPhongMat = null;
  }
  zoomedPlanet = target;
  target.mesh.getWorldPosition(_worldPos);
  targetCamPos.copy(_worldPos);
  targetDist = (target.r || 6) * ZOOM_DIST_FACTOR;
  prevPhongMat = target.mesh.material;
  const mat = new THREE.MeshBasicMaterial({ map: prevPhongMat.map, fog: false });
  target.mesh.material = mat;
  _applyZoom(target, mat);
  openFeaturePanel(target);
  openPanelForZoom(target);
}
