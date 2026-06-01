const ASSETS = {
  cover: "assets/img/bg_cover_hero.png",
  intro: "assets/img/bg_snow_highway.png",
  report: "assets/img/bg_portal_worksite.png",
  summary: "assets/img/bg_tunnel_aerial.png",
};

const stories = [
  "民生故事卡：风雪里的勘测，换来冬季不再绕行的回家路。",
  "民生故事卡：断裂带里的支护与排水，守住了建设者的生命线。",
  "民生故事卡：706 米竖井把新风送入山腹，让超长隧道安全呼吸。",
  "民生故事卡：双机掘进和长隧短打，让多年工程按下加速键。",
  "民生故事卡：通车后，求学、急救、运输和团聚都更近一步。",
];

const levels = [
  {
    title: "雪域勘测",
    chip: "第 1 关｜高寒勘测",
    desc: "顶住风雪遮挡，完成三次路线复核，再选出稳定岩芯取样点。",
    bg: "assets/img/bg_snow_survey.png",
    scene: "assets/img/scene_terrain_map.jpg",
    badge: "assets/img/badge_level_1_survey.png",
    badgeName: "天山探路者",
    className: "fx-snow",
    story: stories[0],
  },
  {
    title: "断裂带攻坚",
    chip: "第 2 关｜F6 断层处置",
    desc: "面对岩爆、突水、塌方等风险，快速选择工程处置方案。",
    bg: "assets/img/bg_fault_tbm.png",
    scene: "assets/img/scene_tbm_front.jpg",
    badge: "assets/img/badge_level_2_fault.png",
    badgeName: "地质征服者",
    className: "fx-fault",
    story: stories[1],
  },
  {
    title: "云端竖井",
    chip: "第 3 关｜706 米通风竖井",
    desc: "长按钻探到 706 米，再按工程顺序拼接通风系统。",
    bg: "assets/img/bg_shaft_cutaway.png",
    scene: "assets/img/scene_shaft_model.png",
    badge: "assets/img/badge_level_3_shaft.png",
    badgeName: "云端筑梦师",
    className: "fx-drill",
    story: stories[2],
  },
  {
    title: "长隧短打",
    chip: "第 4 关｜双机掘进会师",
    desc: "根据不同岩层选择工法，让“天山号”和“胜利号”同步推进。",
    bg: "assets/img/bg_portal_worksite.png",
    scene: "assets/img/scene_tbm_inside.png",
    badge: "assets/img/badge_level_4_dual_tbm.png",
    badgeName: "贯通缔造者",
    className: "fx-tbm",
    story: stories[3],
  },
  {
    title: "贯通天山",
    chip: "第 5 关｜通车联调",
    desc: "完成通车前五项联调验收，点亮南北疆民生通途。",
    bg: "assets/img/bg_snow_highway.png",
    scene: "assets/img/scene_opening_celebration.png",
    badge: "assets/img/badge_level_5_opening.png",
    badgeName: "民生筑路者",
    className: "fx-opening",
    story: stories[4],
  },
];

const state = {
  screen: "start",
  levelIndex: 0,
  earned: Array(levels.length).fill(false),
  stories: Array(levels.length).fill(false),
  sound: true,
  audioCtx: null,
  timers: [],
  levelDone: false,
  playerName: "天山筑路师",
};

const root = document.getElementById("gameRoot");
const soundBtn = document.getElementById("soundBtn");
const toastEl = document.getElementById("toast");

function clearTimers() {
  state.timers.forEach((id) => clearInterval(id));
  state.timers = [];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[char]));
}

function bgStyle(url) {
  return `style="background-image: url('${url}')"`;
}

function setScreen(html) {
  clearTimers();
  root.innerHTML = html;
  bindCommonActions();
  renderHud();
}

