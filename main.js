// WDP 智慧校园可视化大屏 — 复旦大学邯郸校区
// 架构：4 模块切换，每模块独立图层 + ECharts 面板
import WdpApi from 'wdpapi';

// ============================
// 配置
// ============================
const WDP_CONFIG = {
  SERVER_URL: 'https://dtp-api.51aes.com',
  ORDER_CODE: '627cf6aabe351f988897c0b3f09e3dd7',
};

const SCENE_CENTER = [121.5030, 31.2990, 400];

// POI (校园概览图层 — 建筑设施标注)
const POI_LIST = [
  { name: '光华楼',     coord: [121.5045, 31.2985, 50], type: '教学楼' },
  { name: '图书馆',     coord: [121.5035, 31.3005, 35], type: '图书馆' },
  { name: '正大体育馆', coord: [121.5060, 31.2970, 25], type: '体育馆' },
  { name: '校门',       coord: [121.5025, 31.2960, 15], type: '出入口' },
];

// 热力检测区域 (智能检测图层)
const HEATMAP_POINTS = [
  { point: [121.5045, 31.2985], value: 88 },
  { point: [121.5015, 31.2998], value: 62 },
  { point: [121.5005, 31.2975], value: 95 },  // 食堂高密度
  { point: [121.5035, 31.3005], value: 45 },
  { point: [121.5060, 31.2970], value: 78 },  // 体育馆高密度
  { point: [121.5025, 31.2960], value: 70 },
  { point: [121.5055, 31.3010], value: 35 },
  { point: [121.4995, 31.3015], value: 50 },
  { point: [121.5030, 31.3020], value: 30 },
  { point: [121.5040, 31.2960], value: 20 },
  { point: [121.5020, 31.2990], value: 72 },
  { point: [121.5038, 31.2975], value: 55 },
];

// 巡检路线 (设备运维图层)
const PATROL_ROUTES = {
  水电巡检: {
    color: '0af5ffff',
    coords: [
      [121.5005, 31.2975], [121.5015, 31.2998], [121.5045, 31.2985],
      [121.5055, 31.3010], [121.5030, 31.3020], [121.4995, 31.3015],
      [121.5005, 31.2975]
    ]
  },
  消防巡检: {
    color: 'ff8800ff',
    coords: [
      [121.5025, 31.2960], [121.5040, 31.2960], [121.5060, 31.2970],
      [121.5045, 31.2985], [121.5035, 31.3005], [121.5025, 31.2960]
    ]
  }
};

// 调度迁徙线 (设备运维图层)
const DISPATCH_FLOWS = [
  { from: [121.5030, 31.3020], to: [121.5005, 31.2975], name: '食堂区抢修', type: 'repair', color: 'ff5252ff' },
  { from: [121.5030, 31.3020], to: [121.5015, 31.2998], name: '教学楼配送', type: 'delivery', color: '00e676ff' },
  { from: [121.5030, 31.3020], to: [121.5025, 31.2960], name: '校门调度', type: 'dispatch', color: '448affff' },
];

// 安防分区轮廓 (安防管理图层)
const SECURITY_ZONES = [
  {
    name: '校门出入口区',
    risk: 'warning',
    color: 'ffc107aa',
    fillColor: 'ffc10733',
    coords: [
      [121.5018, 31.2955], [121.5032, 31.2955],
      [121.5032, 31.2965], [121.5018, 31.2965]
    ]
  },
  {
    name: '教学区',
    risk: 'normal',
    color: '0af5ffaa',
    fillColor: '0af5ff22',
    coords: [
      [121.5008, 31.2992], [121.5050, 31.2992],
      [121.5050, 31.3010], [121.5008, 31.3010]
    ]
  },
  {
    name: '宿舍区',
    risk: 'normal',
    color: '00e676aa',
    fillColor: '00e67622',
    coords: [
      [121.4988, 31.3010], [121.5005, 31.3010],
      [121.5005, 31.3025], [121.4988, 31.3025]
    ]
  },
  {
    name: '实验区',
    risk: 'danger',
    color: 'ff4444aa',
    fillColor: 'ff444433',
    coords: [
      [121.5048, 31.3005], [121.5065, 31.3005],
      [121.5065, 31.3018], [121.5048, 31.3018]
    ]
  },
  {
    name: '体育区',
    risk: 'normal',
    color: '0af5ffaa',
    fillColor: '0af5ff22',
    coords: [
      [121.5052, 31.2962], [121.5070, 31.2962],
      [121.5070, 31.2978], [121.5052, 31.2978]
    ]
  },
  {
    name: '停车区',
    risk: 'warning',
    color: 'ffc107aa',
    fillColor: 'ffc10733',
    coords: [
      [121.5042, 31.2950], [121.5055, 31.2950],
      [121.5055, 31.2960], [121.5042, 31.2960]
    ]
  },
  {
    name: '周界防护区(北)',
    risk: 'danger',
    color: 'ff4444aa',
    fillColor: 'ff444433',
    coords: [
      [121.4985, 31.3025], [121.5070, 31.3025],
      [121.5070, 31.3030], [121.4985, 31.3030]
    ]
  },
];

