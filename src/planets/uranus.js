// ── Uranus ────────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['uranus'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Uranus_Voyager2_color_calibrated.png/1024px-Uranus_Voyager2_color_calibrated.png',
  features: [
    { key:'extreme_tilt', title:'极端自转轴倾斜 Axial Tilt', desc:'天王星自转轴相对公转平面倾斜达97.8°，几乎"侧躺"运行。极区会经历连续42年白昼、再42年黑夜。可能由早期一次巨大撞击所致，也导致其磁轴相对自转轴极度偏斜59°。' },
    { key:'rings_faint',  title:'暗淡光环 Faint Rings',       desc:'天王星拥有13条暗淡光环，主要由暗色物质组成，反射率极低（约2%）。最早于1977年通过掩星偶然发现。光环极窄（<10km）、间隔大，与土星宽阔明亮的光环形成鲜明对比。' },
    { key:'miranda',      title:'天卫五 Miranda',              desc:'天王星最内侧的大卫星，直径仅472km，但拥有太阳系最奇特的地形——表面有深达20km的峡谷、高耸的悬崖和交错的地质断层（人字形山脊）。可能经历了多次碎裂-重组的灾难性撞击事件。' },
  ],
  drawIllo(key, ctx, w) {
    ({
      extreme_tilt() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.save(); ctx.translate(w/2,w/2); ctx.rotate(Math.PI*0.42);
        ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.fillStyle='#88ddee'; ctx.fill();
        ctx.strokeStyle='rgba(200,240,255,0.4)'; ctx.lineWidth=0.5; ctx.beginPath(); ctx.arc(0,0,17,0,Math.PI*2); ctx.stroke();
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(8,30); ctx.lineTo(40,14);
        ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.setLineDash([2,4]); ctx.stroke(); ctx.setLineDash([]);
      },
      rings_faint() {
        ctx.fillStyle='#000811'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,28,12,0,Math.PI*2); ctx.fillStyle='#88ddee'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(w/2,28,16,17,0,0,Math.PI*2);
        ctx.strokeStyle='rgba(140,140,130,0.4)'; ctx.lineWidth=0.7; ctx.stroke();
      },
      miranda() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,14,0,Math.PI*2); ctx.fillStyle='#99aabb'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(10,22);
        for(let i=0;i<5;i++){ctx.lineTo(14+i*5,15-i*2); ctx.lineTo(16+i*5,22+i);}
        ctx.strokeStyle='rgba(60,50,40,0.7)'; ctx.lineWidth=1.2; ctx.stroke();
        ctx.fillStyle='rgba(40,30,20,0.4)'; ctx.beginPath(); ctx.arc(38,24,5,0,Math.PI*2); ctx.fill();
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    const haze = new THREE.Mesh(
      new THREE.SphereGeometry(r*1.02,32,32),
      new THREE.MeshBasicMaterial({color:0x88e8ee,transparent:true,opacity:0.16,fog:false,depthWrite:false}));
    mesh.add(haze); layers.push({mesh:haze,type:'rotate',speed:-0.00035});
  },
};
