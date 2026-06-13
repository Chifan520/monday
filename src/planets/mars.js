// ── Mars ──────────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['mars'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mars_Valles_Marineris.jpeg/1280px-Mars_Valles_Marineris.jpeg',
  features: [
    { key:'olympus',   title:'奥林匹斯山 Olympus Mons',     desc:'太阳系最高火山，峰顶高于基准面21,229m，约为珠穆朗玛峰的2.4倍。底部直径约600km，面积相当于法国。为盾形火山，因火星无板块运动，同一火山可长期堆积，寿命逾数十亿年。' },
    { key:'valles',    title:'水手号峡谷 Valles Marineris',  desc:'太阳系最大峡谷系统，长约4,000km（相当于北京到拉萨的往返），宽达200km，最深7km。由地壳拉伸和塌陷形成，非流水侵蚀。峡谷壁暴露数层古老岩层，记录火星地质史。' },
    { key:'polar_ice', title:'极地冰盖 Polar Caps',          desc:'南北极均有冰盖，由水冰和干冰（固态CO₂）组成。夏季部分干冰升华，冰盖缩小；冬季CO₂重新凝结，覆盖更广。北极冠全年存在的水冰厚度可达3km，是未来载人探索的重要水资源。' },
  ],
  drawIllo(key, ctx, w) {
    function spot(cx, cy, rx, ry, col, alpha) {
      ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
      ctx.fillStyle=col; ctx.globalAlpha=alpha||1; ctx.fill(); ctx.globalAlpha=1;
    }
    ({
      olympus() {
        ctx.fillStyle='#110500'; ctx.fillRect(0,0,w,w);
        ctx.fillStyle='#cc5522'; ctx.fillRect(0,28,w,20);
        ctx.beginPath(); ctx.moveTo(w/2,28); ctx.lineTo(42,16); ctx.lineTo(6,16); ctx.closePath();
        ctx.fillStyle='#aa4422'; ctx.fill();
        spot(w/2,16,6,2,'#ff6633',0.5);
      },
      valles() {
        ctx.fillStyle='#cc4422'; ctx.fillRect(0,0,w,w);
        ctx.strokeStyle='rgba(80,20,5,0.8)'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(2,w/2); ctx.bezierCurveTo(16,22,32,26,46,w/2); ctx.stroke();
        ctx.strokeStyle='rgba(40,10,0,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(2,w/2); ctx.bezierCurveTo(16,21,32,27,46,w/2); ctx.stroke();
      },
      polar_ice() {
        ctx.fillStyle='#cc4422'; ctx.fillRect(0,0,w,w);
        ctx.fillStyle='rgba(220,220,210,0.7)'; ctx.fillRect(0,0,w,12);
        ctx.fillStyle='rgba(240,240,230,0.9)'; ctx.beginPath(); ctx.ellipse(w/2,10,20,8,0,0,Math.PI*2); ctx.fill();
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    const dust = new THREE.Mesh(
      new THREE.SphereGeometry(r*1.02,36,36),
      new THREE.MeshBasicMaterial({color:0xcc8855,transparent:true,opacity:0.18,fog:false,depthWrite:false}));
    mesh.add(dust); layers.push({mesh:dust,type:'rotate',speed:0.0008});
    const ice = new THREE.Mesh(
      new THREE.SphereGeometry(r*0.18,16,16,0,Math.PI*2,0,Math.PI*0.45),
      new THREE.MeshBasicMaterial({color:0xeeeedd,transparent:true,opacity:0.55,fog:false,depthWrite:false}));
    ice.position.y = r*1.01; mesh.add(ice);
    layers.push({mesh:ice,type:'none',speed:0});
  },
};
