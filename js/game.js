const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const notify = document.createElement("div");
notify.id = "notification";
notify.style.position = "absolute";
notify.style.bottom = "10px";
notify.style.left = "50%";
notify.style.transform = "translateX(-50%)";
notify.style.padding = "10px 20px";
notify.style.backgroundColor = "rgba(0,0,0,0.7)";
notify.style.color = "white";
notify.style.fontSize = "18px";
notify.style.borderRadius = "10px";
document.body.appendChild(notify);

function showNotification(msg, duration = 2000) {
  notify.textContent = msg;
  notify.style.display = "block";
  setTimeout(() => (notify.style.display = "none"), duration);
}

const hpDisplay = document.getElementById("hp");
const dmgDisplay = document.getElementById("damage");
const levelDisplay = document.getElementById("level");
const enemyCounter = document.getElementById("enemyCount");

function updateUI() {
  hpDisplay.textContent = Math.max(player.hp, 0);
  dmgDisplay.textContent = player.damage;
  levelDisplay.textContent = level;
  const enemyCount = enemies.length + (boss ? 1 : 0);
  enemyCounter.textContent = enemyCount;
}

const shootSound = new Audio("sounds/shoot.mp3");
const hitSound = new Audio("sounds/hit.mp3");
const explodeSound = new Audio("sounds/explode.mp3");

const maleImg = new Image();
maleImg.src = "assets/images/male.png";
const femaleImg = new Image();
femaleImg.src = "assets/images/female.png";
const characterType = localStorage.getItem("character") || "male";
const characterImg = characterType === "nữ" ? femaleImg : maleImg;

const enemyImg = new Image();
enemyImg.src = "assets/images/enemy.png";
const bossImg = new Image();
bossImg.src = "assets/images/boss.png";

const itemImages = {
  heal: new Image(),
  armor: new Image(),
  assist: new Image()
};
itemImages.heal.src = "assets/items/heal.png";
itemImages.armor.src = "assets/items/armor.png";
itemImages.assist.src = "assets/items/assist.png";

const assistantImg = new Image();
assistantImg.src = "assets/images/assistant.png";
const playerBulletImg = new Image();
playerBulletImg.src = "assets/images/bullet-player.png";
const assistantBulletImg = new Image();
assistantBulletImg.src = "assets/images/bullet-assistant.png";
let startTime;
let player = {
  hp: 200,
  baseHp: 200,
  damage: 50,
  x: 400,
  y: 300,
  radius: 20,
  speed: 3,
  armor: false,
  assist: false
};
let barriers = [];
let assistant = null;
let isGameOver = false;
let keys = { up: false, down: false, left: false, right: false };
let level = 0;
let enemies = [], bullets = [], items = [], boss = null, assistantBullets = [], bossBullets = [];
let isBossRound = false;
let explosions = [];
let nextLevelPending = false;
let levelCleared = false;
let levelStarting = false;

addEventListener("keydown", e => {
  if (["ArrowUp", "w"].includes(e.key)) keys.up = true;
  if (["ArrowDown", "s"].includes(e.key)) keys.down = true;
  if (["ArrowLeft", "a"].includes(e.key)) keys.left = true;
  if (["ArrowRight", "d"].includes(e.key)) keys.right = true;
  if (e.key === " ") shootBullet();
});

addEventListener("keyup", e => {
  if (["ArrowUp", "w"].includes(e.key)) keys.up = false;
  if (["ArrowDown", "s"].includes(e.key)) keys.down = false;
  if (["ArrowLeft", "a"].includes(e.key)) keys.left = false;
  if (["ArrowRight", "d"].includes(e.key)) keys.right = false;
});
function startGame() {
  startTime = Date.now(); // ✅ Ghi nhận thời gian bắt đầu
  level = 1;
  isGameOver = false;
  player.hp = player.maxHp;
  enemies = [];
  spawnEnemies(level);
  requestAnimationFrame(gameLoop);
}

function shootBullet() {
  const target = boss || enemies[0];
  if (!target) return;
  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  bullets.push({ x: player.x, y: player.y, dx: Math.cos(angle) * 6, dy: Math.sin(angle) * 6, radius: 5 });
  shootSound.play();
 if (assistant) {
    const aAngle = Math.atan2(target.y - assistant.y, target.x - assistant.x);
    assistantBullets.push({ x: assistant.x, y: assistant.y, dx: Math.cos(aAngle) * 6, dy: Math.sin(aAngle) * 6, radius: 4 });
  }
}

