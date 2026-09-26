import { o as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, i as RotateCcw, n as Users, o as Gauge, t as Zap } from "../_libs/lucide-react.mjs";
import { C as SpriteMaterial, S as Sprite, _ as PointLight, a as CylinderGeometry, b as Scene, c as Group, d as Mesh, f as MeshBasicMaterial, g as PlaneGeometry, h as PerspectiveCamera, i as Color, l as HemisphereLight, m as Object3D, n as BoxGeometry, o as DirectionalLight, p as MeshStandardMaterial, r as CanvasTexture, s as Fog, t as WebGLRenderer, u as InstancedMesh, v as RepeatWrapping, w as Vector3, x as SpotLight, y as SRGBColorSpace } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B3FEpiBN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var BEST_KEY = "fast-nd-praise-best";
var ROAD_HALF = 8.6;
var WALL = 11.2;
var LANE_X = [
	-5.6,
	0,
	5.6
];
var SEGMENT = 42;
var SEGMENTS = 28;
var FIXED_DT = 1 / 60;
var PLAYER_COLOR = 13948893;
var TRAFFIC_COLORS = [
	14753096,
	9741240,
	3462041,
	6583435,
	16007006
];
function loadBest() {
	try {
		return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
	} catch {
		return 0;
	}
}
function saveBest(n) {
	try {
		localStorage.setItem(BEST_KEY, String(n));
	} catch {}
}
function makeNoiseTexture(size, base, speck) {
	const c = document.createElement("canvas");
	c.width = c.height = size;
	const g = c.getContext("2d");
	g.fillStyle = base;
	g.fillRect(0, 0, size, size);
	for (let i = 0; i < speck; i++) {
		g.fillStyle = `rgba(255,255,255,${Math.random() * .07})`;
		g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1);
	}
	const t = new CanvasTexture(c);
	t.wrapS = t.wrapT = RepeatWrapping;
	t.anisotropy = 4;
	t.colorSpace = SRGBColorSpace;
	return t;
}
function makeBuildingTexture() {
	const c = document.createElement("canvas");
	c.width = 128;
	c.height = 256;
	const g = c.getContext("2d");
	g.fillStyle = "#141418";
	g.fillRect(0, 0, 128, 256);
	for (let y = 8; y < 250; y += 14) for (let x = 8; x < 120; x += 16) {
		g.fillStyle = Math.random() > .45 ? `rgba(220,225,235,${.15 + Math.random() * .45})` : "#0c0c10";
		g.fillRect(x, y, 8, 8);
	}
	const t = new CanvasTexture(c);
	t.colorSpace = SRGBColorSpace;
	return t;
}
function buildCar(color) {
	const g = new Group();
	const bodyMat = new MeshStandardMaterial({
		color,
		metalness: .72,
		roughness: .28
	});
	const dark = new MeshStandardMaterial({
		color: 1118484,
		metalness: .4,
		roughness: .5
	});
	const glass = new MeshStandardMaterial({
		color: 10135483,
		metalness: .9,
		roughness: .08,
		transparent: true,
		opacity: .55
	});
	const body = new Mesh(new BoxGeometry(1.7, .42, 4.1), bodyMat);
	body.position.y = .48;
	body.castShadow = true;
	g.add(body);
	const cabin = new Mesh(new BoxGeometry(1.45, .42, 1.7), glass);
	cabin.position.set(0, .88, -.15);
	g.add(cabin);
	const hood = new Mesh(new BoxGeometry(1.62, .12, 1.15), bodyMat);
	hood.position.set(0, .66, -1.35);
	g.add(hood);
	const spoiler = new Mesh(new BoxGeometry(1.5, .08, .32), dark);
	spoiler.position.set(0, .82, 1.85);
	g.add(spoiler);
	const lightGeo = new BoxGeometry(.28, .12, .08);
	const head = new MeshStandardMaterial({
		color: 16317180,
		emissive: 16317180,
		emissiveIntensity: 2.2
	});
	const tail = new MeshStandardMaterial({
		color: 14753096,
		emissive: 14753096,
		emissiveIntensity: 1.6
	});
	const hl = new Mesh(lightGeo, head);
	hl.position.set(-.55, .5, -2.05);
	const hr = hl.clone();
	hr.position.x = .55;
	g.add(hl, hr);
	const tl = new Mesh(lightGeo, tail);
	tl.position.set(-.55, .5, 2.05);
	const tr = tl.clone();
	tr.position.x = .55;
	g.add(tl, tr);
	const wheelGeo = new CylinderGeometry(.32, .32, .28, 12);
	wheelGeo.rotateZ(Math.PI / 2);
	for (const p of [
		[
			-.92,
			.32,
			-1.25
		],
		[
			.92,
			.32,
			-1.25
		],
		[
			-.92,
			.32,
			1.3
		],
		[
			.92,
			.32,
			1.3
		]
	]) {
		const w = new Mesh(wheelGeo, dark);
		w.position.set(...p);
		w.castShadow = true;
		g.add(w);
	}
	g.traverse((o) => {
		const m = o;
		if (m.isMesh) m.receiveShadow = true;
	});
	return g;
}
function createGame(canvas, onHud) {
	const renderer = new WebGLRenderer({
		canvas,
		antialias: true,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
	renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = 1;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.05;
	renderer.outputColorSpace = SRGBColorSpace;
	const scene = new Scene();
	scene.background = new Color(460812);
	scene.fog = new Fog(460812, 40, 220);
	const camera = new PerspectiveCamera(62, 1, .1, 420);
	camera.position.set(0, 2.1, 7);
	const hemi = new HemisphereLight(9347272, 723726, .55);
	scene.add(hemi);
	const moon = new DirectionalLight(13226724, 1.05);
	moon.position.set(30, 60, 20);
	moon.castShadow = true;
	moon.shadow.mapSize.set(1024, 1024);
	moon.shadow.camera.near = 10;
	moon.shadow.camera.far = 160;
	moon.shadow.camera.left = -40;
	moon.shadow.camera.right = 40;
	moon.shadow.camera.top = 40;
	moon.shadow.camera.bottom = -40;
	scene.add(moon);
	const asphalt = makeNoiseTexture(256, "#1b1b22", 900);
	asphalt.repeat.set(3, 14);
	const shoulderTex = makeNoiseTexture(128, "#10140f", 200);
	shoulderTex.repeat.set(2, 10);
	const buildingTex = makeBuildingTexture();
	const roadMat = new MeshStandardMaterial({
		map: asphalt,
		roughness: .92,
		metalness: .04
	});
	const shoulderMat = new MeshStandardMaterial({
		map: shoulderTex,
		roughness: 1,
		metalness: 0
	});
	const lineMat = new MeshBasicMaterial({ color: 13948893 });
	const edgeMat = new MeshBasicMaterial({ color: 15263978 });
	const padMat = new MeshStandardMaterial({
		color: 3462041,
		emissive: 3462041,
		emissiveIntensity: 1.4,
		roughness: .3
	});
	const barrierMat = new MeshStandardMaterial({
		color: 14753096,
		roughness: .45,
		metalness: .2
	});
	const world = new Group();
	scene.add(world);
	const roadMeshes = [];
	const roadGeo = new PlaneGeometry(18, SEGMENT);
	roadGeo.rotateX(-Math.PI / 2);
	const shoulderGeo = new PlaneGeometry(28, SEGMENT);
	shoulderGeo.rotateX(-Math.PI / 2);
	const dashGeo = new BoxGeometry(.12, .04, 2.4);
	const edgeGeo = new BoxGeometry(.18, .06, SEGMENT);
	for (let i = 0; i < SEGMENTS; i++) {
		const g = new Group();
		const shoulder = new Mesh(shoulderGeo, shoulderMat);
		shoulder.position.y = -.02;
		shoulder.receiveShadow = true;
		g.add(shoulder);
		const road = new Mesh(roadGeo, roadMat);
		road.receiveShadow = true;
		g.add(road);
		const el = new Mesh(edgeGeo, edgeMat);
		el.position.set(-9, .03, 0);
		const er = el.clone();
		er.position.x = 9;
		g.add(el, er);
		for (const lx of [-3, 3]) for (let d = -19; d < SEGMENT / 2; d += 6) {
			const dash = new Mesh(dashGeo, lineMat);
			dash.position.set(lx, .04, d);
			g.add(dash);
		}
		g.position.z = -i * SEGMENT;
		world.add(g);
		roadMeshes.push(g);
	}
	const buildingGeo = new BoxGeometry(1, 1, 1);
	const buildingMat = new MeshStandardMaterial({
		map: buildingTex,
		roughness: .7,
		metalness: .15
	});
	const buildings = new InstancedMesh(buildingGeo, buildingMat, 120);
	buildings.castShadow = true;
	buildings.receiveShadow = true;
	const dummy = new Object3D();
	let bi = 0;
	for (let i = 0; i < 60; i++) for (const side of [-1, 1]) {
		const h = 8 + Math.random() * 28;
		const w = 6 + Math.random() * 8;
		const d = 8 + Math.random() * 10;
		dummy.position.set(side * (18 + Math.random() * 22), h / 2, -i * 18 + (Math.random() - .5) * 8);
		dummy.scale.set(w, h, d);
		dummy.updateMatrix();
		buildings.setMatrixAt(bi++, dummy.matrix);
	}
	buildings.count = bi;
	scene.add(buildings);
	const lampGeo = new CylinderGeometry(.08, .1, 7, 6);
	const lampMat = new MeshStandardMaterial({
		color: 2763312,
		metalness: .6,
		roughness: .4
	});
	const lamps = [];
	for (let i = 0; i < 18; i++) {
		const lamp = new Group();
		const pole = new Mesh(lampGeo, lampMat);
		pole.position.y = 3.5;
		lamp.add(pole);
		const light = new PointLight(15265012, 6, 28, 2);
		light.position.set(0, 7.1, 0);
		lamp.add(light);
		lamp.position.set(i % 2 === 0 ? -10.4 : 10.4, 0, -i * 26);
		scene.add(lamp);
		lamps.push(lamp);
	}
	const playerMesh = buildCar(PLAYER_COLOR);
	scene.add(playerMesh);
	const headL = new SpotLight(16317180, 18, 55, .42, .35, 1.2);
	headL.position.set(-.5, .6, -2.1);
	headL.target.position.set(-.5, .2, -18);
	playerMesh.add(headL);
	playerMesh.add(headL.target);
	const headR = headL.clone();
	headR.position.x = .5;
	headR.target.position.x = .5;
	playerMesh.add(headR);
	playerMesh.add(headR.target);
	const traffic = [];
	for (let i = 0; i < 18; i++) {
		const mesh = buildCar(TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]);
		mesh.visible = false;
		scene.add(mesh);
		traffic.push({
			mesh,
			x: 0,
			z: 0,
			speed: 16,
			w: 1.7,
			l: 4.1,
			alive: false
		});
	}
	const pads = [];
	const padGeo = new BoxGeometry(1.6, .08, 2.2);
	for (let i = 0; i < 8; i++) {
		const mesh = new Mesh(padGeo, padMat);
		mesh.visible = false;
		scene.add(mesh);
		pads.push({
			mesh,
			x: 0,
			z: 0,
			alive: false
		});
	}
	const barriers = [];
	const barGeo = new BoxGeometry(1.8, 1.1, 1.2);
	for (let i = 0; i < 8; i++) {
		const mesh = new Mesh(barGeo, barrierMat);
		mesh.visible = false;
		mesh.castShadow = true;
		scene.add(mesh);
		barriers.push({
			mesh,
			x: 0,
			z: 0,
			alive: false
		});
	}
	const remotes = /* @__PURE__ */ new Map();
	const labelCache = /* @__PURE__ */ new Map();
	function makeLabel(text) {
		let tex = labelCache.get(text);
		if (!tex) {
			const c = document.createElement("canvas");
			c.width = 256;
			c.height = 64;
			const ctx = c.getContext("2d");
			ctx.fillStyle = "rgba(9,9,11,0.72)";
			ctx.roundRect(8, 8, 240, 48, 8);
			ctx.fill();
			ctx.fillStyle = "#f4f4f5";
			ctx.font = "600 28px Barlow, sans-serif";
			ctx.textAlign = "center";
			ctx.fillText(text.slice(0, 14), 128, 42);
			tex = new CanvasTexture(c);
			tex.colorSpace = SRGBColorSpace;
			labelCache.set(text, tex);
		}
		const mat = new SpriteMaterial({
			map: tex,
			transparent: true,
			depthTest: false
		});
		const s = new Sprite(mat);
		s.scale.set(3.2, .8, 1);
		return s;
	}
	const keys = /* @__PURE__ */ new Set();
	let qaKeys = null;
	let qaSteer = null;
	const touch = {
		steer: 0,
		throttle: 0,
		brake: 0,
		boost: 0
	};
	const player = {
		x: 0,
		y: 0,
		z: 0,
		yaw: 0,
		speed: 0,
		lat: 0,
		nitro: 40,
		score: 0,
		crashed: false,
		paused: false,
		playing: false,
		boosting: false,
		name: "Racer",
		color: PLAYER_COLOR
	};
	let best = loadBest();
	let spawnT = 0;
	let padT = 2;
	let barT = 6;
	let hudAcc = 0;
	const camPos = new Vector3(0, 2.2, 8);
	const look = new Vector3();
	const tmpF = new Vector3();
	const tmpR = new Vector3();
	function held() {
		if (qaKeys) return new Set(qaKeys);
		return keys;
	}
	function stageOf() {
		return 1 + Math.floor(player.score / 2200);
	}
	function maxSpeed() {
		const boost = player.boosting ? 1.42 : 1;
		return (34 + stageOf() * 2.4) * boost;
	}
	function resetRun() {
		player.x = 0;
		player.z = 0;
		player.yaw = 0;
		player.speed = 8;
		player.lat = 0;
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
		camPos.set(0, 2.1, 6.4);
	}
	function aabb(ax, az, aw, al, bx, bz, bw, bl) {
		return Math.abs(ax - bx) < (aw + bw) * .5 && Math.abs(az - bz) < (al + bl) * .5;
	}
	function spawnTraffic() {
		const slot = traffic.find((t) => !t.alive);
		if (!slot) return;
		slot.x = LANE_X[Math.floor(Math.random() * LANE_X.length)] + (Math.random() - .5) * .4;
		slot.z = player.z - (70 + Math.random() * 90);
		slot.speed = 12 + Math.random() * (10 + stageOf() * 3);
		slot.alive = true;
		slot.mesh.visible = true;
		slot.mesh.position.set(slot.x, 0, slot.z);
	}
	function spawnPad() {
		const slot = pads.find((p) => !p.alive);
		if (!slot) return;
		slot.x = LANE_X[Math.floor(Math.random() * LANE_X.length)];
		slot.z = player.z - (90 + Math.random() * 50);
		slot.alive = true;
		slot.mesh.visible = true;
		slot.mesh.position.set(slot.x, .06, slot.z);
	}
	function spawnBarrier() {
		if (stageOf() < 2) return;
		const slot = barriers.find((b) => !b.alive);
		if (!slot) return;
		slot.x = LANE_X[Math.floor(Math.random() * LANE_X.length)];
		slot.z = player.z - (110 + Math.random() * 40);
		slot.alive = true;
		slot.mesh.visible = true;
		slot.mesh.position.set(slot.x, .55, slot.z);
	}
	function hud() {
		return {
			score: Math.floor(player.score),
			best,
			speed: Math.max(0, Math.round(player.speed * 9.2)),
			nitro: Math.round(player.nitro),
			stage: stageOf(),
			crashed: player.crashed,
			paused: player.paused,
			playing: player.playing,
			boosting: player.boosting
		};
	}
	function emitHud() {
		onHud(hud());
	}
	function crash() {
		if (player.crashed) return;
		player.crashed = true;
		player.boosting = false;
		if (player.score > best) {
			best = Math.floor(player.score);
			saveBest(best);
		}
		emitHud();
	}
	function step(dt) {
		if (!player.playing || player.paused || player.crashed) return;
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
		player.boosting = wantBoost && player.nitro > 1 && player.speed > 4;
		if (player.boosting) player.nitro = Math.max(0, player.nitro - 26 * dt);
		else player.nitro = Math.min(100, player.nitro + 5.5 * dt);
		const cap = maxSpeed();
		if (throttle > 0) player.speed += 18 * throttle * dt;
		if (brake > 0) player.speed -= 28 * brake * dt;
		player.speed -= 3.2 * dt;
		if (Math.abs(player.x) > ROAD_HALF) player.speed -= 10 * dt;
		player.speed = Math.max(0, Math.min(cap, player.speed));
		const speedFactor = Math.min(1, player.speed / 10);
		const turnRate = 2.15 * (1 - .32 * (player.speed / cap));
		const reverse = player.speed >= 0 ? 1 : -1;
		player.yaw += steer * turnRate * speedFactor * reverse * dt;
		const fx = -Math.sin(player.yaw);
		const fz = -Math.cos(player.yaw);
		const rx = Math.cos(player.yaw);
		const rz = -Math.sin(player.yaw);
		player.lat += steer * player.speed * .35 * dt;
		player.lat *= Math.exp(-4.2 * dt);
		player.x += (fx * player.speed + rx * player.lat) * dt;
		player.z += (fz * player.speed + rz * player.lat) * dt;
		player.x = Math.max(-11.2, Math.min(WALL, player.x));
		player.score += player.speed * dt * (4.8 + stageOf() * .6);
		if (player.boosting) player.score += 18 * dt;
		const st = stageOf();
		spawnT += dt;
		const spawnEvery = Math.max(.42, 1.55 - st * .14);
		if (spawnT >= spawnEvery) {
			spawnT = 0;
			spawnTraffic();
			if (st >= 3 && Math.random() < .35) spawnTraffic();
		}
		padT += dt;
		if (padT >= Math.max(3.2, 6.5 - st * .25)) {
			padT = 0;
			spawnPad();
		}
		barT += dt;
		if (st >= 2 && barT >= Math.max(2.8, 7 - st * .4)) {
			barT = 0;
			spawnBarrier();
		}
		for (const t of traffic) {
			if (!t.alive) continue;
			t.z -= t.speed * dt;
			t.mesh.position.set(t.x, 0, t.z);
			t.mesh.rotation.y = 0;
			if (t.z > player.z + 25 || t.z < player.z - 260) {
				t.alive = false;
				t.mesh.visible = false;
				continue;
			}
			if (aabb(player.x, player.z, 1.6, 3.8, t.x, t.z, t.w, t.l)) crash();
		}
		for (const p of pads) {
			if (!p.alive) continue;
			p.mesh.position.y = .08 + Math.sin(performance.now() / 240) * .04;
			if (p.z > player.z + 12 || p.z < player.z - 260) {
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
			if (b.z > player.z + 12 || b.z < player.z - 260) {
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
		const origin = Math.floor(-player.z / SEGMENT);
		for (let i = 0; i < SEGMENTS; i++) roadMeshes[i].position.z = -(origin + i) * SEGMENT;
		buildings.position.z = player.z;
		for (let i = 0; i < lamps.length; i++) {
			const idx = origin * 2 + i;
			lamps[i].position.z = -idx * 13;
			lamps[i].position.x = i % 2 === 0 ? -10.4 : 10.4;
		}
		tmpF.set(fx, 0, fz);
		tmpR.set(rx, 0, rz);
		const followDist = 5.4;
		const camH = 1.72;
		const desiredX = player.x - fx * followDist;
		const desiredY = camH + player.speed * .012;
		const desiredZ = player.z - fz * followDist;
		const kCam = 1 - Math.exp(-7.2 * dt);
		camPos.x += (desiredX - camPos.x) * kCam;
		camPos.y += (desiredY - camPos.y) * kCam;
		camPos.z += (desiredZ - camPos.z) * kCam;
		camera.position.copy(camPos);
		look.set(player.x + fx * 6.5, .85, player.z + fz * 6.5);
		camera.lookAt(look);
		camera.fov = 58 + Math.min(12, player.speed * .22) + (player.boosting ? 6 : 0);
		camera.updateProjectionMatrix();
		playerMesh.position.set(player.x, 0, player.z);
		playerMesh.rotation.y = player.yaw;
		playerMesh.rotation.z = steer * -.12;
	}
	let acc = 0;
	let last = performance.now();
	let running = true;
	const onKeyDown = (e) => {
		keys.add(e.code);
		if (e.code === "Space") e.preventDefault();
		if (e.code === "KeyP" || e.code === "Escape") {
			if (player.playing && !player.crashed) {
				player.paused = !player.paused;
				emitHud();
			}
		}
	};
	const onKeyUp = (e) => keys.delete(e.code);
	const clearKeys = () => keys.clear();
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
	window.addEventListener("blur", clearKeys);
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) clearKeys();
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
	const loop = (now) => {
		if (!running) return;
		let dt = (now - last) / 1e3;
		last = now;
		dt = Math.min(dt, .1);
		acc += dt;
		while (acc >= FIXED_DT) {
			step(FIXED_DT);
			acc -= FIXED_DT;
		}
		hudAcc += dt;
		if (hudAcc > .08) {
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
		}
	};
	return {
		destroy() {
			running = false;
			renderer.setAnimationLoop(null);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			window.removeEventListener("blur", clearKeys);
			window.removeEventListener("resize", onResize);
			asphalt.dispose();
			shoulderTex.dispose();
			buildingTex.dispose();
			renderer.dispose();
			if (window.__controlsTest) delete window.__controlsTest;
		},
		start() {
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
			const seen = /* @__PURE__ */ new Set();
			for (const s of list) {
				seen.add(s.id);
				let r = remotes.get(s.id);
				if (!r) {
					const mesh = buildCar(s.color || TRAFFIC_COLORS[0]);
					const label = makeLabel(s.name || "Racer");
					scene.add(mesh, label);
					r = {
						mesh,
						label,
						x: s.x,
						z: s.z,
						yaw: s.yaw,
						tx: s.x,
						tz: s.z,
						tyaw: s.yaw
					};
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
		getLocal() {
			return {
				x: player.x,
				z: player.z,
				yaw: player.yaw,
				speed: player.speed,
				nitro: player.nitro,
				crashed: player.crashed,
				score: player.score,
				color: player.color,
				name: player.name
			};
		},
		getHud: hud
	};
}
var emptyHud = {
	score: 0,
	best: 0,
	speed: 0,
	nitro: 0,
	stage: 1,
	crashed: false,
	paused: false,
	playing: false,
	boosting: false
};
function GameShell({ name, room, joinLabel, online, p2p, onExit }) {
	const canvasRef = (0, import_react.useRef)(null);
	const apiRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(emptyHud);
	const [ready, setReady] = (0, import_react.useState)(false);
	const remotesRef = (0, import_react.useRef)({});
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const api = createGame(canvas, setHud);
		api.setName(name);
		apiRef.current = api;
		const t = window.setTimeout(() => {
			api.start();
			setReady(true);
		}, 420);
		return () => {
			window.clearTimeout(t);
			api.destroy();
			apiRef.current = null;
		};
	}, [name]);
	(0, import_react.useEffect)(() => {
		if (!p2p) return;
		return p2p.onMessage((from, data) => {
			const d = data;
			if (!d || typeof d.x !== "number") return;
			remotesRef.current[from] = {
				...d,
				id: from
			};
			apiRef.current?.setRemotes(Object.values(remotesRef.current));
		});
	}, [p2p]);
	(0, import_react.useEffect)(() => {
		if (!p2p) return;
		const alive = new Set(p2p.peers.map((p) => p.id));
		for (const id of Object.keys(remotesRef.current)) if (!alive.has(id)) delete remotesRef.current[id];
		apiRef.current?.setRemotes(Object.values(remotesRef.current));
	}, [p2p, p2p?.peers]);
	(0, import_react.useEffect)(() => {
		if (!p2p) return;
		let raf = 0;
		let last = 0;
		const tick = (now) => {
			if (now - last >= 50) {
				last = now;
				const local = apiRef.current?.getLocal();
				if (local) p2p.broadcast(local);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [p2p]);
	const press = (partial, down) => {
		const next = { ...partial };
		if (!down) for (const k of Object.keys(next)) next[k] = 0;
		apiRef.current?.setTouch(next);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full touch-none"
			}),
			!ready && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl tracking-wide text-fg",
						children: "FAST ND PRAISE"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Installing graphics pack"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 h-1 w-48 overflow-hidden rounded-full bg-elevated",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-2/3 animate-pulse bg-accent" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl bg-surface/80 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs tracking-widest text-muted",
							children: "SCORE"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-3xl tabular-nums leading-none",
							children: hud.score
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-subtle",
							children: ["Best ", hud.best]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-xl bg-surface/80 px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-4 text-muted" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-lg tabular-nums",
								children: hud.speed
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-subtle",
								children: "km/h"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-surface/80 px-3 py-2 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: ["Stage ", hud.stage]
						}), online && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 flex items-center justify-end gap-1 text-xs text-subtle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3" }),
								1 + (p2p?.peers.length ?? 0),
								" · ",
								joinLabel || room
							]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-0 top-28 z-10 flex justify-center px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex items-center justify-between text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-3" }), " Nitro"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono tabular-nums",
							children: hud.nitro
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-2 overflow-hidden rounded-full bg-elevated",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `h-full ${hud.boosting ? "bg-ok" : "bg-accent"}`,
							style: { width: `${hud.nitro}%` }
						})
					})]
				})
			}),
			hud.paused && !hud.crashed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
				title: "Paused",
				body: "Hold W to accelerate. A / D steer. Shift or E for nitro.",
				actions: [{
					label: "Resume",
					onClick: () => apiRef.current?.resume()
				}, {
					label: "Leave",
					onClick: onExit,
					ghost: true
				}]
			}),
			hud.crashed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, {
				title: "Crashed",
				body: `Score ${hud.score} · Best ${hud.best}`,
				actions: [{
					label: "Retry",
					onClick: () => apiRef.current?.retry(),
					icon: true
				}, {
					label: "Menu",
					onClick: onExit,
					ghost: true
				}]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-10 hidden -translate-x-1/2 rounded-full bg-surface/80 p-3 text-fg md:flex",
				onClick: () => hud.paused ? apiRef.current?.resume() : apiRef.current?.pause(),
				"aria-label": "Pause",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
						label: "Left",
						onDown: () => press({ steer: 1 }, true),
						onUp: () => press({ steer: 1 }, false)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
						label: "Right",
						onDown: () => press({ steer: -1 }, true),
						onUp: () => press({ steer: -1 }, false)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "Brake",
							onDown: () => press({ brake: 1 }, true),
							onUp: () => press({ brake: 1 }, false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "Nitro",
							accent: true,
							onDown: () => press({ boost: 1 }, true),
							onUp: () => press({ boost: 1 }, false)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
							label: "Gas",
							primary: true,
							onDown: () => press({ throttle: 1 }, true),
							onUp: () => press({ throttle: 1 }, false)
						})
					]
				})]
			})
		]
	});
}
function Overlay({ title, body, actions }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl bg-surface p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-3xl tracking-wide",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: body
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex flex-col gap-2",
					children: actions.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: a.onClick,
						className: a.ghost ? "h-11 rounded-md border border-border text-sm font-medium text-fg" : "h-11 rounded-md bg-accent text-sm font-medium text-accent-fg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2",
							children: [a.icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }) : null, a.label]
						})
					}, a.label))
				})
			]
		})
	});
}
function TouchBtn({ label, onDown, onUp, primary, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "h-14 min-w-16 rounded-lg px-4 text-sm font-medium select-none " + (primary ? "bg-accent text-accent-fg" : accent ? "bg-ok text-accent-fg" : "bg-surface/90 text-fg"),
		onPointerDown: (e) => {
			e.preventDefault();
			e.target.setPointerCapture(e.pointerId);
			onDown();
		},
		onPointerUp: onUp,
		onPointerCancel: onUp,
		children: label
	});
}
var FAST_POLL_MS = 400;
var IDLE_POLL_MS = 2e3;
var PING_INTERVAL_MS = 2e3;
var STALL_MS = 1e4;
var MAX_RECOVERY_ATTEMPTS = 3;
var SIGNAL_RETRY_DELAYS_MS = [250, 750];
function defaultIceServers() {
	return [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
}
var P2PRoom = class {
	opts;
	peers = /* @__PURE__ */ new Map();
	/** Per-remote-peer signal delivery chains (order-preserving). */
	signalQueues = /* @__PURE__ */ new Map();
	cursor = 0;
	pollTimer = null;
	pingTimer = null;
	closed = false;
	everPolled = false;
	lastPeersFingerprint = "";
	constructor(opts) {
		this.opts = opts;
	}
	/**
	* The first poll IS the join: it registers this peer and returns the
	* roster. A failed first poll (cold DB, offline tab) must not strand the
	* room: the loop and timers start regardless and the next poll retries.
	*/
	async join() {
		try {
			await this.pollOnce();
		} catch {}
		if (this.closed) return;
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
		this.pingTimer = setInterval(() => {
			this.pingAll();
			this.watchdog();
		}, PING_INTERVAL_MS);
	}
	close() {
		this.closed = true;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		if (this.pingTimer) clearInterval(this.pingTimer);
		for (const slot of this.peers.values()) slot.pc.close();
		this.peers.clear();
		fetch("/api/rtc", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op: "leave",
				room: this.opts.room,
				peer: this.opts.selfId
			}),
			keepalive: true
		}).catch(() => {});
	}
	/** Send on the unreliable game-state channel (drops stale packets). */
	broadcast(data) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		for (const slot of this.peers.values()) if (slot.state?.readyState === "open") slot.state.send(wire);
	}
	/** Send reliably (ordered) to one peer, or to all when peerId is omitted. */
	send(data, peerId) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		const targets = peerId ? [this.peers.get(peerId)] : [...this.peers.values()];
		for (const slot of targets) if (slot?.reliable?.readyState === "open") slot.reliable.send(wire);
	}
	peerList() {
		return [...this.peers.values()].map((s) => ({ ...s.info }));
	}
	schedulePoll(delay) {
		if (this.closed) return;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		this.pollTimer = setTimeout(() => void this.poll(), delay);
	}
	anyPairConnecting() {
		for (const s of this.peers.values()) {
			if (s.terminal) continue;
			if (s.info.connectionState !== "connected") return true;
		}
		return false;
	}
	async pollOnce() {
		const params = new URLSearchParams({
			room: this.opts.room,
			peer: this.opts.selfId,
			name: this.opts.name ?? "",
			since: String(this.cursor)
		});
		const res = await fetch(`/api/rtc?${params}`);
		if (this.closed) return;
		if (!res.ok) throw new Error(`signaling poll failed: ${res.status}`);
		const body = await res.json();
		if (this.closed) return;
		if (!this.everPolled) {
			this.everPolled = true;
			this.opts.onConnected?.();
		}
		this.reconcileRoster(body.peers);
		const roster = new Set(body.peers.map((p) => p.id));
		for (const sig of body.signals) {
			this.cursor = Math.max(this.cursor, sig.id);
			await this.onSignal(sig.from, sig.kind, sig.payload, roster);
			if (this.closed) return;
		}
	}
	async poll() {
		if (this.closed) return;
		try {
			await this.pollOnce();
		} catch {}
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
	}
	reconcileRoster(peers) {
		const alive = new Set(peers.map((p) => p.id));
		for (const p of peers) {
			if (p.id === this.opts.selfId) continue;
			const existing = this.peers.get(p.id);
			if (existing) existing.info.name = p.name;
			else this.connectTo(p.id, p.name, this.opts.selfId > p.id);
		}
		for (const [id, slot] of this.peers) if (!alive.has(id)) {
			slot.pc.close();
			this.peers.delete(id);
		}
		this.emitPeers();
	}
	connectTo(peerId, name, initiator) {
		if (this.closed) return null;
		const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers ?? defaultIceServers() });
		const slot = {
			pc,
			makingOffer: false,
			ignoreOffer: false,
			pendingCandidates: [],
			lastProgressAt: Date.now(),
			recoveryAttempts: 0,
			info: {
				id: peerId,
				name,
				connectionState: pc.connectionState,
				candidateType: null,
				rttMs: null
			}
		};
		this.peers.set(peerId, slot);
		pc.onicecandidate = (e) => {
			if (e.candidate) this.sendSignal(peerId, "ice", e.candidate.toJSON());
		};
		pc.onconnectionstatechange = () => {
			slot.info.connectionState = pc.connectionState;
			if (pc.connectionState === "connecting" || pc.connectionState === "connected") slot.lastProgressAt = Date.now();
			if (pc.connectionState === "connected") {
				slot.recoveryAttempts = 0;
				slot.terminal = false;
				this.readCandidateType(slot);
			}
			this.emitPeers();
			if (pc.connectionState === "failed") pc.restartIce();
			if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.schedulePoll(FAST_POLL_MS);
		};
		pc.onnegotiationneeded = async () => {
			try {
				slot.makingOffer = true;
				await pc.setLocalDescription();
				await this.sendSignal(peerId, "offer", pc.localDescription.toJSON());
			} catch {} finally {
				slot.makingOffer = false;
			}
		};
		pc.ondatachannel = (e) => this.attachChannel(slot, e.channel);
		if (initiator) {
			this.attachChannel(slot, pc.createDataChannel("state", {
				ordered: false,
				maxRetransmits: 0
			}));
			this.attachChannel(slot, pc.createDataChannel("reliable", { ordered: true }));
		}
		return slot;
	}
	attachChannel(slot, channel) {
		if (channel.label === "state") slot.state = channel;
		else slot.reliable = channel;
		channel.onopen = () => {
			slot.lastProgressAt = Date.now();
		};
		channel.onmessage = (e) => {
			let msg;
			try {
				msg = JSON.parse(e.data);
			} catch {
				return;
			}
			if (msg.t === "ping") {
				if (slot.state?.readyState === "open") slot.state.send(JSON.stringify({ t: "pong" }));
			} else if (msg.t === "pong") {
				if (slot.pingSentAt) {
					slot.info.rttMs = Math.round(performance.now() - slot.pingSentAt);
					slot.pingSentAt = void 0;
					this.emitPeers();
				}
			} else this.opts.onMessage?.(slot.info.id, msg.d, channel.label === "state" ? "state" : "reliable");
		};
	}
	/** Apply buffered ICE candidates once a remote description is in place. */
	async flushPendingCandidates(slot) {
		while (slot.pendingCandidates.length > 0) {
			const candidate = slot.pendingCandidates.shift();
			try {
				await slot.pc.addIceCandidate(candidate);
			} catch (err) {
				if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
			}
			if (this.closed) return;
		}
	}
	async onSignal(from, kind, payload, roster) {
		if (this.closed) return;
		let slot = this.peers.get(from);
		if (!slot) {
			if (!roster.has(from)) return;
			const created = this.connectTo(from, "", false);
			if (!created) return;
			slot = created;
		}
		const polite = this.opts.selfId < from;
		try {
			if (kind === "offer" || kind === "answer") {
				const description = payload;
				const collision = kind === "offer" && (slot.makingOffer || slot.pc.signalingState !== "stable");
				slot.ignoreOffer = !polite && collision;
				if (slot.ignoreOffer) return;
				try {
					await slot.pc.setRemoteDescription(description);
				} catch (err) {
					if (kind !== "offer" || slot.recreatedForOffer) throw err;
					const attempts = slot.recoveryAttempts;
					const name = slot.info.name;
					slot.pc.close();
					this.peers.delete(from);
					const fresh = this.connectTo(from, name, false);
					if (!fresh) return;
					fresh.recoveryAttempts = attempts;
					fresh.recreatedForOffer = true;
					slot = fresh;
					await slot.pc.setRemoteDescription(description);
				}
				if (this.closed) return;
				await this.flushPendingCandidates(slot);
				if (this.closed) return;
				if (kind === "offer") {
					await slot.pc.setLocalDescription();
					if (this.closed) return;
					await this.sendSignal(from, "answer", slot.pc.localDescription.toJSON());
				}
			} else if (kind === "ice") {
				const candidate = payload;
				if (!slot.pc.remoteDescription) {
					slot.pendingCandidates.push(candidate);
					return;
				}
				try {
					await slot.pc.addIceCandidate(candidate);
				} catch (err) {
					if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
				}
			}
		} catch {}
	}
	/**
	* Signals are serialized per remote peer (a candidate must never overtake
	* its SDP into the DB) and retried on failure with short backoff.
	*/
	sendSignal(to, kind, payload) {
		const next = (this.signalQueues.get(to) ?? Promise.resolve()).then(() => this.postSignal(to, kind, payload));
		this.signalQueues.set(to, next.catch(() => {}));
		return next;
	}
	async postSignal(to, kind, payload) {
		for (let attempt = 0;; attempt++) {
			if (this.closed) return;
			try {
				const res = await fetch("/api/rtc", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						op: "signal",
						room: this.opts.room,
						from: this.opts.selfId,
						to,
						kind,
						payload
					})
				});
				if (res.ok) return;
				throw new Error(`signal POST failed: ${res.status}`);
			} catch (err) {
				if (attempt >= SIGNAL_RETRY_DELAYS_MS.length) {
					console.warn(`[p2p] signal ${kind} to ${to} failed after retries`, err);
					return;
				}
				await new Promise((r) => setTimeout(r, SIGNAL_RETRY_DELAYS_MS[attempt]));
			}
		}
	}
	pingAll() {
		const wire = JSON.stringify({ t: "ping" });
		for (const slot of this.peers.values()) {
			if (slot.state?.readyState !== "open") continue;
			const stale = slot.pingSentAt !== void 0 && performance.now() - slot.pingSentAt > 2 * PING_INTERVAL_MS;
			if (slot.pingSentAt === void 0 || stale) {
				slot.pingSentAt = performance.now();
				slot.state.send(wire);
			}
		}
	}
	/**
	* Stuck-pair recovery, piggybacked on the ping interval. A pair that has
	* made no progress for STALL_MS gets rebuilt by the dialer with a FRESH
	* RTCPeerConnection (new DTLS identity — fixes the suspend/resume
	* fingerprint wedge). After MAX_RECOVERY_ATTEMPTS the pair is terminal:
	* visible to the app as its last connectionState, ignored by fast-poll.
	*/
	watchdog() {
		if (this.closed) return;
		const now = Date.now();
		for (const [peerId, slot] of this.peers) {
			const live = slot.pc.connectionState;
			if (live !== slot.info.connectionState) {
				slot.info.connectionState = live;
				if (live === "connecting" || live === "connected") slot.lastProgressAt = now;
				this.emitPeers();
			}
			if (slot.terminal || live === "connected") continue;
			if (now - slot.lastProgressAt <= STALL_MS) continue;
			if (slot.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
				slot.terminal = true;
				this.emitPeers();
				continue;
			}
			slot.recoveryAttempts += 1;
			slot.lastProgressAt = now;
			if (this.opts.selfId > peerId) {
				const { name } = slot.info;
				const attempts = slot.recoveryAttempts;
				slot.pc.close();
				this.peers.delete(peerId);
				const fresh = this.connectTo(peerId, name, true);
				if (fresh) fresh.recoveryAttempts = attempts;
				this.schedulePoll(FAST_POLL_MS);
			}
		}
	}
	async readCandidateType(slot) {
		try {
			const stats = await slot.pc.getStats();
			let selected;
			stats.forEach((s) => {
				if (s.type === "candidate-pair" && s.nominated) selected = s;
			});
			const localId = selected?.localCandidateId;
			if (localId) {
				const local = stats.get(localId);
				slot.info.candidateType = local?.candidateType ?? null;
				this.emitPeers();
			}
		} catch {}
	}
	emitPeers() {
		const list = this.peerList();
		const fingerprint = JSON.stringify(list.map((p) => [
			p.id,
			p.name,
			p.connectionState,
			p.candidateType,
			p.rttMs
		]));
		if (fingerprint === this.lastPeersFingerprint) return;
		this.lastPeersFingerprint = fingerprint;
		this.opts.onPeersChanged?.(list);
	}
};
function defaultRoom() {
	if (typeof window === "undefined") return "FASTND";
	return `FASTND`;
}
function useP2PRoom(options = {}) {
	const [selfId] = (0, import_react.useState)(() => `p-${Math.random().toString(36).slice(2, 10)}`);
	const [room] = (0, import_react.useState)(() => options.room ?? defaultRoom());
	const [name] = (0, import_react.useState)(() => options.name ?? selfId);
	const [peers, setPeers] = (0, import_react.useState)([]);
	const [joined, setJoined] = (0, import_react.useState)(false);
	const roomRef = (0, import_react.useRef)(null);
	const listeners = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		const p2p = new P2PRoom({
			room,
			selfId,
			name,
			onPeersChanged: setPeers,
			onMessage: (from, data, channel) => {
				for (const fn of listeners.current) fn(from, data, channel);
			},
			onConnected: () => setJoined(true)
		});
		roomRef.current = p2p;
		p2p.join();
		return () => {
			roomRef.current = null;
			p2p.close();
		};
	}, [
		room,
		selfId,
		name
	]);
	return {
		selfId,
		room,
		peers,
		joined,
		broadcast: (0, import_react.useCallback)((data) => roomRef.current?.broadcast(data), []),
		send: (0, import_react.useCallback)((data, peerId) => roomRef.current?.send(data, peerId), []),
		onMessage: (0, import_react.useCallback)((fn) => {
			listeners.current.add(fn);
			return () => {
				listeners.current.delete(fn);
			};
		}, [])
	};
}
function lobbyFromIpPort(ip, port) {
	const host = ip.trim() || "127.0.0.1";
	const p = port.replace(/[^0-9]/g, "").slice(0, 5) || "5555";
	return {
		room: `${host.replace(/[^a-zA-Z0-9]/g, "-")}-${p}`.replace(/-+/g, "-").slice(0, 64) || "FASTND",
		label: `${host}:${p}`
	};
}
function Home() {
	const [session, setSession] = (0, import_react.useState)(null);
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { onPlay: setSession });
	if (session.online) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnlineRace, {
		session,
		onExit: () => setSession(null)
	}, session.room + session.name);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		...session,
		p2p: null,
		onExit: () => setSession(null)
	});
}
function OnlineRace({ session, onExit }) {
	const p2p = useP2PRoom({
		room: session.room,
		name: session.name
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameShell, {
		...session,
		p2p,
		onExit
	});
}
function Menu({ onPlay }) {
	const [name, setName] = (0, import_react.useState)("Racer");
	(0, import_react.useEffect)(() => {
		try {
			const saved = localStorage.getItem("fnp-name");
			if (saved) setName(saved);
		} catch {}
	}, []);
	const [host, setHost] = (0, import_react.useState)("127.0.0.1");
	const [port, setPort] = (0, import_react.useState)("5555");
	const [online, setOnline] = (0, import_react.useState)(true);
	const hint = (0, import_react.useMemo)(() => online ? "Everyone types the same server IP and port to drop into one highway." : "Traffic and nitro only. No lobby.", [online]);
	const go = () => {
		const n = name.trim().slice(0, 16) || "Racer";
		const { room, label } = lobbyFromIpPort(host, port);
		try {
			localStorage.setItem("fnp-name", n);
		} catch {}
		onPlay({
			name: n,
			room,
			online,
			joinLabel: label
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex min-h-dvh items-center justify-center bg-bg px-5 py-10 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.28em] text-muted",
					children: "NIGHT HIGHWAY"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-5xl tracking-wide",
					children: "FAST ND PRAISE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-sm leading-relaxed text-muted",
					children: "Chase camera locked just behind the car. Collect nitro, survive denser traffic as the stage climbs."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 rounded-xl bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-muted",
							htmlFor: "racer",
							children: "Racer name"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "racer",
							value: name,
							onChange: (e) => setName(e.target.value),
							maxLength: 16,
							placeholder: "Your callsign",
							className: "mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm text-fg outline-none ring-accent focus:ring-2"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeBtn, {
								active: !online,
								onClick: () => setOnline(false),
								label: "Solo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeBtn, {
								active: online,
								onClick: () => setOnline(true),
								label: "Online"
							})]
						}),
						online && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid grid-cols-3 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "block text-xs font-medium text-muted",
										htmlFor: "host",
										children: "Server IP"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "host",
										value: host,
										onChange: (e) => setHost(e.target.value),
										maxLength: 40,
										className: "mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none ring-accent focus:ring-2"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-medium text-muted",
									htmlFor: "port",
									children: "Port"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "port",
									value: port,
									onChange: (e) => setPort(e.target.value.replace(/[^0-9]/g, "").slice(0, 5)),
									inputMode: "numeric",
									className: "mt-2 h-11 w-full rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none ring-accent focus:ring-2"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "col-span-3 mt-1 text-xs leading-relaxed text-subtle",
									children: [
										"Friends join with the same IP and port. Default ",
										host,
										":",
										port || "5555",
										"."
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-xs text-subtle",
							children: hint
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: go,
							className: "mt-6 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg",
							children: "Drive"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-6 space-y-1 text-xs text-subtle",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "W / Up — accelerate" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "S / Down — brake" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A / D or arrows — steer" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Shift or E — nitro boost" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "P / Esc — pause" })
					]
				})
			]
		})
	});
}
function ModeBtn({ active, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "h-11 rounded-md text-sm font-medium " + (active ? "bg-accent text-accent-fg" : "border border-border bg-elevated text-muted"),
		children: label
	});
}
//#endregion
export { Home as component };