function renderHud() {
  const badgeCount = state.earned.filter(Boolean).length;
  const storyCount = state.stories.filter(Boolean).length;
  const stageLabel = document.getElementById("stageLabel");
  const progressBar = document.getElementById("progressBar");
  const badgeCountEl = document.getElementById("badgeCount");
  const storyCountEl = document.getElementById("storyCount");

  if (badgeCountEl) badgeCountEl.textContent = `${badgeCount} / ${levels.length}`;
  if (storyCountEl) storyCountEl.textContent = `${storyCount} / ${levels.length}`;

  let label = "准备启动";
  let pct = badgeCount / levels.length * 100;
  if (state.screen === "level") {
    label = `${levels[state.levelIndex].chip}：${levels[state.levelIndex].title}`;
    pct = state.levelIndex / levels.length * 100;
  }
  if (state.screen === "summary") { label = "通关页：工程勋章合成"; pct = 100; }
  if (state.screen === "poster") { label = "海报页：分享荣誉海报"; pct = 100; }
  if (state.screen === "report") { label = "新闻总结：天山通，万民福"; pct = 100; }

  if (stageLabel) stageLabel.textContent = label;
  if (progressBar) progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function bindCommonActions() {
  root.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      sfx("click");
      const action = el.dataset.action;
      if (action === "intro") showIntro();
      if (action === "start-game") showLevel(0);
      if (action === "restart") restart();
      if (action === "summary") showSummary();
      if (action === "poster") showPoster();
      if (action === "report") showReport();
      if (action === "share") showShare();
    });
  });
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 1700);
}

function ensureAudio() {
  if (!state.sound) return null;
  if (!state.audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    state.audioCtx = new AudioContext();
  }
  if (state.audioCtx.state === "suspended") state.audioCtx.resume();
  return state.audioCtx;
}