function nextLevel() {
  level++;
  levelStarting = true;
  showNotification("🌀 Bắt đầu vòng " + level);

  enemies = [];
  items = [];
  bullets = [];
  assistantBullets = [];
  bossBullets = [];
  boss = null;
  assistant = null;
  isBossRound = level % 5 === 0;

  // Tạo rào cản hình tròn
 barriers = [];
for (let i = 0; i < 2; i++) {
  barriers.push({
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    radius: 40,
    dx: (Math.random() < 0.5 ? -1 : 1) * 0.3,
    dy: (Math.random() < 0.5 ? -1 : 1) * 0.3
  });
}


  setTimeout(() => {
    if (isBossRound) {
      let bx, by, valid = false;
      while (!valid) {
        bx = Math.random() * canvas.width;
        by = Math.random() * canvas.height;
        valid = !barriers.some(b => Math.hypot(bx - b.x, by - b.y) < b.radius + 40);
      }
      boss = {
        x: bx,
        y: by,
        radius: 40,
        hp: 10 + level * 10,
        speed: 0.5
      };
    } else {
      for (let i = 0; i < level; i++) {
        let x, y, valid = false;
        while (!valid) {
          x = Math.random() * canvas.width;
          y = Math.random() * canvas.height;
          valid = !barriers.some(b => Math.hypot(x - b.x, y - b.y) < b.radius + 15);
        }
        enemies.push({
          x,
          y,
          radius: 15,
          speed: 1,
          hp: 5 + level * 2
        });
      }
    }

    const types = ["heal", "armor", "assist"];
    for (let i = 0; i < 3; i++) {
      let x, y, valid = false;
      while (!valid) {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        valid = !barriers.some(b => Math.hypot(x - b.x, y - b.y) < b.radius + 20);
      }
      items.push({
        x,
        y,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }

    setTimeout(() => levelStarting = false, 1500);
    updateUI();
  }, 1000);
}
function updateBarriers() {
  // Di chuyển rào cản
  for (const b of barriers) {
    b.x += b.dx;
    b.y += b.dy;

    // Phản hồi khi chạm viền
    if (b.x - b.radius < 0 || b.x + b.radius > canvas.width) b.dx *= -1;
    if (b.y - b.radius < 0 || b.y + b.radius > canvas.height) b.dy *= -1;
  }

  for (const b of barriers) {
    // Đẩy người chơi
    const dP = Math.hypot(player.x - b.x, player.y - b.y);
    const overlapP = b.radius + player.radius - dP;
    if (overlapP > 0) {
      const angle = Math.atan2(player.y - b.y, player.x - b.x);
      player.x += Math.cos(angle) * overlapP;
      player.y += Math.sin(angle) * overlapP;
    }

    // Đẩy từng quái
    for (const e of enemies) {
      const dE = Math.hypot(e.x - b.x, e.y - b.y);
      const overlapE = b.radius + e.radius - dE;
      if (overlapE > 0) {
        const angle = Math.atan2(e.y - b.y, e.x - b.x);
        e.x += Math.cos(angle) * overlapE;
        e.y += Math.sin(angle) * overlapE;
      }
    }

    // Đẩy boss
    if (boss) {
      const dB = Math.hypot(boss.x - b.x, boss.y - b.y);
      const overlapB = b.radius + boss.radius - dB;
      if (overlapB > 0) {
        const angle = Math.atan2(boss.y - b.y, boss.x - b.x);
        boss.x += Math.cos(angle) * overlapB;
        boss.y += Math.sin(angle) * overlapB;
      }
    }

    // Đẩy vật phẩm
    for (const item of items) {
      const dI = Math.hypot(item.x - b.x, item.y - b.y);
      const overlapI = b.radius + 15 - dI; // 15 là bán kính item
      if (overlapI > 0) {
        const angle = Math.atan2(item.y - b.y, item.x - b.x);
        item.x += Math.cos(angle) * overlapI;
        item.y += Math.sin(angle) * overlapI;
        // Giữ trong màn hình
        item.x = Math.max(15, Math.min(canvas.width - 15, item.x));
        item.y = Math.max(15, Math.min(canvas.height - 15, item.y));
      }
    }
  }

  // 👉 Kiểm tra bị ép giữa 2 rào
  for (let i = 0; i < barriers.length; i++) {
    for (let j = i + 1; j < barriers.length; j++) {
      const b1 = barriers[i];
      const b2 = barriers[j];

      const p1 = Math.hypot(player.x - b1.x, player.y - b1.y) < b1.radius;
      const p2 = Math.hypot(player.x - b2.x, player.y - b2.y) < b2.radius;
      if (p1 && p2) {
        player.hp = 0;
        showNotification("💀 Bạn bị ép giữa hai rào!");
      }

      enemies = enemies.filter(e => {
        const e1 = Math.hypot(e.x - b1.x, e.y - b1.y) < b1.radius;
        const e2 = Math.hypot(e.x - b2.x, e.y - b2.y) < b2.radius;
        if (e1 && e2) {
          drawExplosion(e.x, e.y);
          return false;
        }
        return true;
      });

      if (boss) {
        const b1Hit = Math.hypot(boss.x - b1.x, boss.y - b1.y) < b1.radius;
        const b2Hit = Math.hypot(boss.x - b2.x, boss.y - b2.y) < b2.radius;
        if (b1Hit && b2Hit) {
          drawExplosion(boss.x, boss.y);
          boss = null;
        }
      }
    }
  }

  // 👉 Kiểm tra bị ép giữa 1 rào và viền màn hình
  for (const b of barriers) {
    const nearPlayer = Math.hypot(player.x - b.x, player.y - b.y) < b.radius;
    if (nearPlayer) {
      const margin = 1;
      const hitWall = player.x - player.radius <= 0 || player.x + player.radius >= canvas.width ||
                      player.y - player.radius <= 0 || player.y + player.radius >= canvas.height;
      if (hitWall) {
        player.hp = 0;
        showNotification("💀 Bạn bị ép vào tường!");
      }
    }

    enemies = enemies.filter(e => {
      const near = Math.hypot(e.x - b.x, e.y - b.y) < b.radius;
      const atEdge = e.x - e.radius <= 0 || e.x + e.radius >= canvas.width ||
                     e.y - e.radius <= 0 || e.y + e.radius >= canvas.height;
      if (near && atEdge) {
        drawExplosion(e.x, e.y);
        return false;
      }
      return true;
    });

    if (boss) {
      const near = Math.hypot(boss.x - b.x, boss.y - b.y) < b.radius;
      const atEdge = boss.x - boss.radius <= 0 || boss.x + boss.radius >= canvas.width ||
                     boss.y - boss.radius <= 0 || boss.y + boss.radius >= canvas.height;
      if (near && atEdge) {
        drawExplosion(boss.x, boss.y);
        boss = null;
      }
    }
  }
}

function updatePlayerPosition() {
  let nextX = player.x;
  let nextY = player.y;

  if (keys.up) nextY -= player.speed;
  if (keys.down) nextY += player.speed;
  if (keys.left) nextX -= player.speed;
  if (keys.right) nextX += player.speed;

  nextX = Math.max(player.radius, Math.min(canvas.width - player.radius, nextX));
  nextY = Math.max(player.radius, Math.min(canvas.height - player.radius, nextY));
  // Kiểm tra va chạm với rào tròn
  const hitBarrier = barriers.some(b =>
    Math.hypot(nextX - b.x, nextY - b.y) < b.radius + player.radius
  );

  // Nếu không va chạm thì mới cập nhật vị trí
  if (!hitBarrier) {
    player.x = nextX;
    player.y = nextY;
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    let moved = false;
    const baseAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

    for (let i = 0; i < 10 && !moved; i++) {
      const offset = (Math.random() - 0.5) * Math.PI;
      const angle = baseAngle + offset;
      const nextEx = enemy.x + Math.cos(angle) * enemy.speed;
      const nextEy = enemy.y + Math.sin(angle) * enemy.speed;

      const hitBarrier = barriers.some(b =>
        Math.hypot(nextEx - b.x, nextEy - b.y) < b.radius + enemy.radius
      );

      if (!hitBarrier) {
        enemy.x = nextEx;
        enemy.y = nextEy;
        moved = true;
      }
    }

    if (!moved) {
      const angle = Math.random() * 2 * Math.PI;
      const nextEx = enemy.x + Math.cos(angle) * enemy.speed;
      const nextEy = enemy.y + Math.sin(angle) * enemy.speed;

      const hitBarrier = barriers.some(b =>
        Math.hypot(nextEx - b.x, nextEy - b.y) < b.radius + enemy.radius
      );

      if (!hitBarrier) {
        enemy.x = nextEx;
        enemy.y = nextEy;
      }
    }

    // Gây sát thương nếu chạm người chơi
    if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius) {
      const damage = Math.max(1, Math.floor((enemy.hp || 5) / 2));
      player.hp -= player.armor ? Math.floor(damage / 2) : damage;
    }
  }

  // =================== BOSS ===================
  if (boss) {
    let moved = false;
    const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);

    for (let i = 0; i < 10 && !moved; i++) {
      const offset = (Math.random() - 0.5) * Math.PI;
      const angle = baseAngle + offset;
      const nextBx = boss.x + Math.cos(angle) * boss.speed;
      const nextBy = boss.y + Math.sin(angle) * boss.speed;

      const hitBarrier = barriers.some(b =>
        Math.hypot(nextBx - b.x, nextBy - b.y) < b.radius + boss.radius
      );

      if (!hitBarrier) {
        boss.x = nextBx;
        boss.y = nextBy;
        moved = true;
      }
    }

    if (!moved) {
      const angle = Math.random() * 2 * Math.PI;
      const nextBx = boss.x + Math.cos(angle) * boss.speed;
      const nextBy = boss.y + Math.sin(angle) * boss.speed;

      const hitBarrier = barriers.some(b =>
        Math.hypot(nextBx - b.x, nextBy - b.y) < b.radius + boss.radius
      );

      if (!hitBarrier) {
        boss.x = nextBx;
        boss.y = nextBy;
      }
    }

    // Gây sát thương nếu chạm người chơi
    if (Math.hypot(player.x - boss.x, player.y - boss.y) < player.radius + boss.radius) {
      const damage = 10;
      player.hp -= player.armor ? Math.floor(damage / 2) : damage;
    }

    // Boss bắn đạn xung quanh
    if (Math.random() < 0.01) {
      for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
        const dx = Math.cos(angle) * 2;
        const dy = Math.sin(angle) * 2;
        bossBullets.push({ x: boss.x, y: boss.y, dx, dy, radius: 2 });
      }
    }
  }
}