// ============================
// 全局状态
// ============================
let App = null;
let currentModule = 'overview';

// 图层状态 — 每个图层独立控制
const LAYERS = {
  poi:      { objects: [], loaded: false, loading: false, visible: false },
  heatmap:  { objects: [], loaded: false, loading: false, visible: false },
  patrol:   { objects: [], loaded: false, loading: false, visible: false },
  dispatch: { objects: [], loaded: false, loading: false, visible: false },
  zone:     { objects: [], loaded: false, loading: false, visible: false },
};

// ============================
// UI 工具
// ============================
function showStatus(msg, isError = false) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (!dot || !text) return;
  text.innerText = msg;
  dot.className = isError ? 'dot wait' : 'dot ok';
  if (isError) dot.style.background = '#f56c6c';
  console[isError ? 'error' : 'log'](`[WDP] ${msg}`);
}

function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleString('zh-CN', { hour12: false });
  };
  tick(); setInterval(tick, 1000);
}

// ============================
// 模块切换 (仅切换左右面板，不影响图层)
// ============================
function initModuleSwitcher() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.module-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mod = tab.dataset.module;
      if (mod === currentModule) return;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      contents.forEach(c => c.classList.toggle('active', c.dataset.module === mod));
      currentModule = mod;
      showStatus(`已切换到 ${getModuleName(mod)}`);
    });
  });
}

function getModuleName(mod) {
  return { overview: '校园概览', detect: '智能检测', device: '设备运维', security: '安防管理' }[mod] || mod;
}

// ============================
// 图层控制核心
// ============================
function initLayerPanel() {
  const btns = document.querySelectorAll('.layer-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => toggleLayer(btn.dataset.layer, btn));
  });
}

async function toggleLayer(layerKey, btn) {
  const layer = LAYERS[layerKey];
  if (!layer || layer.loading) return;
  if (!App) { showStatus('场景未就绪，无法操作图层', true); return; }

  if (layer.visible) {
    // 关闭图层
    for (const obj of layer.objects) {
      try { obj.SetVisible(false); } catch (e) { /* ignore */ }
    }
    layer.visible = false;
    btn.classList.remove('on');
    showStatus(`已关闭 ${getLayerName(layerKey)}`);
  } else {
    // 开启图层
    if (layer.loaded) {
      for (const obj of layer.objects) {
        try { obj.SetVisible(true); } catch (e) { /* ignore */ }
      }
      layer.visible = true;
      btn.classList.add('on');
      showStatus(`已开启 ${getLayerName(layerKey)}`);
      // 镜头聚焦
      flyToLayer(layerKey);
    } else {
      // 首次加载
      layer.loading = true;
      btn.classList.add('loading');
      try {
        await loadLayer(layerKey);
        layer.loaded = true;
        layer.visible = true;
        btn.classList.add('on');
        // 镜头聚焦
        flyToLayer(layerKey);
      } catch (err) {
        showStatus(`加载${getLayerName(layerKey)}失败: ${err.message}`, true);
      }
      layer.loading = false;
      btn.classList.remove('loading');
    }
  }
}

function getLayerName(key) {
  return { poi: '建筑设施标注', heatmap: '人流密度热力', patrol: '设备巡检路线', dispatch: '维修调度路线', zone: '安防风险分区' }[key] || key;
}