function sfx(type = "click") {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  let freq = 520;
  let duration = 0.08;
  let volume = 0.055;
  if (type === "success") { freq = 880; duration = 0.18; volume = 0.075; }
  if (type === "fail") { freq = 160; duration = 0.18; volume = 0.08; }
  if (type === "drill") { freq = 72; duration = 0.12; volume = 0.09; }
  if (type === "wind") { freq = 240; duration = 0.12; volume = 0.05; }
  if (type === "unlock") { freq = 660; duration = 0.28; volume = 0.09; }
  filter.type = type === "drill" ? "lowpass" : "bandpass";
  filter.frequency.value = type === "drill" ? 220 : freq * 1.5;
  osc.type = type === "drill" || type === "fail" ? "sawtooth" : "sine";
  osc.frequency.setValueAtTime(freq, now);
  if (type === "success" || type === "unlock") osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

soundBtn.addEventListener("click", () => {
  state.sound = !state.sound;
  soundBtn.textContent = state.sound ? "音效开" : "音效关";
  if (state.sound) sfx("unlock");
});

document.addEventListener("pointerdown", () => ensureAudio(), { once: true });

function renderSnow(count = 36) {
  return `<div class="snow-field">${Array.from({ length: count }, (_, i) => {
    const left = (i * 37) % 100;
    const duration = 2.6 + (i % 7) * 0.32;
    const delay = -((i % 9) * 0.24);
    const drift = ((i % 2 ? 1 : -1) * (20 + (i % 5) * 9));
    return `<i style="left:${left}%; --drift:${drift}px; animation-duration:${duration}s; animation-delay:${delay}s"></i>`;
  }).join("")}</div><div class="wind-layer"></div>`;
}

function showStart() {
  state.screen = "start";
  setScreen(`
    <section class="screen bg-cover" ${bgStyle(ASSETS.cover)}>
      <div class="overlay strong"></div>
      <div class="card">
        <p class="chip">世界级工程互动新闻</p>
        <h2 class="hero-title">亲手打通天山</h2>
        <p>从雪域勘测、断裂带处置、706 米竖井，到双机掘进和通车联调，用 5 个工程任务理解一条民生通途。</p>
        <div class="fact-grid">
          <div class="fact-card"><strong>22.13 km</strong><span>天山胜利隧道全长</span></div>
          <div class="fact-card"><strong>706 m</strong><span>高速公路通风竖井深度</span></div>
          <div class="fact-card"><strong>16 条</strong><span>复杂地质断裂带</span></div>
          <div class="fact-card"><strong>5 关</strong><span>工程模拟式互动</span></div>
        </div>
        <button class="primary-btn" data-action="intro" type="button">点击成为天山筑路师</button>
      </div>
    </section>
  `);
}

function showIntro() {
  state.screen = "intro";
  setScreen(`
    <section class="screen bg-cover" ${bgStyle(ASSETS.intro)}>
      <div class="overlay"></div>
      ${renderSnow(26)}
      <div class="card">
        <p class="chip">初心页</p>
        <h2>一锤一凿为民生</h2>
        <p>天山阻隔南北疆，工程要穿越高寒山区、复杂断层和超长隧道施工难题。你的任务不是简单答题，而是像工程调度员一样一步步推进。</p>
        <div class="data-panel">
          <div class="data-row"><span>新闻叙事</span><strong>工程攻坚 + 民生改善</strong></div>
          <div class="data-row"><span>交互机制</span><strong>勘测 / 处置 / 钻探 / 掘进 / 联调</strong></div>
          <div class="data-row"><span>最终成果</span><strong>合成通关勋章海报</strong></div>
        </div>
        <button class="primary-btn" data-action="start-game" type="button">开始闯关</button>
      </div>
    </section>
  `);
}

function showLevel(index) {
  state.screen = "level";
  state.levelIndex = index;
  state.levelDone = false;
  const level = levels[index];
  setScreen(`
    <section class="screen level-screen ${level.className}">
      <div id="levelVisual" class="level-visual bg-cover" ${bgStyle(level.bg)}>
        <div class="overlay"></div>
        ${index === 0 ? renderSnow(38) : ""}
        ${index === 1 ? "<div class='danger-light'></div>" : ""}
        <img class="level-scene-img" src="${level.scene}" alt="${level.title}场景图" />
        <div class="level-head">
          <p class="chip">${level.chip}</p>
          <h2>${level.title}</h2>
          <p class="level-desc">${level.desc}</p>
        </div>
      </div>
      <div class="level-body">
        <div class="mission-card">
          <div class="mission-meta">
            <span id="missionLabel">工程任务</span>
            <strong id="missionStatus">待执行</strong>
          </div>
          <p id="missionHint">根据提示完成本关工程操作。</p>
        </div>
        <div id="interactionZone" class="interaction-zone"></div>
      </div>
    </section>
  `);
  renderHud();
  const zone = document.getElementById("interactionZone");
  [renderLevel1, renderLevel2, renderLevel3, renderLevel4, renderLevel5][index](zone, () => completeLevel(index));
}

function updateMission(status, hint) {
  const statusEl = document.getElementById("missionStatus");
  const hintEl = document.getElementById("missionHint");
  if (statusEl) statusEl.textContent = status;
  if (hintEl) hintEl.textContent = hint;
}

function completeLevel(index) {
  if (state.levelDone) return;
  state.levelDone = true;
  state.earned[index] = true;
  state.stories[index] = true;
  renderHud();
  sfx("unlock");
  const level = levels[index];
  const nextText = index === levels.length - 1 ? "进入通关页" : "进入下一关";
  const modal = document.createElement("div");
  modal.className = "complete-modal";
  modal.innerHTML = `
    <div class="complete-card">
      <img src="${level.badge}" alt="${level.badgeName}勋章" />
      <h3>获得勋章：${level.badgeName}</h3>
      <p>${level.story}</p>
      <button class="primary-btn" type="button">${nextText}</button>
    </div>
  `;
  root.appendChild(modal);
  modal.querySelector("button").addEventListener("click", () => {
    sfx("click");
    if (index === levels.length - 1) showSummary();
    else showLevel(index + 1);
  });
}

function renderLevel1(zone, onDone) {
  let storm = 0;
  let unlocked = false;
  zone.innerHTML = `
    <div class="meter-card">
      <strong>风雪复核 <span id="stormText">0</span> / 3</strong>
      <div class="meter-track"><div id="stormFill" class="meter-fill"></div></div>
    </div>
    <div class="probe-map" aria-label="地形取芯点">
      <button class="node-btn probe-node" data-good="0" type="button">冰川左翼</button>
      <button class="node-btn probe-node" data-good="0" type="button">峡谷中段</button>
      <button class="node-btn probe-node" data-good="1" type="button">岩芯高亮区</button>
    </div>
    <button id="stormBtn" class="primary-btn" type="button">顶风雪推进</button>
  `;
  const stormFill = document.getElementById("stormFill");
  const stormText = document.getElementById("stormText");
  document.getElementById("stormBtn").addEventListener("click", () => {
    if (storm >= 3) { toast("风雪视野已经打开，请选择岩芯点。"); return; }
    storm += 1;
    sfx("wind");
    stormText.textContent = storm;
    stormFill.style.width = `${storm / 3 * 100}%`;
    updateMission(`风雪复核 ${storm} / 3`, storm >= 3 ? "选择稳定岩芯取样点。" : "继续推进，降低风雪干扰。");
    if (storm >= 3) unlocked = true;
  });
  zone.querySelectorAll(".probe-node").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!unlocked) { toast("先完成 3 次风雪复核。"); return; }
      const good = btn.dataset.good === "1";
      btn.classList.add(good ? "good" : "bad");
      setTimeout(() => btn.classList.remove("bad"), 380);
      if (!good) { sfx("fail"); toast("该点位岩层不稳，重新判断。"); return; }
      updateMission("岩芯定位完成", "已找到稳定取样点，勘测数据可进入下一阶段。");
      sfx("success");
      onDone();
    });
  });
}

