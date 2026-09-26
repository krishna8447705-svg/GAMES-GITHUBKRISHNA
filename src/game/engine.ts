import * as THREE from "three";
import type { GameHud, LocalSnapshot, RemoteSnapshot, TouchActions } from "./types";

const BEST_KEY = "fast-nd-praise-best";
const ROAD_HALF = 8.8;
const LANE = [-5.4, 0, 5.4];
const PATH_DS = 7;
const PATH_N = 1400;
const SEGMENTS = 32;
const FIXED_DT = 1 / 60;
const PLAYER_COLOR = 0xc45c2d;
const TRAFFIC_COLORS = [0x2f6fed, 0xe11d48, 0x3d8b5a, 0xc9a227, 0x5b6470];

type Sample = {
  s: number;
  x: number;
  z: number;
  yaw: number;
  fx: number;
  fz: number;
  rx: number;
  rz: number;
};

function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(n: number) {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* ignore */
  }
}

function buildPath(): Sample[] {
  const samples: Sample[] = [];
  let x = 0;
  let z = 0;
  let yaw = 0;
  let s = 0;
  for (let i = 0; i < PATH_N; i++) {
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    samples.push({ s, x, z, yaw, fx, fz, rx, rz });
    const curve = 0.13 * Math.sin(s * 0.018 + 0.55) + 0.08 * Math.sin(s * 0.033 + 1.6) + 0.045 * Math.sin(s * 0.052 + 0.2);
    yaw += curve;
    x += fx * PATH_DS;
    z += fz * PATH_DS;
    s += PATH_DS;
  }
  return samples;
}

function sampleAt(path: Sample[], s: number): Sample {
  const maxS = (PATH_N - 2) * PATH_DS;
  const clamped = Math.max(0, Math.min(maxS, s));
  const i = Math.min(PATH_N - 2, Math.floor(clamped / PATH_DS));
  const t = (clamped - path[i].s) / PATH_DS;
  const a = path[i];
  const b = path[i + 1];
  const yaw = a.yaw + (b.yaw - a.yaw) * t;
  return {
    s: clamped,
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    yaw,
    fx: -Math.sin(yaw),
    fz: -Math.cos(yaw),
    rx: Math.cos(yaw),
    rz: -Math.sin(yaw),
  };
}

function makeNoiseTexture(size: number, base: string, speck: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < speck; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeBuildingTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#d8cbb8";
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = "#c4b39a";
  g.fillRect(0, 0, 128, 18);
  for (let y = 22; y < 248; y += 16) {
    for (let x = 8; x < 120; x += 18) {
      const lit = Math.random() > 0.25;
      g.fillStyle = lit ? "#8ec8e6" : "#6a7a86";
      g.fillRect(x, y, 10, 10);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildCar(color: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.32 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.4, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x87b8d6,
    metalness: 0.85,
    roughness: 0.1,
    transparent: true,
    opacity: 0.55,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.42, 4.1), bodyMat);
  body.position.y = 0.48;
  body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.42, 1.7), glass);
  cabin.position.set(0, 0.88, -0.15);
  g.add(cabin);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.12, 1.15), bodyMat);
  hood.position.set(0, 0.66, -1.35);
  g.add(hood);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.32), dark);
  spoiler.position.set(0, 0.82, 1.85);
  g.add(spoiler);
  const lightGeo = new THREE.BoxGeometry(0.28, 0.12, 0.08);
  const head = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xfff4d6, emissiveIntensity: 0.35 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0xe11d48, emissiveIntensity: 0.4 });
  const hl = new THREE.Mesh(lightGeo, head);
  hl.position.set(-0.55, 0.5, -2.05);
  const hr = hl.clone();
  hr.position.x = 0.55;
  g.add(hl, hr);
  const tl = new THREE.Mesh(lightGeo, tail);
  tl.position.set(-0.55, 0.5, 2.05);
  const tr = tl.clone();
  tr.position.x = 0.55;
  g.add(tl, tr);
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const p of [
    [-0.92, 0.32, -1.25],
    [0.92, 0.32, -1.25],
    [-0.92, 0.32, 1.3],
    [0.92, 0.32, 1.3],
  ] as [number, number, number][]) {
    const w = new THREE.Mesh(wheelGeo, dark);
    w.position.set(...p);
    w.castShadow = true;
    g.add(w);
  }
  return g;
}