// 图层对应的镜头位置
const LAYER_CAMERA = {
  poi:      { location: SCENE_CENTER, rotation: { pitch: -55, yaw: 0 }, flyTime: 2 },
  heatmap:  { location: [121.5030, 31.2990, 600], rotation: { pitch: -70, yaw: 0 }, flyTime: 2 },
  patrol:   { location: [121.5030, 31.2990, 500], rotation: { pitch: -60, yaw: 30 }, flyTime: 2 },
  dispatch: { location: [121.5030, 31.3000, 500], rotation: { pitch: -50, yaw: -20 }, flyTime: 2 },
  zone:     { location: [121.5030, 31.2990, 700], rotation: { pitch: -75, yaw: 0 }, flyTime: 2 },
};

async function loadLayer(key) {
  switch (key) {
    case 'poi':      return loadPOILayer(); 
    case 'heatmap':  return loadHeatmapLayer();
    case 'patrol':   return loadPatrolLayer();
    case 'dispatch': return loadDispatchLayer();
    case 'zone':     return loadZoneLayer();
  }
}

function flyToLayer(key) {
  const cam = LAYER_CAMERA[key];
  if (cam && App) {
    App.CameraControl.SetCameraPose(cam).catch(() => {});
  }
}

function unlockLayerPanel() {
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.style.pointerEvents = '';
    btn.style.opacity = '';
  });
}

// ============================
// 图层加载 — POI (建筑设施标注)
// ============================
async function loadPOILayer() {
  showStatus('正在添加建筑设施标注...');
  for (let i = 0; i < POI_LIST.length; i++) {
    const loc = POI_LIST[i];
    const poi = new App.Poi({
      location: loc.coord,
      poiStyle: {
        markerNormalUrl: 'https://wdp5-api-debug.51aes.com/static/newMarker.png',
        markerActivateUrl: 'https://wdp5-api-debug.51aes.com/static/newMarker_active.png',
        markerSize: [50, 79],
        labelBgImageUrl: 'https://wdp5-api-debug.51aes.com/static/newLabel.png',
        labelBgSize: [120, 44],
        labelBgOffset: [6, 85],
        labelContent: [loc.name, 'ffffffff', '13'],
        labelContentOffset: [25, 14],
        labelTop: false,
      },
      entityName: `poi-${loc.name}`,
      customId: `poi-${i}`,
      customData: { type: loc.type },
      bVisible: true,
      visible2D: {
        camera: { hideDistance: 2000, hideType: 'default', scaleMode: '2D' },
        interaction: { clickTop: true, hoverTop: true },
        entity: { overlapOrder: 2 }
      }
    });
    const res = await App.Scene.Add(poi, {
      calculateCoordZ: { coordZRef: 'surface', coordZOffset: 30 }
    });
    if (res) LAYERS.poi.objects.push(poi);
  }
  showStatus(`已添加 ${LAYERS.poi.objects.length} 个建筑标注`);
}

// ============================
// 图层加载 — 人流密度热力图 (HeatMap)
// ============================
async function loadHeatmapLayer() {
  showStatus('正在生成人流密度热力图...');
  const heatmap = new App.HeatMap({
    heatMapStyle: {
      type: 'fit',
      brushDiameter: 300,
      mappingValueRange: [1, 100],
      gradientSetting: ['00e676', '44ccff', 'ffaa00', 'ff4444', 'ff0066']
    },
    bVisible: true,
    entityName: 'heatmap-detect',
    customId: 'heatmap-detect',
    points: { features: HEATMAP_POINTS }
  });
  const res = await App.Scene.Add(heatmap, {
    calculateCoordZ: { coordZRef: 'surface', coordZOffset: 5 }
  });
  if (res?.success) LAYERS.heatmap.objects.push(heatmap);
  showStatus('人流密度热力图已生成');
}

// ============================
// 图层加载 — 设备巡检路线 (Path)
// ============================
async function loadPatrolLayer() {
  showStatus('正在加载设备巡检路线...');
  for (const [name, route] of Object.entries(PATROL_ROUTES)) {
    const path = new App.Path({
      polyline: { coordinates: route.coords },
      pathStyle: {
        type: 'arrow',
        width: 8,
        color: route.color,
        passColor: '0656a0aa'
      },
      bVisible: true,
      entityName: `patrol-${name}`,
      customId: `patrol-${name}`
    });
    const res = await App.Scene.Add(path, {
      calculateCoordZ: { coordZRef: 'surface', coordZOffset: 10 }
    });
    if (res?.success) LAYERS.patrol.objects.push(path);
  }
  showStatus('设备巡检路线已加载');
}