function updateBullets() {
  bullets.forEach(b => { b.x += b.dx; b.y += b.dy; });
  assistantBullets.forEach(b => { b.x += b.dx; b.y += b.dy; });
  bossBullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
    if (Math.hypot(b.x - player.x, b.y - player.y) < player.radius + b.radius) {
      const damage = 20;
      player.hp -= player.armor ? Math.floor(damage / 2) : damage;
    }
  });
}

function drawBullets() {
  // Đạn người chơi
  bullets.forEach(b => ctx.drawImage(playerBulletImg, b.x - 5, b.y - 5, 10, 10));

  // Đạn trợ thủ
  assistantBullets.forEach(b => ctx.drawImage(assistantBulletImg, b.x - 4, b.y - 4, 8, 8));

  // Đạn boss (vẽ hình tròn màu đỏ)
  bossBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
  });
}

function checkBulletCollision() {
  // Đạn người chơi
  bullets = bullets.filter(b => {
    for (let i = 0; i < enemies.length; i++) {
      if (Math.hypot(b.x - enemies[i].x, b.y - enemies[i].y) < b.radius + enemies[i].radius) {
        enemies[i].hp -= player.damage;
        if (enemies[i].hp <= 0) {
          enemies.splice(i, 1);
          drawExplosion(b.x, b.y);
        }
        hitSound.play();
        return false;
      }
    }
    if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < b.radius + boss.radius) {
      boss.hp -= player.damage;
      if (boss.hp <= 0) {
        drawExplosion(boss.x, boss.y);
        boss = null;
        hitSound.play();
      }
      return false;
    }
    return true;
  });

  // Đạn trợ thủ
  assistantBullets = assistantBullets.filter(b => {
    for (let i = 0; i < enemies.length; i++) {
      if (Math.hypot(b.x - enemies[i].x, b.y - enemies[i].y) < b.radius + enemies[i].radius) {
        enemies[i].hp -= player.damage;
        if (enemies[i].hp <= 0) {
          enemies.splice(i, 1);
          drawExplosion(b.x, b.y);
        }
        hitSound.play();
        return false;
      }
    }
    if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < b.radius + boss.radius) {
      boss.hp -= player.damage;
      if (boss.hp <= 0) {
        drawExplosion(boss.x, boss.y);
        boss = null;
        hitSound.play();
      }
      return false;
    }
    return true;
  });
}