function buildOverpass(stone: THREE.Material, deck: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(4.5, 14, 8), stone);
  left.position.set(-13.2, 7, 0);
  left.castShadow = true;
  const right = left.clone();
  right.position.x = 13.2;
  const span = new THREE.Mesh(new THREE.BoxGeometry(30, 2.4, 10), deck);
  span.position.set(0, 12.4, 0);
  span.castShadow = true;
  const mid = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 9), deck);
  mid.position.set(0, 18, 0);
  mid.castShadow = true;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(30, 1.6, 1.4), stone);
  lip.position.set(0, 13.8, 4.4);
  g.add(left, right, span, mid, lip);
  return g;
}

function createEngineAudio() {
  let ctx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;
  let osc2: OscillatorNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let gain: GainNode | null = null;

  const ensure = () => {
    if (ctx) {
      if (ctx.state === "suspended") void ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    gain = ctx.createGain();
    gain.gain.value = 0;
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.Q.value = 0.9;
    osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 52;
    osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.value = 104;
    const g2 = ctx.createGain();
    g2.gain.value = 0.12;
    osc.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
    osc2.start();
    if (ctx.state === "suspended") void ctx.resume();
  };

  return {
    unlock: ensure,
    update(speed: number, boosting: boolean, live: boolean, throttle: boolean) {
      if (!ctx || !osc || !osc2 || !filter || !gain) return;
      if (ctx.state === "suspended") void ctx.resume();
      const rpm = 50 + speed * 10.5 + (boosting ? 48 : 0);
      const t = ctx.currentTime;
      osc.frequency.setTargetAtTime(rpm, t, 0.06);
      osc2.frequency.setTargetAtTime(rpm * 2.05, t, 0.06);
      filter.frequency.setTargetAtTime(480 + speed * 38 + (boosting ? 700 : 0), t, 0.08);
      const vol = live ? 0.035 + Math.min(0.2, speed * 0.007) + (throttle ? 0.05 : 0) + (boosting ? 0.07 : 0) : 0;
      gain.gain.setTargetAtTime(vol, t, 0.05);
    },
    stop() {
      if (!gain || !ctx) return;
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    },
    dispose() {
      try {
        osc?.stop();
        osc2?.stop();
        void ctx?.close();
      } catch {
        /* ignore */
      }
      ctx = null;
    },
  };
}

type Traffic = {
  mesh: THREE.Group;
  s: number;
  lane: number;
  speed: number;
  x: number;
  z: number;
  alive: boolean;
};
type Pad = { mesh: THREE.Mesh; s: number; lane: number; x: number; z: number; alive: boolean };
type Barrier = { mesh: THREE.Mesh; s: number; lane: number; x: number; z: number; alive: boolean };
type RemoteVis = {
  mesh: THREE.Group;
  label: THREE.Sprite;
  x: number;
  z: number;
  yaw: number;
  tx: number;
  tz: number;
  tyaw: number;
};

export type GameApi = {
  destroy: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  retry: () => void;
  setName: (n: string) => void;
  setTouch: (a: Partial<TouchActions>) => void;
  setRemotes: (list: RemoteSnapshot[]) => void;
  getLocal: () => LocalSnapshot;
  getHud: () => GameHud;
};

export function createGame(canvas: HTMLCanvasElement, onHud: (h: GameHud) => void): GameApi {
  const path = buildPath();
  const audio = createEngineAudio();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x74b7ea);
  scene.fog = new THREE.Fog(0xa9d0ee, 80, 280);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 420);
  camera.position.set(0, 2.1, 7);

  scene.add(new THREE.HemisphereLight(0xfff3d6, 0x6b8a4a, 0.85));
  const sun = new THREE.DirectionalLight(0xfff1c2, 2.15);
  sun.position.set(48, 90, 28);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 180;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  scene.add(sun);

  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(8, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 }),
  );
  sunMesh.position.set(90, 120, -40);
  scene.add(sunMesh);

  const asphalt = makeNoiseTexture(256, "#4a4a50", 700);
  asphalt.repeat.set(2, 6);
  const grassTex = makeNoiseTexture(128, "#4d8a3e", 180);
  grassTex.repeat.set(4, 8);
  const buildingTex = makeBuildingTexture();

  const roadMat = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.9, metalness: 0.04 });
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, metalness: 0 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf4f1e4 });
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xf7f7f2 });
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x34d399,
    emissiveIntensity: 0.55,
    roughness: 0.35,
  });
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.45, metalness: 0.2 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb7a48a, roughness: 0.78, metalness: 0.08 });
  const deckMat = new THREE.MeshStandardMaterial({ map: buildingTex, roughness: 0.65, metalness: 0.12 });
  const buildingMat = new THREE.MeshStandardMaterial({ map: buildingTex, roughness: 0.62, metalness: 0.12 });

  const roadMeshes: THREE.Group[] = [];
  const roadGeo = new THREE.PlaneGeometry(18, PATH_DS + 0.4);
  roadGeo.rotateX(-Math.PI / 2);
  const grassGeo = new THREE.PlaneGeometry(70, PATH_DS + 0.6);
  grassGeo.rotateX(-Math.PI / 2);
  const dashGeo = new THREE.BoxGeometry(0.12, 0.04, 2.2);
  const edgeGeo = new THREE.BoxGeometry(0.2, 0.06, PATH_DS + 0.2);

  for (let i = 0; i < SEGMENTS; i++) {
    const g = new THREE.Group();
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.position.y = -0.04;
    grass.receiveShadow = true;
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.receiveShadow = true;
    const el = new THREE.Mesh(edgeGeo, edgeMat);
    el.position.set(-9, 0.03, 0);
    const er = el.clone();
    er.position.x = 9;
    g.add(grass, road, el, er);
    for (const lx of [-3, 3]) {
      const dash = new THREE.Mesh(dashGeo, lineMat);
      dash.position.set(lx, 0.04, 0);
      g.add(dash);
    }
    scene.add(g);
    roadMeshes.push(g);
  }

  const sideBuildings: THREE.Mesh[] = [];
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(bGeo, buildingMat);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    sideBuildings.push(m);
  }

  const overpasses: THREE.Group[] = [];
  for (let i = 0; i < 8; i++) {
    const o = buildOverpass(stoneMat, deckMat);
    scene.add(o);
    overpasses.push(o);
  }

  const playerMesh = buildCar(PLAYER_COLOR);
  scene.add(playerMesh);

  const traffic: Traffic[] = [];
  for (let i = 0; i < 16; i++) {
    const mesh = buildCar(TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]);
    mesh.visible = false;
    scene.add(mesh);
    traffic.push({ mesh, s: 0, lane: 0, speed: 16, x: 0, z: 0, alive: false });
  }
  const pads: Pad[] = [];
  const padGeo = new THREE.BoxGeometry(1.6, 0.08, 2.2);
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(padGeo, padMat);
    mesh.visible = false;
    scene.add(mesh);
    pads.push({ mesh, s: 0, lane: 0, x: 0, z: 0, alive: false });
  }
  const barriers: Barrier[] = [];
  const barGeo = new THREE.BoxGeometry(1.8, 1.1, 1.2);
  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(barGeo, barrierMat);
    mesh.visible = false;
    mesh.castShadow = true;
    scene.add(mesh);
    barriers.push({ mesh, s: 0, lane: 0, x: 0, z: 0, alive: false });
  }

  const remotes = new Map<string, RemoteVis>();
  const labelCache = new Map<string, THREE.CanvasTexture>();

  function makeLabel(text: string): THREE.Sprite {
    let tex = labelCache.get(text);
    if (!tex) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 64;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "rgba(9,9,11,0.72)";
      ctx.fillRect(8, 8, 240, 48);
      ctx.fillStyle = "#f4f4f5";
      ctx.font = "600 28px Barlow, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text.slice(0, 14), 128, 42);
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      labelCache.set(text, tex);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    s.scale.set(3.2, 0.8, 1);
    return s;
  }

  const keys = new Set<string>();
  let qaKeys: string[] | null = null;
  let qaSteer: number | null = null;
  const touch: TouchActions = { steer: 0, throttle: 0, brake: 0, boost: 0 };
  let lastThrottle = false;

  const player = {
    x: 0,
    z: 0,
    yaw: 0,
    speed: 0,
    lat: 0,
    s: 8,
    nitro: 40,
    score: 0,
    crashed: false,
    paused: false,
    playing: false,
    boosting: false,
    name: "Racer",
    color: PLAYER_COLOR,
  };
  let best = loadBest();
  let spawnT = 0;
  let padT = 2;
  let barT = 6;
  let hudAcc = 0;
  const camPos = new THREE.Vector3(0, 2.2, 8);
  const look = new THREE.Vector3();

  function held(): Set<string> {
    if (qaKeys) return new Set(qaKeys);
    return keys;
  }

  function stageOf(): number {
    return 1 + Math.floor(player.score / 2200);
  }

  function maxSpeed(): number {
    return (32 + stageOf() * 2.2) * (player.boosting ? 1.42 : 1);
  }

  function placeOnPath(s: number, lane: number) {
    const p = sampleAt(path, s);
    return { p, x: p.x + p.rx * lane, z: p.z + p.rz * lane, yaw: p.yaw };
  }

  function resetRun() {
    const start = sampleAt(path, 12);
    player.x = start.x;
    player.z = start.z;
    player.yaw = start.yaw;
    player.speed = 8;
    player.lat = 0;
    player.s = 12;
    player.nitro = 45;
    player.score = 0;
    player.crashed = false;
    player.paused = false;
    player.playing = true;
    player.boosting = false;
    spawnT = 0;
    padT = 1.2;
    barT = 8;
    for (const t of traffic) {
      t.alive = false;
      t.mesh.visible = false;
    }
    for (const p of pads) {
      p.alive = false;
      p.mesh.visible = false;
    }
    for (const b of barriers) {
      b.alive = false;
      b.mesh.visible = false;
    }
    camPos.set(start.x - start.fx * 5.4, 2.1, start.z - start.fz * 5.4);
    audio.unlock();
  }

  function aabb(ax: number, az: number, aw: number, al: number, bx: number, bz: number, bw: number, bl: number) {
    return Math.abs(ax - bx) < (aw + bw) * 0.5 && Math.abs(az - bz) < (al + bl) * 0.5;
  }

  function spawnTraffic() {
    const slot = traffic.find((t) => !t.alive);
    if (!slot) return;
    slot.lane = LANE[Math.floor(Math.random() * LANE.length)];
    slot.s = player.s + 75 + Math.random() * 70;
    slot.speed = 11 + Math.random() * (9 + stageOf() * 3);
    slot.alive = true;
    slot.mesh.visible = true;
  }

  function spawnPad() {
    const slot = pads.find((p) => !p.alive);
    if (!slot) return;
    slot.lane = LANE[Math.floor(Math.random() * LANE.length)];
    slot.s = player.s + 90 + Math.random() * 40;
    slot.alive = true;
    slot.mesh.visible = true;
  }

  function spawnBarrier() {
    if (stageOf() < 2) return;
    const slot = barriers.find((b) => !b.alive);
    if (!slot) return;
    slot.lane = LANE[Math.floor(Math.random() * LANE.length)];
    slot.s = player.s + 100 + Math.random() * 40;
    slot.alive = true;
    slot.mesh.visible = true;
  }

  function hud(): GameHud {
    return {
      score: Math.floor(player.score),
      best,
      speed: Math.max(0, Math.round(player.speed * 9.2)),
      nitro: Math.round(player.nitro),
      stage: stageOf(),
      crashed: player.crashed,
      paused: player.paused,
      playing: player.playing,
      boosting: player.boosting,
    };
  }

  function emitHud() {
    onHud(hud());
  }

  function crash() {
    if (player.crashed) return;
    player.crashed = true;
    player.boosting = false;
    audio.stop();
    if (player.score > best) {
      best = Math.floor(player.score);
      saveBest(best);
    }
    emitHud();
  }

  function layoutWorld() {
    const base = Math.floor(player.s / PATH_DS);
    for (let i = 0; i < SEGMENTS; i++) {
      const sm = sampleAt(path, (base + i) * PATH_DS);
      const g = roadMeshes[i];
      g.position.set(sm.x, 0, sm.z);
      g.rotation.y = sm.yaw;
    }
    for (let i = 0; i < sideBuildings.length; i++) {
      const idx = base + i * 2;
      const sm = sampleAt(path, idx * PATH_DS);
      const side = i % 2 === 0 ? -1 : 1;
      const dist = 14 + (i % 5) * 1.6;
      const h = 10 + (i % 7) * 3.4;
      const w = 6 + (i % 4);
      const d = 7 + (i % 3);
      const m = sideBuildings[i];
      m.position.set(sm.x + sm.rx * side * dist, h / 2, sm.z + sm.rz * side * dist);
      m.scale.set(w, h, d);
      m.rotation.y = sm.yaw;
    }
    for (let i = 0; i < overpasses.length; i++) {
      const idx = Math.floor(base / 14) * 14 + 8 + i * 14;
      const sm = sampleAt(path, idx * PATH_DS);
      const o = overpasses[i];
      o.position.set(sm.x, 0, sm.z);
      o.rotation.y = sm.yaw;
    }
  }

  function step(dt: number) {
    if (!player.playing || player.paused || player.crashed) {
      audio.update(0, false, false, false);
      return;
    }

    const k = held();
    let steer = touch.steer;
    if (qaSteer != null) steer = qaSteer;
    else {
      if (k.has("KeyA") || k.has("ArrowLeft")) steer += 1;
      if (k.has("KeyD") || k.has("ArrowRight")) steer -= 1;
    }
    steer = Math.max(-1, Math.min(1, steer));

    let throttle = touch.throttle;
    if (k.has("KeyW") || k.has("ArrowUp")) throttle = 1;
    let brake = touch.brake;
    if (k.has("KeyS") || k.has("ArrowDown")) brake = 1;
    const wantBoost = touch.boost > 0 || k.has("ShiftLeft") || k.has("ShiftRight") || k.has("KeyE");
    lastThrottle = throttle > 0;

    player.boosting = wantBoost && player.nitro > 1 && player.speed > 4;
    if (player.boosting) player.nitro = Math.max(0, player.nitro - 26 * dt);
    else player.nitro = Math.min(100, player.nitro + 5.5 * dt);

    const road = sampleAt(path, player.s);
    const lat = (player.x - road.x) * road.rx + (player.z - road.z) * road.rz;
    player.lat = lat;
    const off = Math.abs(lat) > ROAD_HALF;

    const cap = maxSpeed();
    if (throttle > 0) player.speed += 18 * throttle * dt;
    if (brake > 0) player.speed -= 28 * brake * dt;
    player.speed -= 3.2 * dt;
    if (off) player.speed -= 11 * dt;
    player.speed = Math.max(0, Math.min(cap, player.speed));

    const speedFactor = Math.min(1, player.speed / 10);
    const high = player.speed / Math.max(1, cap);
    const turnRate = 2.15 * (1 - 0.32 * high);
    const reverse = player.speed >= 0 ? 1 : -1;
    player.yaw += steer * turnRate * speedFactor * reverse * dt;

    const fx = -Math.sin(player.yaw);
    const fz = -Math.cos(player.yaw);
    const rx = Math.cos(player.yaw);
    const rz = -Math.sin(player.yaw);
    player.x += fx * player.speed * dt;
    player.z += fz * player.speed * dt;

    if (Math.abs(lat) > 13) {
      player.x -= road.rx * (lat - Math.sign(lat) * 13) * 0.12;
      player.z -= road.rz * (lat - Math.sign(lat) * 13) * 0.12;
    }

    const along = (player.x - road.x) * road.fx + (player.z - road.z) * road.fz;
    player.s = Math.max(0, Math.min((PATH_N - 8) * PATH_DS, road.s + along));

    player.score += player.speed * dt * (4.8 + stageOf() * 0.6);
    if (player.boosting) player.score += 18 * dt;

    const st = stageOf();
    spawnT += dt;
    if (spawnT >= Math.max(0.42, 1.55 - st * 0.14)) {
      spawnT = 0;
      spawnTraffic();
      if (st >= 3 && Math.random() < 0.35) spawnTraffic();
    }
    padT += dt;
    if (padT >= Math.max(3.2, 6.5 - st * 0.25)) {
      padT = 0;
      spawnPad();
    }
    barT += dt;
    if (st >= 2 && barT >= Math.max(2.8, 7 - st * 0.4)) {
      barT = 0;
      spawnBarrier();
    }

    for (const t of traffic) {
      if (!t.alive) continue;
      t.s += t.speed * dt;
      const placed = placeOnPath(t.s, t.lane);
      t.x = placed.x;
      t.z = placed.z;
      t.mesh.position.set(t.x, 0, t.z);
      t.mesh.rotation.y = placed.yaw;
      if (t.s < player.s - 20 || t.s > player.s + 240) {
        t.alive = false;
        t.mesh.visible = false;
        continue;
      }
      if (aabb(player.x, player.z, 1.6, 3.8, t.x, t.z, 1.7, 4.1)) crash();
    }
    for (const p of pads) {
      if (!p.alive) continue;
      const placed = placeOnPath(p.s, p.lane);
      p.x = placed.x;
      p.z = placed.z;
      p.mesh.position.set(p.x, 0.08 + Math.sin(performance.now() / 240) * 0.04, p.z);
      p.mesh.rotation.y = placed.yaw;
      if (p.s < player.s - 8 || p.s > player.s + 240) {
        p.alive = false;
        p.mesh.visible = false;
        continue;
      }
      if (aabb(player.x, player.z, 1.6, 3.8, p.x, p.z, 1.6, 2.2)) {
        p.alive = false;
        p.mesh.visible = false;
        player.nitro = Math.min(100, player.nitro + 42);
        player.score += 180;
      }
    }
    for (const b of barriers) {
      if (!b.alive) continue;
      const placed = placeOnPath(b.s, b.lane);
      b.x = placed.x;
      b.z = placed.z;
      b.mesh.position.set(b.x, 0.55, b.z);
      b.mesh.rotation.y = placed.yaw;
      if (b.s < player.s - 8 || b.s > player.s + 240) {
        b.alive = false;
        b.mesh.visible = false;
        continue;
      }
      if (aabb(player.x, player.z, 1.6, 3.8, b.x, b.z, 1.8, 1.2)) crash();
    }

    for (const r of remotes.values()) {
      r.x += (r.tx - r.x) * Math.min(1, 12 * dt);
      r.z += (r.tz - r.z) * Math.min(1, 12 * dt);
      r.yaw += (r.tyaw - r.yaw) * Math.min(1, 10 * dt);
      r.mesh.position.set(r.x, 0, r.z);
      r.mesh.rotation.y = r.yaw;
      r.label.position.set(r.x, 2.2, r.z);
      if (aabb(player.x, player.z, 1.6, 3.8, r.x, r.z, 1.6, 3.8)) crash();
    }

    layoutWorld();

    const followDist = 5.4;
    const desiredX = player.x - fx * followDist;
    const desiredY = 1.72 + player.speed * 0.012;
    const desiredZ = player.z - fz * followDist;
    const kCam = 1 - Math.exp(-7.2 * dt);
    camPos.x += (desiredX - camPos.x) * kCam;
    camPos.y += (desiredY - camPos.y) * kCam;
    camPos.z += (desiredZ - camPos.z) * kCam;
    camera.position.copy(camPos);
    look.set(player.x + fx * 6.5, 0.85, player.z + fz * 6.5);
    camera.lookAt(look);
    camera.fov = 58 + Math.min(12, player.speed * 0.22) + (player.boosting ? 6 : 0);
    camera.updateProjectionMatrix();

    playerMesh.position.set(player.x, 0, player.z);
    playerMesh.rotation.y = player.yaw;
    playerMesh.rotation.z = steer * -0.12;

    audio.update(player.speed, player.boosting, true, lastThrottle);
  }

  let acc = 0;
  let last = performance.now();
  let running = true;

  const onKeyDown = (e: KeyboardEvent) => {
    keys.add(e.code);
    audio.unlock();
    if (e.code === "Space") e.preventDefault();
    if (e.code === "KeyP" || e.code === "Escape") {
      if (player.playing && !player.crashed) {
        player.paused = !player.paused;
        emitHud();
      }
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
  const clearKeys = () => keys.clear();
  const onPointer = () => audio.unlock();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearKeys);
  window.addEventListener("pointerdown", onPointer);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearKeys();
    else audio.unlock();
  });

  const onResize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  onResize();
  window.addEventListener("resize", onResize);

  const loop = (now: number) => {
    if (!running) return;
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.1);
    acc += dt;
    while (acc >= FIXED_DT) {
      step(FIXED_DT);
      acc -= FIXED_DT;
    }
    hudAcc += dt;
    if (hudAcc > 0.08) {
      hudAcc = 0;
      emitHud();
    }
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(loop);

  window.__controlsTest = {
    getYaw: () => player.yaw,
    getSpeed: () => player.speed,
    setSteer: (v) => {
      qaSteer = v;
    },
    setKeys: (codes) => {
      qaKeys = codes;
      qaSteer = null;
    },
  };

  return {
    destroy() {
      running = false;
      renderer.setAnimationLoop(null);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", onResize);
      audio.dispose();
      asphalt.dispose();
      grassTex.dispose();
      buildingTex.dispose();
      renderer.dispose();
      if (window.__controlsTest) delete window.__controlsTest;
    },
    start() {
      audio.unlock();
      resetRun();
      emitHud();
    },
    pause() {
      player.paused = true;
      emitHud();
    },
    resume() {
      player.paused = false;
      emitHud();
    },
    retry() {
      resetRun();
      emitHud();
    },
    setName(n) {
      player.name = n;
    },
    setTouch(a) {
      if (a.steer != null) touch.steer = a.steer;
      if (a.throttle != null) touch.throttle = a.throttle;
      if (a.brake != null) touch.brake = a.brake;
      if (a.boost != null) touch.boost = a.boost;
    },
    setRemotes(list) {
      const seen = new Set<string>();
      for (const s of list) {
        seen.add(s.id);
        let r = remotes.get(s.id);
        if (!r) {
          const mesh = buildCar(s.color || TRAFFIC_COLORS[0]);
          const label = makeLabel(s.name || "Racer");
          scene.add(mesh, label);
          r = { mesh, label, x: s.x, z: s.z, yaw: s.yaw, tx: s.x, tz: s.z, tyaw: s.yaw };
          remotes.set(s.id, r);
        }
        r.tx = s.x;
        r.tz = s.z;
        r.tyaw = s.yaw;
        r.mesh.visible = !s.crashed;
      }
      for (const [id, r] of remotes) {
        if (seen.has(id)) continue;
        scene.remove(r.mesh, r.label);
        remotes.delete(id);
      }
    },
    getLocal(): LocalSnapshot {
      return {
        x: player.x,
        z: player.z,
        yaw: player.yaw,
        speed: player.speed,
        nitro: player.nitro,
        crashed: player.crashed,
        score: player.score,
        color: player.color,
        name: player.name,
      };
    },
    getHud: hud,
  };
}