function renderLevel2(zone, onDone) {
  const hazards = [
    { name: "岩爆", tool: "超前支护", note: "高地应力段优先稳固围岩。" },
    { name: "突水", tool: "排水泄压", note: "高地下水压力段先导排水。" },
    { name: "塌方", tool: "注浆加固", note: "破碎围岩段需要封堵加固。" },
  ];
  let solved = 0;
  let current = null;
  let running = false;
  zone.innerHTML = `
    <div class="meter-card">
      <strong>断裂带安全处置 <span id="hazardText">0</span> / 5</strong>
      <div class="meter-track"><div id="hazardFill" class="meter-fill"></div></div>
    </div>
    <div class="log-card" id="hazardLog">点击“启动风险扫描”，系统将随机出现断裂带风险。</div>
    <div class="tool-grid">
      <button class="tool-btn" data-tool="超前支护" type="button">超前支护</button>
      <button class="tool-btn" data-tool="排水泄压" type="button">排水泄压</button>
      <button class="tool-btn" data-tool="注浆加固" type="button">注浆加固</button>
    </div>
    <button id="scanBtn" class="primary-btn" type="button">启动风险扫描</button>
  `;
  const visual = document.getElementById("levelVisual");
  const fill = document.getElementById("hazardFill");
  const text = document.getElementById("hazardText");
  const log = document.getElementById("hazardLog");

  function nextHazard() {
    current = hazards[Math.floor(Math.random() * hazards.length)];
    log.textContent = `警报：${current.name}风险！请选择正确处置：${current.note}`;
    visual.classList.add("quake-now");
    setTimeout(() => visual.classList.remove("quake-now"), 760);
    sfx("fail");
  }

  document.getElementById("scanBtn").addEventListener("click", () => {
    running = true;
    nextHazard();
    updateMission(`已处置 ${solved} / 5`, "按风险类型选择工程处置方案。");
  });

  zone.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!running || !current) { toast("先启动风险扫描。"); return; }
      const correct = btn.dataset.tool === current.tool;
      btn.classList.add(correct ? "good" : "bad");
      setTimeout(() => btn.classList.remove("good", "bad"), 420);
      if (!correct) {
        sfx("fail");
        visual.classList.add("quake-now");
        setTimeout(() => visual.classList.remove("quake-now"), 760);
        log.textContent = `处置不匹配，${current.name}风险扩大，请重新选择。`;
        return;
      }
      solved += 1;
      sfx("success");
      text.textContent = solved;
      fill.style.width = `${solved / 5 * 100}%`;
      updateMission(`已处置 ${solved} / 5`, solved >= 5 ? "F6 断裂带处置完成。" : "继续扫描下一处风险。");
      if (solved >= 5) { log.textContent = "断裂带风险已连续化解，TBM 可以安全通过。"; onDone(); return; }
      nextHazard();
    });
  });
}

