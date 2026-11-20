const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener("resize", resize);
resize();

const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

const LIMIT = 40;
let boat = { x: 0, z: 0, angle: 0, speed: 0 };
let score = 0, timeLeft = 60, gameOver = false, alertTimer = null;
let items = [], turtles = [];

function showAlert() {
  const el = document.getElementById("alert");
  el.style.opacity = 1;
  clearTimeout(alertTimer);
  alertTimer = setTimeout(() => el.style.opacity = 0, 1400);
}

function spawnItem(kind) {
  items.push({
    x: (Math.random() - 0.5) * LIMIT * 1.8,
    z: (Math.random() - 0.5) * LIMIT * 1.8,
    kind,
    color: Math.random() < 0.5 ? "#48cae4" : "#ffb703",
    phase: Math.random() * 6.28
  });
}

function populate() {
  items = []; turtles = [];
  for (let i = 0; i < 20; i++) spawnItem("trash");
  for (let i = 0; i < 6; i++) spawnItem("oil");
  for (let i = 0; i < 7; i++) {
    turtles.push({
      x: (Math.random() - 0.5) * LIMIT * 1.5,
      z: (Math.random() - 0.5) * LIMIT * 1.5,
      angle: Math.random() * 6.28,
      timer: 120, cooldown: 0, phase: Math.random() * 6.28
    });
  }
}
populate();

setInterval(() => {
  if (gameOver) return;
  document.getElementById("timer").textContent = --timeLeft;
  if (timeLeft <= 0) {
    gameOver = true;
    document.getElementById("final-stats").textContent = `You skimmed ${score} pieces of ocean plastic!`;
    document.getElementById("gameover").style.display = "flex";
  }
}, 1000);

function resetGame() {
  boat = { x: 0, z: 0, angle: 0, speed: 0 };
  score = 0; timeLeft = 60; gameOver = false;
  document.getElementById("score").textContent = 0;
  document.getElementById("timer").textContent = 60;
  document.getElementById("gameover").style.display = "none";
  populate();
}

function project(wx, wy, wz, camX, camY, camZ, camYaw) {
  const dx = wx - camX, dy = wy - camY, dz = wz - camZ;
  const cosY = Math.cos(camYaw), sinY = Math.sin(camYaw);
  const rx = dx * cosY - dz * sinY;
  const rz = dx * sinY + dz * cosY;
  const pitch = 0.45;
  const ry = dy * Math.cos(pitch) + rz * Math.sin(pitch);
  const fz = -dy * Math.sin(pitch) + rz * Math.cos(pitch);
  if (fz <= 0.5) return null;
  const fov = 550;
  return { x: canvas.width / 2 + (rx / fz) * fov, y: canvas.height / 2 - (ry / fz) * fov, z: fz };
}

function drawQuad(p0, p1, p2, p3, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fill();
}

function draw3DBox(cx, cy, cz, w, h, d, yaw, colorTop, colorSide) {
  const hw = w / 2, hd = d / 2;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const corners = [
    [-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd],
    [-hw, h, -hd], [hw, h, -hd], [hw, h, hd], [-hw, h, hd]
  ];
  const pts = corners.map(([lx, ly, lz]) => {
    const wx = cx + lx * c + lz * s;
    const wz = cz - lx * s + lz * c;
    return project(wx, cy + ly, wz, cam.x, cam.y, cam.z, cam.yaw);
  });
  if (pts.some(p => !p)) return;

  drawQuad(pts[0], pts[1], pts[5], pts[4], colorSide);
  drawQuad(pts[1], pts[2], pts[6], pts[5], colorSide);
  drawQuad(pts[2], pts[3], pts[7], pts[6], colorSide);
  drawQuad(pts[3], pts[0], pts[4], pts[7], colorSide);
  drawQuad(pts[4], pts[5], pts[6], pts[7], colorTop);
}

let cam = { x: 0, y: 9, z: -15, yaw: 0 };