// ============================
// 图层加载 — 维修调度路线 (Parabola)
// ============================
async function loadDispatchLayer() {
  showStatus('正在加载维修调度路线...');
  for (let i = 0; i < DISPATCH_FLOWS.length; i++) {
    const flow = DISPATCH_FLOWS[i];
    const parabola = new App.Parabola({
      polyline: { coordinates: [flow.from, flow.to] },
      parabolaStyle: {
        topHeight: 100,
        topScale: 0.5,
        type: 'scanline',
        width: 4,
        color: flow.color,
        gather: true
      },
      bVisible: true,
      entityName: `dispatch-${flow.name}`,
      customId: `dispatch-${i}`
    });
    const res = await App.Scene.Add(parabola, {
      calculateCoordZ: { coordZRef: 'surface', coordZOffset: 15 }
    });
    if (res?.success) LAYERS.dispatch.objects.push(parabola);
  }
  showStatus('维修调度路线已加载');
}

// ============================
// 图层加载 — 安防风险分区轮廓 (Range)
// ============================
async function loadZoneLayer() {
  showStatus('正在加载安防风险分区...');
  for (let i = 0; i < SECURITY_ZONES.length; i++) {
    const zone = SECURITY_ZONES[i];
    const range = new App.Range({
      polygon2D: {
        coordinates: [zone.coords]
      },
      rangeStyle: {
        shape: 'polygon',
        type: 'loop_line',
        fillAreaType: 'block',
        height: 60,
        strokeWeight: 6,
        color: zone.color,
        fillAreaColor: zone.fillColor,
        bBlocked: false
      },
      bVisible: true,
      entityName: `zone-${zone.name}`,
      customId: `zone-${i}`,
      customData: { risk: zone.risk, zoneName: zone.name }
    });
    const res = await App.Scene.Add(range, {
      calculateCoordZ: { coordZRef: 'surface', coordZOffset: 5 }
    });
    if (res?.success) LAYERS.zone.objects.push(range);
  }
  showStatus(`已加载 ${LAYERS.zone.objects.length} 个安防风险分区`);
}

// ============================
// ECharts 图表初始化
// ============================
const ecTheme = {
  bg: 'transparent',
  textColor: '#6ba8c9',
  axisLine: '#1a3a5c',
  splitLine: 'rgba(10,245,255,0.06)',
};

function ecBase(dom) {
  const el = document.getElementById(dom);
  if (!el) return null;
  const chart = echarts.init(el, null, { renderer: 'canvas' });
  new ResizeObserver(() => chart.resize()).observe(el);
  return chart;
}

function initAllCharts() {
  initOverviewCharts();
  initDetectCharts();
  initDeviceCharts();
  initSecurityCharts();
}