function renderLevel3(zone, onDone) {
  let depth = 0;
  const target = 706;
  const required = ["锁定井位", "主竖井", "进风管", "排风管"];
  const selected = [];
  let drillingTimer = null;
  zone.innerHTML = `
    <div class="shaft-board">
      <div id="shaftWell" class="shaft-well">
        <div id="drillBit" class="drill-bit"></div>
        <div class="depth-scale"><span>0m</span><span>353m</span><span>706m</span></div>
      </div>
      <div class="module-card">
        <strong>竖井深度：<span id="depthText">0</span> m / 706 m</strong>
        <div class="meter-track"><div id="depthFill" class="meter-fill"></div></div>
        <p>长按下方按钮连续钻探；松开暂停。达到 706 米后，按工程顺序拼接通风系统。</p>
        <div id="airflow" class="airflow-line"></div>
      </div>
    </div>
    <button id="drillHold" class="drill-hold" type="button">长按钻探</button>
    <div class="module-grid">
      ${["锁定井位", "进风管", "主竖井", "排风管"].map((name) => `<button class="module-btn" data-module="${name}" type="button">${name}</button>`).join("")}
    </div>
  `;
  const well = document.getElementById("shaftWell");
  const bit = document.getElementById("drillBit");
  const depthText = document.getElementById("depthText");
  const fill = document.getElementById("depthFill");
  const airflow = document.getElementById("airflow");

  function setDepth(value) {
    depth = Math.min(target, value);
    const pct = depth / target;
    depthText.textContent = Math.round(depth);
    fill.style.width = `${pct * 100}%`;
    bit.style.top = `${16 + pct * 142}px`;
    updateMission(`${Math.round(depth)} m / 706 m`, depth >= target ? "深度达标，开始拼接通风系统。" : "长按按钮继续钻探。");
    if (depth >= target) {
      stopDrilling();
      toast("深度达标：开始安装通风系统。");
    }
  }

  function startDrilling() {
    if (depth >= target) { toast("深度已达标，请拼接通风系统。"); return; }
    well.classList.add("drill-active");
    sfx("drill");
    if (drillingTimer) clearInterval(drillingTimer);
    drillingTimer = setInterval(() => {
      setDepth(depth + 8);
      if (Math.round(depth) % 80 < 8) sfx("drill");
    }, 55);
    state.timers.push(drillingTimer);
  }
  function stopDrilling() {
    well.classList.remove("drill-active");
    if (drillingTimer) clearInterval(drillingTimer);
    drillingTimer = null;
  }

  const hold = document.getElementById("drillHold");
  hold.addEventListener("pointerdown", startDrilling);
  hold.addEventListener("pointerup", stopDrilling);
  hold.addEventListener("pointerleave", stopDrilling);
  hold.addEventListener("pointercancel", stopDrilling);

  zone.querySelectorAll(".module-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (depth < target) { toast("先钻探到 706 米。"); return; }
      const expected = required[selected.length];
      const value = btn.dataset.module;
      if (value !== expected) {
        btn.classList.add("bad");
        setTimeout(() => btn.classList.remove("bad"), 420);
        sfx("fail");
        toast(`工程顺序错误：下一步应为“${expected}”。`);
        return;
      }
      selected.push(value);
      btn.classList.add("good");
      sfx("success");
      updateMission(`通风系统 ${selected.length} / ${required.length}`, selected.length >= required.length ? "风路贯通，竖井系统完成。" : `下一步：${required[selected.length]}`);
      if (selected.length >= required.length) {
        airflow.classList.add("active");
        onDone();
      }
    });
  });
}