function applyItemEffects() {
  items = items.filter(item => {
    if (Math.hypot(item.x - player.x, item.y - player.y) < player.radius + 15) {
      if (item.type === "heal") {
        const amount = isBossRound ? 20 : 5;
        player.hp = Math.min(player.baseHp, player.hp + amount);
      }
      if (item.type === "armor") {
        player.armor = true;
        setTimeout(() => player.armor = false, 20000);
      }
      if (item.type === "assist") {
        if (!assistant) {
          assistant = { x: player.x + 50, y: player.y + 50 };
          startAssistantAutoFire();
          setTimeout(() => {
  if (assistant) {
    assistant = null;
    stopAssistantAutoFire();
    showNotification("🛑 Trợ thủ đã rời đi");
  }
}, 10000);

        }
      }
      showNotification(`📦 Nhặt được: ${item.type}`);
      return false;
    }
    return true;
  });
  if (assistant) {
    assistant.x += (player.x - assistant.x) * 0.05;
    assistant.y += (player.y - assistant.y) * 0.05;
  }
}
let assistantAutoFireInterval = null;

function startAssistantAutoFire() {
  assistantAutoFireInterval = setInterval(() => {
    if (!assistant) return;

    const target = boss || enemies[0];
    if (!target) return;

    const angle = Math.atan2(target.y - assistant.y, target.x - assistant.x);
    assistantBullets.push({
      x: assistant.x,
      y: assistant.y,
      dx: Math.cos(angle) * 6,
      dy: Math.sin(angle) * 6,
      radius: 4
    });
  }, 800); // Trợ thủ bắn mỗi 0.8 giây
}

