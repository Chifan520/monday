# monday —— 太阳系3D互动星图 & 神经网络可视化

> 一个集合了航天器仪表风格交互界面、程序化纹理生成、高精度天体模拟与神经网络信号传播可视化的前端实验工程。

---

## 项目结构

```
monday/
├── solar-system.html          # 【主入口】太阳系3D星图 (210行)
├── src/
│   ├── overview.js            # 全景模式引擎 (872行)
│   └── zoom.js                # 放大模式引擎 (459行)
├── libs/
│   └── three.min.js           # Three.js r128 本地库 (589KB)
├── neural-network-3d.html     # 3D神经网络可视化 (独立页面, 274行)
├── neural-network-viz.html    # 2D Canvas神经网络可视化 (独立页面, 276行)
└── README.md                  # 本文件
```

---

## 核心架构

### 两层渲染引擎

| 模式 | 文件 | 纹理来源 | 材质 | 光照 |
|------|------|----------|------|------|
| **全景** | `src/overview.js` | Canvas 程序化 FBM 噪声 | `MeshPhongMaterial` | PointLight + Ambient |
| **放大** | `src/zoom.js` | NASA/Wikimedia 真实照片 | `MeshBasicMaterial` | 完全忽略（全亮） |

**切换机制：** `solar-system.html` 注册双击事件 → `overview.js` 调用 `zoomToPlanet()`（定义于 `zoom.js`）。放大时相机平滑飞近行星（距离 = 行星半径 × 5），材质从 Phong（依赖光照，半边暗）切换为 Basic（无阴影），同时从 CDN 异步加载的真实纹理替换掉程序化纹理。

### 程序化纹理系统

所有全景纹理通过 **Fractal Brownian Motion (FBM)** 噪声算法在 Canvas 上实时生成，每个像素逐像素计算：

- `vnoise()` — 单层值噪声（基于正弦哈希的伪随机）
- `fbm()` — 多倍频程叠加（5-6 层 octave，频率逐层 ×2，振幅逐层 ×0.5）
- `makeTexture(fn, size)` — 通用纹理工厂（传入绘制函数 + 分辨率）

**各行星纹理特征：**
- **太阳**：FBM 模拟对流胞 + 径向边缘暗化 + 随机黑子
- **水星**：灰色岩石底纹 + 40 个渐变陨击坑
- **金星**：正弦波段 + 噪声扰动模拟硫酸云
- **地球**：FBM 分界大陆/海洋 + 极地冰盖 + 白云覆盖层
- **火星**：铁锈红噪声 + 水手号峡谷示意线 + 极地冰盖
- **木星**：6色云带 + 大红斑渐变椭圆
- **土星**：淡黄正弦波段 + 渐变光环纹理（径向 UV 映射）
- **天王星/海王星**：蓝绿色调 FBM + 风暴斑点

### 太阳光晕系统

三层加性混合（`AdditiveBlending`）Sprite，从中心到外层：
1. **内层** — 白热核心，14 单位，255,245,200
2. **中层** — 暖橙色日冕，28 单位，255,160,40
3. **外层** — 暗红边缘扩散，50 单位，opacity 0.35

每层都是径向渐变 Canvas 纹理 → `THREE.Sprite` + `AdditiveBlending`，没有生硬的球体边缘。

---

## 交互设计

| 操作 | 行为 | 实现 |
|------|------|------|
| 拖拽 | 旋转视角 | `mousemove` 更新 rotY/rotX |
| 滚轮 | 缩放（全景模式） | 修改 targetDist，动画循环 lerp 平滑过渡 |
| 单击行星 | 打开右侧详情面板 | Raycaster 命中检测 → `openPanel()` |
| 双击行星 | 进入放大模式 | `zoomToPlanet()` → 切换真实纹理 + 相机飞近 |
| 双击空白 | 退出放大模式 | `zoomOut()` → 恢复程序化纹理 + 相机退回 |
| 悬停行星 | 鼠标变 pointer | `checkHoverHint()` → `renderer.domElement.style.cursor` |

放大多做：拖拽旋转开放（围绕行星旋转查看细节），滚轮缩放锁定（防止距离溢出）。

### 触屏支持
单指拖拽旋转、双指捏合缩放、单指点击选中。

---

## 行星数据体系

每颗行星存储完整的结构化信息：

```
{
  name, en, r, orbit, tex, speed, tilt,     // 物理参数 + 轨道
  tagline, desc, geology,                   // 文本描述
  stats: [ {label, value}, ... ]            // 天体物理数据表格
}
```

尺寸/速度基于真实比例缩放（SPEED_SCALE = 0.0012），营造宏大缓慢的太空感。

---

## 放大模式特性

### 真实纹理
9 个天体从 Wikimedia Commons 异步加载（1280px 分辨率），包含太阳、全部 8 颗行星。加载失败时自动回退到程序化纹理。

### 行星定制表面层

| 天体 | 动画层 | 效果 |
|------|--------|------|
| 太阳 | 8道日冕火焰 (RingGeometry) | 旋转+透明度呼吸 |
| 金星 | 淡黄雾球 | 缓慢旋转 |
| 地球 | 白云层球（FBM 云纹理） | 比行星自转更快的旋转 |
| 火星 | 棕灰尘暴球 + 北极白冰冠 | 旋转 + 静止 |
| 木星 | 大红斑矩形 (PlaneGeometry) | 脉冲缩放动画 |
| 土星 | 淡米色薄雾球 | 旋转 |
| 天王星 | 浅蓝雾球 | 反向旋转 |
| 海王星 | 蓝紫风暴雾球 | 旋转 |

### 左侧科普面板
每颗行星 3 个特征卡片，每卡片配 48×48 Canvas 程序化插画 + 中文标题 + 正文字说明。

特征示例：
- 太阳：太阳黑子周期 / 米粒组织对流胞 / 日冕
- 地球：大陆海洋 / 大气层结构 / 月球
- 木星：大红斑 / 云带结构 / 伽利略四大卫星
- 等等

---

## 辅助页面

### neural-network-3d.html
Three.js 3D 前馈网络可视化，6 层 (4→6→8→6→4→2)，3D 空间排布，信号粒子沿边缘飞行带拖尾，支持鼠标旋转缩放。

### neural-network-viz.html
同网络结构的 2D Canvas 版本，粒子背景场 + 思维词闪现 (ANALYZING / BACKPROP / GRADIENT 等)，暗色极简风格。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Three.js r128 | 3D 渲染（场景图、几何体、材质、光照、精灵） |
| Canvas 2D API | 程序化纹理生成（逐像素 FBM 噪声）、2D 神经网络绘制 |
| WebGL | 底层 GPU 渲染 |
| CSS backdrop-filter | 毛玻璃效果面板（safari + chrome） |
| Wikimedia Commons | 真实天文纹理 CDN |

---

## 开发命令

```bash
# 打开太阳系主页面
open solar-system.html

# 打开3D神经网络可视化
open neural-network-3d.html

# 生成知识图谱（需要 understand-anything 插件）
/understand --language zh

# 启动知识图谱仪表盘
/understand-dashboard
```