function renderLevel4(zone, onDone) {
  const segments = [
    { rock: "软岩", method: "盾构支护" },
    { rock: "硬岩", method: "刀盘掘进" },
    { rock: "破碎岩", method: "注浆稳固" },
    { rock: "硬岩", method: "刀盘掘进" },
    { rock: "软岩", method: "盾构支护" },
  ];
  let current = 0;
  let leftReady = false;
  let rightReady = false;
  let selectedMethod = null;
  zone.innerHTML = `
    <div class="tbm-arena" id="tbmArena">
      <div id="leftCutter" class="tbm-cutter tbm-left"></div>
      <div id="rightCutter" class="tbm-cutter tbm-right"></div>
      <div id="meetFlash" class="meet-flash"></div>
    </div>
    <div class="meter-card">
      <strong>会师进度 <span id="segmentText">0</span> / ${segments.length}</strong>
      <div class="meter-track"><div id="syncFill" class="meter-fill"></div></div>
    </div>
    <div class="log-card" id="syncLog">当前岩层：${segments[0].rock}。选择工法后，分别推进两台 TBM。</div>
    <div class="tool-grid">
      <button class="tool-btn" data-method="盾构支护" type="button">盾构支护</button>
      <button class="tool-btn" data-method="刀盘掘进" type="button">刀盘掘进</button>
      <button class="tool-btn" data-method="注浆稳固" type="button">注浆稳固</button>
    </div>
    <div class="sync-grid">
      <button class="tbm-btn" data-side="left" type="button">天山号推进</button>
      <button class="tbm-btn" data-side="right" type="button">胜利号推进</button>
    </div>
  `;
  const arena = document.getElementById("tbmArena");
  const leftCutter = document.getElementById("leftCutter");
  const rightCutter = document.getElementById("rightCutter");
  const fill = document.getElementById("syncFill");
  const log = document.getElementById("syncLog");
  const segText = document.getElementById("segmentText");
  const meetFlash = document.getElementById("meetFlash");

  function refreshArena() {
    const pct = current / segments.length * 42;
    arena.style.setProperty("--left", pct);
    arena.style.setProperty("--right", pct);
    segText.textContent = current;
    fill.style.width = `${current / segments.length * 100}%`;
  }

  function resetSegment() {
    leftReady = false;
    rightReady = false;
    selectedMethod = null;
    leftCutter.classList.remove("cutter-on");
    rightCutter.classList.remove("cutter-on");
    zone.querySelectorAll(".tool-btn,.tbm-btn").forEach((btn) => btn.classList.remove("good", "bad"));
    if (current < segments.length) log.textContent = `当前岩层：${segments[current].rock}。选择工法后，分别推进两台 TBM。`;
  }

  zone.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMethod = btn.dataset.method;
      zone.querySelectorAll(".tool-btn").forEach((item) => item.classList.remove("good"));
      btn.classList.add("good");
      sfx("click");
      log.textContent = `已选择工法：${selectedMethod}。请推进天山号与胜利号。`;
    });
  });

  zone.querySelectorAll(".tbm-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!selectedMethod) { toast("先选择当前岩层对应的工法。"); return; }
      const expected = segments[current].method;
      if (selectedMethod !== expected) {
        btn.classList.add("bad");
        setTimeout(() => btn.classList.remove("bad"), 420);
        sfx("fail");
        log.textContent = `工法不匹配：${segments[current].rock}段应使用“${expected}”。`;
        return;
      }
      const side = btn.dataset.side;
      if (side === "left") { leftReady = true; leftCutter.classList.add("cutter-on"); }
      if (side === "right") { rightReady = true; rightCutter.classList.add("cutter-on"); }
      btn.classList.add("good");
      sfx("drill");
      if (leftReady && rightReady) {
        current += 1;
        refreshArena();
        updateMission(`双机同步 ${current} / ${segments.length}`, current >= segments.length ? "会师完成。" : `下一段：${segments[current].rock}`);
        if (current >= segments.length) {
          meetFlash.classList.add("active");
          log.textContent = "双机顺利会师，长隧短打方案完成。";
          sfx("success");
          onDone();
          return;
        }
        setTimeout(resetSegment, 550);
      }
    });
  });

  refreshArena();
}