// ── 校园概览 图表 ──
function initOverviewCharts() {
  // 建筑资源分布 (柱状图)
  const c1 = ecBase('ec-ov-building');
  if (c1) c1.setOption({
    grid: { top: 10, bottom: 25, left: 40, right: 10 },
    xAxis: { type: 'category', data: ['教学楼','宿舍楼','食堂','实验楼','体育馆','行政楼'], axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 10 } },
    series: [{ type: 'bar', data: [9, 12, 4, 5, 3, 5], barWidth: 18, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#0af5ff' }, { offset: 1, color: '#0656a0' }]) } }]
  });

  // 人员空间分布 (玫瑰图)
  const c2 = ecBase('ec-ov-population');
  if (c2) c2.setOption({
    series: [{
      type: 'pie', roseType: 'radius', radius: ['18%', '65%'], center: ['50%', '50%'],
      data: [
        { value: 42, name: '教学区', itemStyle: { color: '#0af5ff' } },
        { value: 28, name: '生活区', itemStyle: { color: '#00e676' } },
        { value: 18, name: '运动区', itemStyle: { color: '#ffc107' } },
        { value: 12, name: '行政区', itemStyle: { color: '#448aff' } }
      ],
      label: { color: '#6ba8c9', fontSize: 10 },
      labelLine: { lineStyle: { color: '#1a3a5c' } }
    }]
  });

  // 教学运行态势 (折线图)
  const c3 = ecBase('ec-ov-teaching');
  if (c3) c3.setOption({
    grid: { top: 10, bottom: 25, left: 40, right: 10 },
    xAxis: { type: 'category', data: ['8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'], axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
    series: [{
      type: 'line', smooth: true, data: [12, 38, 45, 52, 18, 40, 48, 44, 30, 10],
      lineStyle: { color: '#0af5ff', width: 2 }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(10,245,255,0.3)' }, { offset: 1, color: 'rgba(10,245,255,0)' }]) },
      itemStyle: { color: '#0af5ff' }, symbol: 'circle', symbolSize: 4
    }]
  });

  // 空间使用率 (横向条形图)
  const c4 = ecBase('ec-ov-space');
  if (c4) c4.setOption({
    grid: { top: 5, bottom: 10, left: 80, right: 35 },
    yAxis: { type: 'category', data: ['正大体育馆','图书馆','三教','理科楼','光华楼'], axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 10 } },
    xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
    series: [{ type: 'bar', data: [60, 78, 92, 85, 88], barWidth: 12, label: { show: true, position: 'right', color: '#0af5ff', fontSize: 10, formatter: '{c}%' }, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#0656a0' }, { offset: 1, color: '#0af5ff' }]) } }]
  });
}

// ── 智能检测 图表 ──
function initDetectCharts() {
  // 异常类型分布 (饼图)
  const c1 = ecBase('ec-dt-type');
  if (c1) c1.setOption({
    series: [{
      type: 'pie', radius: ['35%', '62%'], center: ['50%', '50%'],
      data: [
        { value: 18, name: '人员聚集', itemStyle: { color: '#0af5ff' } },
        { value: 8, name: '烟雾火情', itemStyle: { color: '#ff4444' } },
        { value: 6, name: '违规闯入', itemStyle: { color: '#ffc107' } },
        { value: 5, name: '车辆异常', itemStyle: { color: '#448aff' } },
        { value: 7, name: '环境异常', itemStyle: { color: '#00e676' } },
        { value: 3, name: '实验室异常', itemStyle: { color: '#ff8800' } }
      ],
      label: { color: '#6ba8c9', fontSize: 10 },
      labelLine: { lineStyle: { color: '#1a3a5c' } }
    }]
  });

  // 高风险区域排行 (横向条形图)
  const c2 = ecBase('ec-dt-hotarea');
  if (c2) c2.setOption({
    grid: { top: 5, bottom: 10, left: 65, right: 35 },
    yAxis: { type: 'category', data: ['校门口','实验楼','操场区','食堂区','宿舍区','图书馆'], axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 10 } },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
    series: [{ type: 'bar', data: [5, 12, 8, 15, 9, 4], barWidth: 12, label: { show: true, position: 'right', color: '#ff4444', fontSize: 10 }, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#6a0000' }, { offset: 1, color: '#ff4444' }]) } }]
  });

  // 检测时段趋势 (折线图)
  const c3 = ecBase('ec-dt-trend');
  if (c3) {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const today = [2, 1, 0, 0, 1, 3, 8, 15, 12, 8, 5, 6, 10, 14, 9, 7, 5, 8, 12, 10, 6, 4, 3, 2];
    const avg = [3, 2, 1, 1, 1, 4, 10, 13, 11, 7, 6, 7, 9, 11, 8, 6, 5, 7, 10, 8, 5, 4, 3, 2];
    c3.setOption({
      grid: { top: 10, bottom: 25, left: 30, right: 10 },
      legend: { data: ['今日', '本周均值'], top: 0, textStyle: { color: '#6ba8c9', fontSize: 10 } },
      xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 8, interval: 3 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
      series: [
        { name: '今日', type: 'line', smooth: true, data: today, lineStyle: { color: '#ff4444', width: 2 }, itemStyle: { color: '#ff4444' }, symbol: 'none' },
        { name: '本周均值', type: 'line', smooth: true, data: avg, lineStyle: { color: '#448aff', width: 1, type: 'dashed' }, itemStyle: { color: '#448aff' }, symbol: 'none' }
      ]
    });
  }

  // 摄像头覆盖 (仪表盘)
  const c4 = ecBase('ec-dt-camera');
  if (c4) c4.setOption({
    series: [{
      type: 'gauge', radius: '80%', center: ['50%', '55%'],
      startAngle: 200, endAngle: -20,
      min: 0, max: 100,
      axisLine: { lineStyle: { width: 12, color: [[0.6, '#0656a0'], [0.85, '#0af5ff'], [1, '#00e676']] } },
      axisTick: { show: false }, splitLine: { show: false },
      axisLabel: { color: '#5a8aaa', fontSize: 9, distance: -28 },
      pointer: { length: '55%', width: 4, itemStyle: { color: '#0af5ff' } },
      detail: { valueAnimation: true, formatter: '{value}%', color: '#0af5ff', fontSize: 18, offsetCenter: [0, '65%'] },
      data: [{ value: 87, name: 'AI覆盖率' }],
      title: { color: '#6ba8c9', fontSize: 11, offsetCenter: [0, '85%'] }
    }]
  });

  // 处置闭环 (漏斗图)
  const c5 = ecBase('ec-dt-funnel');
  if (c5) c5.setOption({
    series: [{
      type: 'funnel', left: '15%', right: '15%', top: 10, bottom: 10,
      minSize: '30%', maxSize: '100%', gap: 2,
      label: { position: 'inside', color: '#fff', fontSize: 10 },
      data: [
        { value: 100, name: '检测发现', itemStyle: { color: '#0af5ff' } },
        { value: 80, name: '告警生成', itemStyle: { color: '#448aff' } },
        { value: 60, name: '工单派发', itemStyle: { color: '#ffc107' } },
        { value: 45, name: '人员到场', itemStyle: { color: '#ff8800' } },
        { value: 35, name: '处置完成', itemStyle: { color: '#00e676' } }
      ]
    }]
  });
}

// ── 设备运维 图表 ──
function initDeviceCharts() {
  // 设备分类运行状态 (堆叠柱状图)
  const c1 = ecBase('ec-dv-status');
  if (c1) c1.setOption({
    grid: { top: 25, bottom: 25, left: 40, right: 10 },
    legend: { data: ['在线', '异常', '离线'], top: 0, textStyle: { color: '#6ba8c9', fontSize: 10 } },
    xAxis: { type: 'category', data: ['电力','给排水','空调','照明','安防','网络'], axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
    series: [
      { name: '在线', type: 'bar', stack: 'all', data: [380, 220, 310, 560, 420, 280], itemStyle: { color: '#00e676' } },
      { name: '异常', type: 'bar', stack: 'all', data: [12, 8, 18, 5, 3, 6], itemStyle: { color: '#ffc107' } },
      { name: '离线', type: 'bar', stack: 'all', data: [8, 12, 20, 15, 7, 16], itemStyle: { color: '#5a8aaa' } }
    ]
  });

  // 工单处置趋势 (折线图)
  const c2 = ecBase('ec-dv-workorder');
  if (c2) c2.setOption({
    grid: { top: 25, bottom: 25, left: 35, right: 10 },
    legend: { data: ['新增', '完成', '超时'], top: 0, textStyle: { color: '#6ba8c9', fontSize: 10 } },
    xAxis: { type: 'category', data: ['周一','周二','周三','周四','周五','周六','周日'], axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
    series: [
      { name: '新增', type: 'line', smooth: true, data: [15, 22, 18, 25, 20, 8, 5], lineStyle: { color: '#0af5ff' }, itemStyle: { color: '#0af5ff' }, symbol: 'circle', symbolSize: 4 },
      { name: '完成', type: 'line', smooth: true, data: [12, 18, 20, 22, 19, 10, 6], lineStyle: { color: '#00e676' }, itemStyle: { color: '#00e676' }, symbol: 'circle', symbolSize: 4 },
      { name: '超时', type: 'line', smooth: true, data: [3, 4, 2, 5, 3, 1, 0], lineStyle: { color: '#ff4444' }, itemStyle: { color: '#ff4444' }, symbol: 'circle', symbolSize: 4 }
    ]
  });

  // 资产生命周期 (环形图)
  const c3 = ecBase('ec-dv-lifecycle');
  if (c3) c3.setOption({
    series: [{
      type: 'pie', radius: ['35%', '62%'], center: ['50%', '50%'],
      data: [
        { value: 420, name: '新设备', itemStyle: { color: '#0af5ff' } },
        { value: 1200, name: '在保设备', itemStyle: { color: '#00e676' } },
        { value: 380, name: '临保到期', itemStyle: { color: '#ffc107' } },
        { value: 340, name: '老旧设备', itemStyle: { color: '#ff8800' } },
        { value: 120, name: '待报废', itemStyle: { color: '#ff4444' } }
      ],
      label: { color: '#6ba8c9', fontSize: 10 },
      labelLine: { lineStyle: { color: '#1a3a5c' } }
    }]
  });

  // 能耗趋势 (面积折线图)
  const c4 = ecBase('ec-dv-energy');
  if (c4) {
    const days = Array.from({ length: 7 }, (_, i) => `4/${8 + i}`);
    c4.setOption({
      grid: { top: 25, bottom: 25, left: 35, right: 10 },
      legend: { data: ['用电', '用水', '空调'], top: 0, textStyle: { color: '#6ba8c9', fontSize: 10 } },
      xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 10 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
      series: [
        { name: '用电', type: 'line', smooth: true, data: [380, 420, 390, 410, 450, 320, 280], lineStyle: { color: '#ffc107' }, areaStyle: { color: 'rgba(255,193,7,0.1)' }, itemStyle: { color: '#ffc107' }, symbol: 'none' },
        { name: '用水', type: 'line', smooth: true, data: [120, 135, 128, 140, 138, 100, 90], lineStyle: { color: '#0af5ff' }, areaStyle: { color: 'rgba(10,245,255,0.1)' }, itemStyle: { color: '#0af5ff' }, symbol: 'none' },
        { name: '空调', type: 'line', smooth: true, data: [200, 230, 220, 250, 260, 180, 150], lineStyle: { color: '#00e676' }, areaStyle: { color: 'rgba(0,230,118,0.1)' }, itemStyle: { color: '#00e676' }, symbol: 'none' }
      ]
    });
  }
}

// ── 安防管理 图表 ──
function initSecurityCharts() {
  // 事件类型分布 (饼图)
  const c1 = ecBase('ec-sc-type');
  if (c1) c1.setOption({
    series: [{
      type: 'pie', radius: ['35%', '62%'], center: ['50%', '50%'],
      data: [
        { value: 12, name: '非法闯入', itemStyle: { color: '#ff4444' } },
        { value: 18, name: '门禁异常', itemStyle: { color: '#ffc107' } },
        { value: 8, name: '周界告警', itemStyle: { color: '#ff8800' } },
        { value: 5, name: '烟感火警', itemStyle: { color: '#ff0066' } },
        { value: 15, name: '人员聚集', itemStyle: { color: '#0af5ff' } },
        { value: 10, name: '车辆异常', itemStyle: { color: '#448aff' } }
      ],
      label: { color: '#6ba8c9', fontSize: 10 },
      labelLine: { lineStyle: { color: '#1a3a5c' } }
    }]
  });

  // 区域风险分级 (横向条形图)
  const c2 = ecBase('ec-sc-risk');
  if (c2) c2.setOption({
    grid: { top: 5, bottom: 10, left: 55, right: 35 },
    yAxis: { type: 'category', data: ['校门区','宿舍区','实验区','体育区','周界区'], axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 10 } },
    xAxis: { type: 'value', max: 10, splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
    series: [{ type: 'bar', data: [
      { value: 6, itemStyle: { color: '#ffc107' } },
      { value: 3, itemStyle: { color: '#00e676' } },
      { value: 9, itemStyle: { color: '#ff4444' } },
      { value: 2, itemStyle: { color: '#0af5ff' } },
      { value: 8, itemStyle: { color: '#ff8800' } }
    ], barWidth: 12, label: { show: true, position: 'right', color: '#6ba8c9', fontSize: 10 } }]
  });

  // 安防力量布控 (雷达图)
  const c3 = ecBase('ec-sc-radar');
  if (c3) c3.setOption({
    radar: {
      indicator: [
        { name: '校门布控', max: 10 }, { name: '宿舍布控', max: 10 },
        { name: '周界布控', max: 10 }, { name: '视频覆盖', max: 10 },
        { name: '巡逻密度', max: 10 }, { name: '应急能力', max: 10 }
      ],
      radius: '60%',
      axisName: { color: '#6ba8c9', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1a3a5c' } },
      splitLine: { lineStyle: { color: '#1a3a5c' } },
      splitArea: { areaStyle: { color: ['rgba(10,245,255,0.02)', 'rgba(10,245,255,0.05)'] } }
    },
    series: [{
      type: 'radar',
      data: [{ value: [8, 6, 9, 8, 7, 6], areaStyle: { color: 'rgba(10,245,255,0.2)' }, lineStyle: { color: '#0af5ff' }, itemStyle: { color: '#0af5ff' } }]
    }]
  });

  // 门禁通行态势 (折线图)
  const c4 = ecBase('ec-sc-access');
  if (c4) {
    const hours = ['6:00','8:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'];
    c4.setOption({
      grid: { top: 25, bottom: 25, left: 35, right: 10 },
      legend: { data: ['进校', '出校'], top: 0, textStyle: { color: '#6ba8c9', fontSize: 10 } },
      xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: ecTheme.axisLine } }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: ecTheme.splitLine } }, axisLine: { show: false }, axisLabel: { color: ecTheme.textColor, fontSize: 9 } },
      series: [
        { name: '进校', type: 'line', smooth: true, data: [200, 1800, 800, 500, 600, 400, 1200, 300, 50], lineStyle: { color: '#0af5ff' }, areaStyle: { color: 'rgba(10,245,255,0.15)' }, itemStyle: { color: '#0af5ff' }, symbol: 'none' },
        { name: '出校', type: 'line', smooth: true, data: [50, 200, 300, 1500, 400, 600, 1600, 800, 200], lineStyle: { color: '#ff8800' }, areaStyle: { color: 'rgba(255,136,0,0.1)' }, itemStyle: { color: '#ff8800' }, symbol: 'none' }
      ]
    });
  }

  // 告警处置闭环 (漏斗图)
  const c5 = ecBase('ec-sc-funnel');
  if (c5) c5.setOption({
    series: [{
      type: 'funnel', left: '15%', right: '15%', top: 10, bottom: 10,
      minSize: '30%', maxSize: '100%', gap: 2,
      label: { position: 'inside', color: '#fff', fontSize: 10 },
      data: [
        { value: 68, name: '发现告警', itemStyle: { color: '#ff4444' } },
        { value: 55, name: '核验告警', itemStyle: { color: '#ff8800' } },
        { value: 42, name: '派发任务', itemStyle: { color: '#ffc107' } },
        { value: 35, name: '到场处置', itemStyle: { color: '#0af5ff' } },
        { value: 30, name: '事件关闭', itemStyle: { color: '#00e676' } }
      ]
    }]
  });
}

// ============================
// WDP 初始化
// ============================
async function bootstrap() {
  startClock();
  initModuleSwitcher();
  initLayerPanel();
  initAllCharts();

  // 场景未就绪前禁用图层按钮
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.4';
  });

  try {
    showStatus('初始化场景...');

    App = new WdpApi({
      id: 'player',
      url: WDP_CONFIG.SERVER_URL,
      order: WDP_CONFIG.ORDER_CODE,
      debugMode: 'normal',
    });

    showStatus('正在连接云渲染服务...');
    const startRes = await App.Renderer.Start();
    if (!startRes.success) {
      throw new Error('渲染启动失败: ' + (startRes.message || '口令或服务端错误'));
    }

    App.Renderer.RegisterEvent([
      { name: 'onVideoReady',        func: async () => showStatus('视频流链接成功') },
      { name: 'onStopedRenderCloud',  func: async () => showStatus('渲染服务中断', true) },
      { name: 'onVideoStart',        func: async () => showStatus('视频流播放中') },
      { name: 'onVideoError',        func: async () => showStatus('视频流错误', true) },
    ]);

    App.Renderer.RegisterErrorEvent([{
      name: 'OnValidateError',
      func: async (res) => showStatus('鉴权失败: ' + (res?.result?.message || ''), true)
    }]);

    await App.Renderer.RegisterSceneEvent([
      {
        name: 'OnWdpSceneIsReady',
        func: async (res) => {
          const progress = res?.result?.progress || 0;
          showStatus(`场景加载中... ${progress}%`);
          if (progress >= 100) {
            showStatus('场景就绪 — 图层控制已解锁');
            unlockLayerPanel();
          }
        }
      },
      {
        name: 'OnEntityClicked',
        func: async (res) => {
          const eid = res?.result?.eid || '未知';
          const eName = res?.result?.entityName || '';
          showStatus(`点击实体: ${eName || eid}`);
        }
      }
    ]);

    showStatus('等待场景加载...');

  } catch (err) {
    showStatus(err.message, true);
  }
}

bootstrap();
