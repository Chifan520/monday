// ── Moon (Luna) ───────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['moon'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/1024px-FullMoon2010.jpg',
  features: [
    { key:'maria',      title:'月海 Lunar Maria',           desc:'月球正面暗色区域，约占可见面积31%。由约30-39亿年前的玄武岩熔岩流填充巨大撞击盆地形成。雨海直径1,123km，静海直径873km。月海陨击坑密度远低于月陆，表明其表面相对年轻。' },
    { key:'highlands',  title:'月陆 Highlands',             desc:'亮色斜长岩高地，覆盖月球大部分表面，是月球最古老的地壳（>44亿年）。由月球早期岩浆洋结晶形成，轻质斜长石上浮堆积。月陆陨击坑极其密集，记录着太阳系早期剧烈撞击史。' },
    { key:'south_pole', title:'南极-艾特肯盆地 SPA Basin',  desc:'太阳系最大确认撞击盆地，直径约2,500km，深达13km。位于月球背面南极附近，形成于约42亿年前。盆地底部暴露下月壳甚至上月幔物质，是研究月球内部结构的重要窗口。中国嫦娥四号在此区域实现人类首次月球背面着陆。' },
  ],
  drawIllo(key, ctx, w) {
    function crater(cx, cy, r, col) {
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=col; ctx.fill();
      ctx.beginPath(); ctx.arc(cx-1,cy-1,r*0.4,0,Math.PI);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=0.5; ctx.stroke();
    }
    ({
      maria() {
        ctx.fillStyle='#111'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,18,0,Math.PI*2); ctx.fillStyle='#aaa'; ctx.fill();
        ctx.fillStyle='rgba(60,55,50,0.6)'; ctx.beginPath(); ctx.ellipse(16,18,8,7,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(55,50,45,0.5)'; ctx.beginPath(); ctx.ellipse(30,30,7,6,0.2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(65,60,55,0.5)'; ctx.beginPath(); ctx.ellipse(28,14,5,4,0,0,Math.PI*2); ctx.fill();
      },
      highlands() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,18,0,Math.PI*2); ctx.fillStyle='#ccd'; ctx.fill();
        for(let i=0;i<40;i++) crater(4+Math.random()*40,4+Math.random()*40,1+Math.random()*3,'rgba(180,180,190,0.5)');
      },
      south_pole() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,18,0,Math.PI*2); ctx.fillStyle='#999'; ctx.fill();
        ctx.beginPath(); ctx.arc(w/2,36,14,Math.PI,0); ctx.fillStyle='rgba(40,40,50,0.5)'; ctx.fill();
        ctx.strokeStyle='rgba(80,80,100,0.7)'; ctx.lineWidth=1; ctx.stroke();
        ctx.beginPath(); ctx.arc(w/2,36,10,Math.PI,0); ctx.stroke();
        ctx.beginPath(); ctx.arc(w/2,36,6,Math.PI,0); ctx.strokeStyle='rgba(60,60,80,0.5)'; ctx.stroke();
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    const dust = new THREE.Mesh(
      new THREE.SphereGeometry(r*1.02,32,32),
      new THREE.MeshBasicMaterial({color:0x999999,transparent:true,opacity:0.12,fog:false,depthWrite:false}));
    mesh.add(dust); layers.push({mesh:dust,type:'none',speed:0});
  },
};