function renderLevel5(zone, onDone) {
  const checks = ["路面验收", "照明联调", "通风联调", "应急演练", "通车放行"];
  let done = 0;
  zone.innerHTML = `
    <div class="opening-board" id="openingBoard">
      <div id="routeBeam" class="route-beam"></div>
      <div id="trafficDot" class="traffic-dot"></div>
      <div id="confetti" class="confetti"></div>
    </div>
    <div class="meter-card">
      <strong>通车联调 <span id="openText">0</span> / 5</strong>
      <div class="meter-track"><div id="openFill" class="meter-fill"></div></div>
    </div>
    <div class="checklist" id="checklist">
      ${checks.map((name, i) => `<button class="check-item" data-index="${i}" type="button"><span>${name}</span><strong>待完成</strong></button>`).join("")}
    </div>
  `;
  const beam = document.getElementById("routeBeam");
  const dot = document.getElementById("trafficDot");
  const confetti = document.getElementById("confetti");
  const text = document.getElementById("openText");
  const fill = document.getElementById("openFill");

  function burstConfetti() {
    confetti.innerHTML = Array.from({ length: 28 }, (_, i) => {
      const left = (i * 13) % 100;
      const delay = (i % 6) * 0.04;
      const rotate = (i * 31) % 180;
      return `<i style="left:${left}%; animation-delay:${delay}s; transform:rotate(${rotate}deg)"></i>`;
    }).join("");
    setTimeout(() => { confetti.innerHTML = ""; }, 2100);
  }

  zone.querySelectorAll(".check-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      if (index !== done) {
        btn.classList.add("bad");
        setTimeout(() => btn.classList.remove("bad"), 380);
        sfx("fail");
        toast(`联调顺序错误：下一步应为“${checks[done]}”。`);
        return;
      }
      btn.classList.add("done", "good");
      btn.querySelector("strong").textContent = "已完成";
      done += 1;
      const pct = done / checks.length;
      text.textContent = done;
      fill.style.width = `${pct * 100}%`;
      beam.style.width = `${pct * 70}%`;
      dot.style.left = `${16 + pct * 62}%`;
      dot.style.top = `${66 - pct * 40}%`;
      updateMission(`通车联调 ${done} / 5`, done >= checks.length ? "南北疆通途点亮。" : `下一项：${checks[done]}`);
      sfx(done >= checks.length ? "unlock" : "success");
      burstConfetti();
      if (done >= checks.length) {
        setTimeout(onDone, 520);
      }
    });
  });
}

function earnedLevels() {
  return levels.filter((_, index) => state.earned[index]);
}

function badgeHtml(compact = false) {
  const list = earnedLevels();
  return list.map((level) => `
    <div class="${compact ? "poster-badge" : "badge-item"}">
      <img src="${level.badge}" alt="${level.badgeName}勋章" />
      ${compact ? `<span>${level.badgeName}</span>` : `<strong>${level.badgeName}</strong><span>${level.title}</span>`}
    </div>
  `).join("");
}

function showSummary() {
  state.screen = "summary";
  setScreen(`
    <section class="screen bg-cover" ${bgStyle(ASSETS.summary)}>
      <div class="overlay strong"></div>
      <div class="card">
        <p class="chip">通关页</p>
        <h2>天山民生筑梦者</h2>
        <p>你已完成 5 项工程任务，获得真实勋章图片。下面的勋章墙和海报预览均使用 assets/img/ 中的素材。</p>
        <div class="badge-wall">${badgeHtml(false)}</div>
        <label class="name-field">
          <span>海报署名</span>
          <input id="playerName" type="text" maxlength="10" value="${escapeHtml(state.playerName)}" placeholder="输入你的名字" />
        </label>
        <div class="poster-card">
          <div class="poster-top"><span>我为人民修通天山隧道</span><strong id="posterNamePreview">${escapeHtml(state.playerName)}</strong></div>
          <div class="poster-grid">${badgeHtml(true)}</div>
          <p class="poster-copy">22.13 公里、16 条断裂带、706 米竖井，连接求学路、急救路、致富路和团结路。</p>
        </div>
        <div class="action-row two">
          <button class="secondary-btn" data-action="report" type="button">查看新闻总结</button>
          <button class="primary-btn" data-action="poster" type="button">生成分享海报</button>
        </div>
      </div>
    </section>
  `);
  const input = document.getElementById("playerName");
  const preview = document.getElementById("posterNamePreview");
  input.addEventListener("input", () => {
    state.playerName = input.value.trim() || "天山筑路师";
    preview.textContent = state.playerName;
  });
}

