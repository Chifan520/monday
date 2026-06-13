# monday —— 太阳系3D互动星图 & 神经网络可视化

> 一个集合了航天器仪表风格交互界面、程序化纹理生成、高精度天体模拟与神经网络信号传播可视化的前端实验工程。

---

## 项目结构

```
monday/
├── solar-system.html          # 【主入口】太阳系3D星图
├── src/
│   ├── overview.js            # 全景模式引擎（场景、纹理、轨道、交互）
│   ├── zoom.js                # 放大模式调度器（纹理懒加载 + 相机缩放）
│   ├── planets/               # 各天体独立定义（素材 + 特征 + 表面层）
│   │   ├── sun.js
│   │   ├── mercury.js
│   │   ├── venus.js
│   │   ├── earth.js
│   │   ├── mars.js
│   │   ├── jupiter.js
│   │   ├── saturn.js
│   │   ├── uranus.js
│   │   ├── neptune.js
│   │   └── moon.js
│   └── panels/                # 面板 UI 独立模块
│       ├── feature-panel.js   # 左侧科普特征面板
│       └── detail-panel.js    # 右侧详情/数据面板
├── libs/
│   └── three.min.js           # Three.js r128 本地库 (589KB)
├── neural-network-3d.html     # 3D神经网络可视化（独立页面）
├── neural-network-viz.html    # 2D Canvas神经网络可视化（独立页面）
└── README.md
```

---

## 核心架构

### 两层渲染引擎

| 模式 | 文件 | 纹理来源 | 材质 | 光照 |
|------|------|----------|------|------|
| **全景** | `src/overview.js` | Canvas 程序化 FBM 噪声 | `MeshPhongMaterial` | PointLight + Ambient |
| **放大** | `src/zoom.js` + `src/planets/*.js` | NASA/Wikimedia 真实照片（懒加载） | `MeshBasicMaterial` | 完全忽略（全亮） |

**切换机制：** 双击行星 → `overview.js` 调用 `zoomToPlanet()` → 相机平滑飞近（距离 = 半径 × 5），材质从 Phong 切换为 Basic，真实纹理按需加载替换程序化纹理。

### 模块化天体定义

每个 `src/planets/<name>.js` 文件注册一个 `PLANET_DEFS['key']` 对象，包含该天体的全部放大模式资产，互不干扰：

```javascript
PLANET_DEFS['earth'] = {
  texUrl:  'https://...wikimedia.../Blue_Marble_2002.png',  // 真实纹理 URL
  features: [ { key, title, desc }, ... ],                  // 科普特征卡片数据
  drawIllo(key, ctx, w) { ... },   // 48×48 Canvas 插画绘制函数
  buildLayers(mesh, r, layers) {   // 放大时在行星上叠加动画层（云层等）
    const cloud = new THREE.Mesh(...);
    mesh.add(cloud); layers.push({ mesh: cloud, type: 'rotate', speed: 0.0008 });
  }
};
```

> 新增/修改单颗行星时只需编辑对应文件，不影响其他天体和引擎。

### 纹理懒加载

放大模式纹理**按需加载**，页面初始不发起任何图片请求：
- 鼠标 hover 行星 → 提前预热该天体纹理
- 双击进入放大 → 立即显示程序化纹理，加载完成后无缝替换为真实照片
- 已加载纹理缓存至 `REAL_TEX`，再次进入同一行星零等待

### 程序化纹理系统（全景模式）

所有全景纹理通过 **Fractal Brownian Motion (FBM)** 噪声在 Canvas 上实时生成：

- `vnoise()` — 单层值噪声（正弦哈希伪随机）
- `fbm()` — 多倍频程叠加（5-6 层 octave）
- `makeTexture(fn, size)` — 通用纹理工厂

### 太阳光晕系统

三层加性混合（`AdditiveBlending`）Sprite，从中心向外：白热核心 → 暖橙日冕 → 暗红扩散，每层径向渐变 Canvas → `THREE.Sprite`，无生硬球体边缘。

---

## 面板系统

| 文件 | 面板 | 触发时机 |
|------|------|----------|
| `src/panels/feature-panel.js` | 左侧科普特征卡片 | 进入放大模式时打开，退出时关闭 |
| `src/panels/detail-panel.js` | 右侧行星名称/描述/数据 | 单击或放大行星时打开 |

面板逻辑与缩放/纹理逻辑完全解耦，修改面板 UI 不影响渲染引擎。

---

## 交互设计

| 操作 | 行为 |
|------|------|
| 拖拽 | 旋转视角 |
| 滚轮 | 缩放（全景模式） |
| 单击行星 | 打开右侧详情面板 |
| 双击行星 | 进入放大模式（加载真实纹理 + 相机飞近 + 打开两侧面板） |
| 双击空白 | 退出放大模式 |
| Hover 行星 | 鼠标变 pointer + 预加载纹理 |
| 地球↔月球链接 | 面板内切换放大目标 |
| 触屏 | 单指旋转、双指捏合缩放 |

---

## 放大模式表面层

| 天体 | 叠加层 | 动画类型 |
|------|--------|----------|
| 太阳 | 8道日冕火焰 (RingGeometry) | flare（旋转+透明呼吸） |
| 金星 | 淡黄大气雾球 | rotate（逆向缓慢） |
| 地球 | FBM 白云层球 | rotate |
| 火星 | 尘暴雾球 + 北极冰冠 | rotate + none |
| 木星 | 大红斑矩形 (PlaneGeometry) | pulse（脉冲缩放） |
| 土星 | 淡米色薄雾球 | rotate |
| 天王星 | 浅蓝雾球 | rotate（逆向） |
| 海王星 | 蓝紫风暴雾球 | rotate |
| 月球 | 浅灰月尘层 | none |

---

## 辅助页面

### neural-network-3d.html
Three.js 3D 前馈网络可视化，6 层 (4→6→8→6→4→2)，信号粒子沿边缘飞行带拖尾，支持鼠标旋转缩放。

### neural-network-viz.html
同网络结构的 2D Canvas 版本，粒子背景场 + 思维词闪现，暗色极简风格。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Three.js r128 | 3D 渲染（场景图、几何体、材质、光照、精灵） |
| Canvas 2D API | 程序化纹理生成（FBM 噪声）、特征插画、2D 神经网络 |
| WebGL | 底层 GPU 渲染 |
| CSS backdrop-filter | 毛玻璃效果面板 |
| Wikimedia Commons | 真实天文纹理 CDN（懒加载） |

---

## 开发命令

```bash
# 打开太阳系主页面
open solar-system.html

# 打开3D神经网络可视化
open neural-network-3d.html
```