function stopAssistantAutoFire() {
  clearInterval(assistantAutoFireInterval);
  assistantAutoFireInterval = null;
}

function drawExplosion(x, y) {
  explosions.push({ x, y, time: Date.now() });
  explodeSound.play();
}

function updateExplosions() {
  const now = Date.now();
  explosions = explosions.filter(e => now - e.time < 300);
  for (const e of explosions) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = "orange";
    ctx.fill();
    ctx.closePath();
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayerPosition();
  updateEnemies();
  updateBullets();
  applyItemEffects();
  checkBulletCollision();
  updateExplosions();
  updateUI();

  // Vẽ rào cản
  barriers.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = "Green";
    ctx.fill();
    ctx.closePath();
  });

  ctx.drawImage(characterImg, player.x - 20, player.y - 20, 40, 40);

  if (assistant) ctx.drawImage(assistantImg, assistant.x - 15, assistant.y - 15, 30, 30);

  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x - 15, e.y - 15, 30, 30);
    ctx.fillStyle = "white";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(e.hp, e.x, e.y - 20);
  });

  if (boss)
    ctx.drawImage(bossImg, boss.x - boss.radius, boss.y - boss.radius, boss.radius * 2, boss.radius * 2);

  items.forEach(item => ctx.drawImage(itemImages[item.type], item.x - 15, item.y - 15, 30, 30));

  drawBullets();

  if (player.hp <= 0 && !isGameOver) {
    isGameOver = true;

    showNotification("💀 Bạn đã bị tiêu diệt ở vòng " + level);

    // Hiển thị màn hình Game Over
    document.getElementById("gameOverScreen").style.display = "block";
    document.getElementById("finalLevel").textContent = `Bạn dừng lại ở vòng ${level}`;

    // 🔵 Ghi điểm cục bộ vào localStorage
    const playerName = localStorage.getItem("username") || "Người chơi";
    const timePlayed = Math.floor((Date.now() - startTime) / 1000); // giây

    const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    leaderboard.push({ name: playerName, level, time: timePlayed });
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

    return;
  }

  if (!isGameOver && !boss && enemies.length === 0 && !nextLevelPending && !levelCleared && !levelStarting) {
    levelCleared = true;
    nextLevelPending = true;
    setTimeout(() => {
      nextLevel();
      nextLevelPending = false;
      levelCleared = false;
    }, 1000);
  }

  updateBarriers();
  requestAnimationFrame(gameLoop);
}

// Xóa overlay tối (nếu tồn tại)
const overlay = document.getElementById("screenOverlay");
if (overlay) overlay.remove();

// Đảm bảo notification không che toàn màn
const notifyFix = document.getElementById("notification");
if (notifyFix) {
  notifyFix.style.maxWidth = "300px";
  notifyFix.style.zIndex = 9999;
}

// Khởi động game
startTime = Date.now(); // ✅ Ghi nhận thời gian bắt đầu chơi
nextLevel();
gameLoop();