function showPoster() {
  state.screen = "poster";
  setScreen(`
    <section class="screen bg-cover" ${bgStyle("assets/img/scene_opening_celebration.png")}>
      <div class="overlay strong"></div>
      <div class="card">
        <p class="chip">海报页</p>
        <h2>我的天山筑路勋章</h2>
        <div class="poster-card big" id="posterCard">
          <div>
            <div class="poster-top"><span>凿通天山 · 筑福万民</span><strong>${escapeHtml(state.playerName)}</strong></div>
            <div class="poster-grid">${badgeHtml(true)}</div>
            <p class="poster-copy">我完成了雪域勘测、断裂带攻坚、云端竖井、双机掘进和通车联调，见证天山胜利隧道背后的工程智慧与民生价值。</p>
          </div>
          <div class="poster-stamp">互动游戏新闻 H5｜世界级工程 · 民生通途</div>
        </div>
        <div class="action-row two">
          <button class="secondary-btn" data-action="summary" type="button">返回通关页</button>
          <button class="primary-btn" data-action="report" type="button">查看新闻总结</button>
        </div>
      </div>
    </section>
  `);
}

function showReport() {
  state.screen = "report";
  setScreen(`
    <section class="screen bg-cover" ${bgStyle(ASSETS.report)}>
      <div class="overlay"></div>
      <div class="card">
        <p class="chip">新闻总结</p>
        <h2>天山通，万民福</h2>
        <p>天山胜利隧道是一项典型的“超级工程 + 民生新闻”选题。游戏把新闻事实拆解为工程动作：先勘测路线，再处置断裂带风险，随后用 706 米竖井解决超长隧道通风，最后通过双机掘进和通车联调完成叙事闭环。</p>
        <div class="story-wall">
          ${levels.map((level, i) => `<div class="story-chip"><strong>${level.title}</strong>${state.stories[i] ? level.story : "未解锁"}</div>`).join("")}
        </div>
        <p class="source-note">注：本页面为课程作业型互动新闻作品，数据和表述可继续按老师要求替换为新华社、央视节目、新疆交通运输部门等公开报道口径。</p>
        <div class="action-row two">
          <button class="secondary-btn" data-action="summary" type="button">返回通关页</button>
          <button class="primary-btn" data-action="share" type="button">查看分享页</button>
        </div>
      </div>
    </section>
  `);
}

function showShare() {
  state.screen = "share";
  setScreen(`
    <section class="screen bg-cover" ${bgStyle(ASSETS.intro)}>
      <div class="overlay strong"></div>
      ${renderSnow(20)}
      <div class="card">
        <p class="chip">分享引流页</p>
        <h2>一起见证天山奇迹</h2>
        <p>这版代码是纯前端 H5 + Python 本地服务器，可以直接部署到静态网站、公众号 H5 页面或课程展示电脑中。</p>
        <div class="share-list">
          <div class="share-item"><strong>素材路径</strong><span>全部图片已统一命名到 assets/img/，不再依赖中文文件名。</span></div>
          <div class="share-item"><strong>传播文案</strong><span>22.13 公里隧道，5 关工程模拟，亲手打通一条民生通途。</span></div>
          <div class="share-item"><strong>课堂展示</strong><span>运行 python main.py 后，用浏览器打开即可演示。</span></div>
        </div>
        <div class="action-row two">
          <button class="secondary-btn" data-action="report" type="button">返回总结</button>
          <button class="primary-btn" data-action="restart" type="button">重新体验</button>
        </div>
      </div>
    </section>
  `);
}

function restart() {
  state.levelIndex = 0;
  state.earned = Array(levels.length).fill(false);
  state.stories = Array(levels.length).fill(false);
  state.levelDone = false;
  showStart();
}

showStart();