function loop(time) {
  requestAnimationFrame(loop);

  if (!gameOver) {
    if (keys["w"] || keys["arrowup"]) boat.speed += 0.015;
    if (keys["s"] || keys["arrowdown"]) boat.speed -= 0.012;
    boat.speed = Math.max(-0.18, Math.min(0.42, boat.speed * 0.96));

    const turn = Math.min(Math.abs(boat.speed) * 4, 1);
    if (keys["a"] || keys["arrowleft"]) boat.angle -= 0.045 * turn;
    if (keys["d"] || keys["arrowright"]) boat.angle += 0.045 * turn;

    boat.x = Math.max(-LIMIT, Math.min(LIMIT, boat.x + Math.sin(boat.angle) * boat.speed));
    boat.z = Math.max(-LIMIT, Math.min(LIMIT, boat.z + Math.cos(boat.angle) * boat.speed));

    for (const t of turtles) {
      if (t.cooldown > 0) t.cooldown--;
      if (--t.timer <= 0) { t.timer = 150; t.angle += (Math.random() - 0.5) * 2; }
      if (Math.abs(t.x) > LIMIT - 4 || Math.abs(t.z) > LIMIT - 4) t.angle = Math.atan2(-t.x, -t.z);
      t.x += Math.sin(t.angle) * 0.06;
      t.z += Math.cos(t.angle) * 0.06;
      if (t.cooldown === 0 && Math.hypot(boat.x - t.x, boat.z - t.z) < 2.2) {
        t.cooldown = 90; boat.speed *= -0.4;
        score = Math.max(0, score - 2);
        document.getElementById("score").textContent = score;
        showAlert();
      }
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      const dist = Math.hypot(boat.x - it.x, boat.z - it.z);
      if (it.kind === "trash" && dist < 2.2) {
        document.getElementById("score").textContent = ++score;
        items.splice(i, 1); spawnItem("trash");
      } else if (it.kind === "oil" && dist < 2.6) {
        boat.speed *= 0.6;
      }
    }
  }

  // Smooth Chase Camera positioned behind & above the boat
  const targetCamX = boat.x - Math.sin(boat.angle) * 15;
  const targetCamZ = boat.z - Math.cos(boat.angle) * 15;
  cam.x += (targetCamX - cam.x) * 0.12;
  cam.z += (targetCamZ - cam.z) * 0.12;
  cam.yaw = boat.angle;

  // Sky & Ocean Horizon
  const clean = Math.min(score / 30, 1);
  ctx.fillStyle = "#90e0ef";
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.35);
  ctx.fillStyle = `rgb(0, ${Math.floor(100 + clean * 90)}, ${Math.floor(150 + clean * 80)})`;
  ctx.fillRect(0, canvas.height * 0.35, canvas.width, canvas.height * 0.65);

  // 3D Ocean Wave Grid Lines
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  for (let gx = -LIMIT; gx <= LIMIT; gx += 8) {
    const p1 = project(gx, 0, -LIMIT, cam.x, cam.y, cam.z, cam.yaw);
    const p2 = project(gx, 0, LIMIT, cam.x, cam.y, cam.z, cam.yaw);
    if (p1 && p2) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
  }
  for (let gz = -LIMIT; gz <= LIMIT; gz += 8) {
    const p1 = project(-LIMIT, 0, gz, cam.x, cam.y, cam.z, cam.yaw);
    const p2 = project(LIMIT, 0, gz, cam.x, cam.y, cam.z, cam.yaw);
    if (p1 && p2) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
  }

  // Depth-Sort & Draw All 3D Objects
  const renderList = [];
  items.forEach(it => renderList.push({ type: it.kind, x: it.x, z: it.z, data: it }));
  turtles.forEach(t => renderList.push({ type: "turtle", x: t.x, z: t.z, data: t }));
  renderList.push({ type: "boat", x: boat.x, z: boat.z, data: boat });

  renderList.sort((a, b) => Math.hypot(b.x - cam.x, b.z - cam.z) - Math.hypot(a.x - cam.x, a.z - cam.z));

  for (const obj of renderList) {
    if (obj.type === "oil") {
      const p = project(obj.x, 0.02, obj.z, cam.x, cam.y, cam.z, cam.yaw);
      if (p) {
        ctx.fillStyle = "#1b1b1e";
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 900 / p.z, 320 / p.z, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (obj.type === "trash") {
      const bob = Math.sin(time * 0.005 + obj.data.phase) * 0.1;
      draw3DBox(obj.x, 0.1 + bob, obj.z, 0.8, 0.7, 0.8, time * 0.002, obj.data.color, "#0077b6");
    } else if (obj.type === "turtle") {
      const t = obj.data;
      const flap = Math.sin(time * 0.01 + t.phase) * 0.35;
      draw3DBox(t.x, 0.05, t.z, 1.3, 0.45, 1.6, t.angle, "#2a9d8f", "#1d6f65");
      draw3DBox(t.x + Math.sin(t.angle) * 1.0, 0.15, t.z + Math.cos(t.angle) * 1.0, 0.45, 0.35, 0.5, t.angle, "#52b788", "#40916c");
      draw3DBox(t.x + Math.cos(t.angle) * 0.9, 0.1, t.z - Math.sin(t.angle) * 0.9, 0.8, 0.12, 0.35, t.angle + flap, "#40916c", "#2d6a4f");
      draw3DBox(t.x - Math.cos(t.angle) * 0.9, 0.1, t.z + Math.sin(t.angle) * 0.9, 0.8, 0.12, 0.35, t.angle - flap, "#40916c", "#2d6a4f");
    } else if (obj.type === "boat") {
      const bob = Math.sin(time * 0.006) * 0.06;
      draw3DBox(boat.x, 0.1 + bob, boat.z, 1.6, 0.65, 3.2, boat.angle, "#f4a261", "#e76f51");
      draw3DBox(boat.x - Math.sin(boat.angle) * 0.3, 0.75 + bob, boat.z - Math.cos(boat.angle) * 0.3, 1.1, 0.75, 1.2, boat.angle, "#ffffff", "#d8e2dc");
    }
  }
}
requestAnimationFrame(loop);
