// ── Venus ─────────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['venus'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Venus_globe.jpg/1024px-Venus_globe.jpg',
  features: [
    { key:'volc',       title:'盾形火山 Shield Volcanoes', desc:'金星表面遍布大型盾形火山，马亚特火山高达8km，可能仍在活动。盾形火山由低黏度熔岩层层堆叠形成，坡度平缓。金星大气SO₂浓度波动也暗示近期火山活动。' },
    { key:'greenhouse', title:'失控温室效应',              desc:'金星大气CO₂占比96.5%，地表气压达地球92倍。太阳辐射穿透大气加热地表，地表向外辐射的红外线却无法逃逸——温室效应失控使表面温度高达465°C，足以融化铅。' },
    { key:'tessera',    title:'镶嵌地形 Tesserae',         desc:'金星表面最古老的地貌单元，由复杂交错的脊谷和断裂组成，约占表面8%。被认为是经历多期构造变形的古老地壳残片，形成于约7亿年前金星全球表面重塑之前。' },
  ],
  drawIllo(key, ctx, w) {
    ({
      volc() {
        const g=ctx.createLinearGradient(0,0,0,w);
        g.addColorStop(0,'#221100'); g.addColorStop(0.3,'#cc8811'); g.addColorStop(0.6,'#ddbb44'); g.addColorStop(1,'#221100');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.moveTo(w/2,8); ctx.lineTo(38,38); ctx.lineTo(10,38); ctx.closePath();
        ctx.fillStyle='#664400'; ctx.fill();
        ctx.fillStyle='rgba(255,150,30,0.4)'; ctx.beginPath(); ctx.arc(w/2,38,4,0,Math.PI*2); ctx.fill();
      },
      greenhouse() {
        ctx.fillStyle='#331100'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,32,14,Math.PI,0); ctx.fillStyle='#994400'; ctx.fill();
        ctx.fillStyle='rgba(255,200,50,0.15)'; ctx.fillRect(0,18,w,30);
        ['↑','↑','↑'].forEach((a,i)=>{ctx.fillStyle='rgba(255,180,50,0.5)';ctx.font='12px monospace';ctx.fillText(a,10+i*15,30-Math.random()*16);});
      },
      tessera() {
        ctx.fillStyle='#994400'; ctx.fillRect(0,0,w,w);
        for(let i=0;i<12;i++){
          ctx.beginPath(); ctx.moveTo(Math.random()*w,Math.random()*w);
          ctx.lineTo(Math.random()*w,Math.random()*w);
          ctx.strokeStyle='rgba(200,150,50,0.5)'; ctx.lineWidth=1; ctx.stroke();
        }
        ctx.fillStyle='rgba(120,60,20,0.3)'; ctx.fillRect(5,22,38,6);
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    const haze = new THREE.Mesh(
      new THREE.SphereGeometry(r*1.03,40,40),
      new THREE.MeshBasicMaterial({color:0xddaa55,transparent:true,opacity:0.28,fog:false,depthWrite:false}));
    mesh.add(haze); layers.push({mesh:haze,type:'rotate',speed:-0.0003});
  },
};
