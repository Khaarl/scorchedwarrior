// Initialize canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let terrainHeights = [];
let mech1X, mech2X;
let playerAngle = 45; // Initial angle
let playerPower = 50; // Initial power
let aiAngle, aiPower; // Variables to store AI's angle and power
let projectile = null;
let currentTurn = 'player'; // 'player' or 'ai'
let gameState = 'aiming'; // 'aiming', 'shooting', 'turn_end'
let mech1Health = 100; // Player's mech health
let mech2Health = 100; // AI's mech health
let hitEffect = null; // For hit flash effect
const gravity = 0.05; // Gravity constant
let musicEnabled = true;
let music = null;

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowLeft': playerAngle = Math.max(0, playerAngle - 5); break;
    case 'ArrowRight': playerAngle = Math.min(90, playerAngle + 5); break;
    case 'ArrowUp': playerPower = Math.min(100, playerPower + 5); break;
    case 'ArrowDown': playerPower = Math.max(0, playerPower - 5); break;
    case ' ': // Spacebar to fire
      if (currentTurn === 'player' && gameState === 'aiming') {
        gameState = 'shooting';
        if (!projectile) {
          fireProjectile(mech1X, playerAngle, playerPower);         }
      }
      break;
  }
});

function aiTurn() {
  if (currentTurn === 'ai' && gameState === 'aiming') {
    calculateAiShot();
    fireProjectile(mech2X, aiAngle, aiPower);
    gameState = 'shooting';   
  }
}

function calculateAiShot() {
  const targetX = mech1X;
  const y0 = canvas.height - terrainHeights[Math.floor(mech2X)] - 10;
  const x0 = mech2X;

  let bestAngle = 45;
  let bestPower = 50;
  let minError = Infinity;

  for (let angle = 10; angle <= 80; angle += 5) {
      for (let power = 30; power <= 70; power += 5) {
          const path = calculateTrajectory(x0, y0, angle, power);
          const lastPoint = path[path.length - 1];
          const error = Math.abs(lastPoint.x - targetX);

          if (error < minError) {
              minError = error;
              bestAngle = angle;
              bestPower = power;
          }
      }
  }

  aiAngle = bestAngle;
  aiPower = bestPower;
}

function fireProjectile(x0, angle, power) {
  if (!projectile) {
  }
}



function update() {
  if (scene === 'game') {
    if (gameState === 'turn_end') {
      switchTurn();
  }
  
  aiTurn();

  generateTerrain();
  if (projectile) {
    projectile.x += projectile.velocityX;
    projectile.y += projectile.velocityY;
    projectile.velocityY += gravity; // Apply gravity
    
    const terrainCollision = checkTerrainCollision(projectile.x, projectile.y);
    let mechCollision = null;
    if (currentTurn === 'player') {
      mechCollision = checkMechCollision(projectile.x, projectile.y, mech2X, mech2Y);
    } else {
      mechCollision = checkMechCollision(projectile.x, projectile.y, mech1X, mech1Y);
    }

    if (terrainCollision) { // Terrain collision
      destroyTerrain(Math.floor(projectile.x), Math.floor(projectile.y));
      projectile = null;
      gameState = 'turn_end';
    } else if (mechCollision) { // Mech collision
      if (currentTurn === 'player') {
        mech2Health -= 20;
        hitEffect = { x: mech2X, y: mech2Y }; // Set hit effect for mech2
      } else {
        mech1Health -= 20;
        hitEffect = { x: mech1X, y: mech1Y }; // Set hit effect for mech1
      }
      projectile = null;
      gameState = 'turn_end';
      // Check for win/loss
      if (mech1Health <= 0) {
        alert("AI Wins!");
        scene = 'menu';
      } else if (mech2Health <= 0) {
        alert("Player Wins!");
        scene = 'menu';
      }
    } else if (projectile.y > canvas.height || projectile.x < 0 || projectile.x > canvas.width) { // Out of bounds
      projectile = null;
      gameState = 'turn_end';
    }
  }
}

// Function to switch turns
function switchTurn() {
  currentTurn = currentTurn === 'player' ? 'ai' : 'player';
  gameState = 'aiming';
}

// Function to check terrain collision

function checkTerrainCollision(x, y) {
    if (x >= 0 && x < 1000 && y >= canvas.height - getTerrainHeight(x)) {
        return true;
    }
    return false;
}

// Function to get terrain height at a given x position
function getTerrainHeight(x) {
    const x0 = Math.floor(x);
    const x1 = Math.ceil(x);
    if (x0 === x1) {
        return terrainHeights[x0];
    }
    const y0 = terrainHeights[x0];
    const y1 = terrainHeights[x1];
    return y0 + (y1 - y0) * (x - x0); // Linear interpolation
}

// Function to destroy terrain
function destroyTerrain(x, y) {
  const radius = 10;
  for (let i = x - radius; i <= x + radius; i++) {
    if (i >= 0 && i < terrainHeights.length) {
      const dist = Math.sqrt(Math.pow(x - i, 2));
      if (dist <= radius) {
        terrainHeights[i] = Math.max(0, terrainHeights[i] - (radius - dist));
      }
    }
  }
}
// Function to check mech collision
function checkMechCollision(x, y, mechX, mechY) {
  const dx = x - mechX;
  const dy = y - (mechY - 10);
  return Math.sqrt(dx * dx + dy * dy) < 20;
}

// Function to render the game
function render() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (scene === 'game') {
      // Draw terrain
      ctx.fillStyle = 'peru';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let i = 0; i < 1000; i++) {
          ctx.lineTo(i * 2, canvas.height - terrainHeights[i]); // Scale x-coordinates
      }
      ctx.lineTo(canvas.width, canvas.height - terrainHeights[999]); // Connect to the last point
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();
      
      // Calculate mech positions
      mech1Y = canvas.height - getTerrainHeight(mech1X);
      mech2Y = canvas.height - getTerrainHeight(mech2X);

      // Draw mechs
      drawMech(ctx, mech1X, mech1Y, 0, 'blue');
      drawMech(ctx, mech2X, mech2Y, 0, 'red');

      // Draw UI elements
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(`Turn: ${currentTurn}`, 10, 30);
      ctx.fillText(`Angle: ${playerAngle}°`, 10, 60);
      ctx.fillText(`Power: ${playerPower}`, 10, 90);

      // Draw health bars
      drawHealthBar(ctx, mech1X, mech1Y - 40, mech1Health);
      drawHealthBar(ctx, mech2X, mech2Y - 40, mech2Health);

    // Draw trajectory for player's turn
    if (gameState === 'aiming' && currentTurn === 'player') {
      drawTrajectoryLine(ctx, mech1X, mech1Y - 10, playerAngle, playerPower);
    }
    
    // Draw projectile
    if (projectile) {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

     // Draw hit effect
    if (hitEffect && Date.now() - hitEffect.time < 100) {
        ctx.fillStyle = 'white';
        ctx.fillRect(hitEffect.x - 15, hitEffect.y - 20, 30, 20);
    }
    
  }   else if (scene === 'menu') {
    renderMenu();
  } else if (scene === 'options') {
    renderOptions();
  }
}

let scene = 'menu';

function startGame() {
  terrainHeights = [];
  mech1X = 0;
  mech2X = 0;
  mech1Health = 100;
  mech2Health = 100;
  currentTurn = 'player';
  gameState = 'aiming';
  playerAngle = 45;
  playerPower = 50;
  aiAngle = 0;
  aiPower = 0;
  projectile = null;
  generateTerrain();
}

function renderMenu() {
  ctx.fillStyle = 'skyblue';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'black';
  ctx.font = '48px Arial';
  ctx.fillText('Scorched Warrior', canvas.width / 2 - 250, canvas.height / 2 - 50);

    // Button dimensions
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = canvas.width / 2 - buttonWidth / 2;

    // "New Game" button
    ctx.fillStyle = 'green';
    ctx.fillRect(buttonX, canvas.height / 2, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('New Game', buttonX + buttonWidth / 2 - 70, canvas.height / 2 + buttonHeight / 2 + 10);

    // "Options" button
    ctx.fillStyle = 'gray';
    ctx.fillRect(buttonX, canvas.height / 2 + 70, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Options', buttonX + buttonWidth / 2 - 50, canvas.height / 2 + 70 + buttonHeight / 2 + 10);
}

function renderOptions() {
  ctx.fillStyle = 'lightgray';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'black';
  ctx.font = '48px Arial';
  ctx.fillText('Options', canvas.width / 2 - 100, canvas.height / 2 - 50);

    const buttonWidth = 300;
    const buttonHeight = 50;
    const buttonX = canvas.width / 2 - buttonWidth / 2;

    // "Music: ON/OFF" button
    ctx.fillStyle = musicEnabled ? 'green' : 'red';
    ctx.fillRect(buttonX, canvas.height / 2, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(`Music: ${musicEnabled ? 'ON' : 'OFF'}`, buttonX + buttonWidth / 2 - 80, canvas.height / 2 + buttonHeight / 2 + 10);
    // "Back" button
    ctx.fillStyle = 'gray';
    ctx.fillRect(buttonX, canvas.height / 2 + 70, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('Back', buttonX + buttonWidth / 2 - 30, canvas.height / 2 + 70 + buttonHeight / 2 + 10);
}

function handleMouseClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

    if (scene === 'menu') {
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = canvas.width / 2 - buttonWidth / 2;

        if (x > buttonX && x < buttonX + buttonWidth && y > canvas.height / 2 && y < canvas.height / 2 + buttonHeight) {
            scene = 'game';
            startGame();
        } else if (x > buttonX && x < buttonX + buttonWidth && y > canvas.height / 2 + 70 && y < canvas.height / 2 + 70 + buttonHeight) {
            scene = 'options';
        }

  } else if (scene === 'options') {
    // Check "Music" button click
    if (x > canvas.width / 2 - 150 && x < canvas.width / 2 + 150 && y > canvas.height / 2 && y < canvas.height / 2 + 50) {
      musicEnabled = !musicEnabled;
    }
    // Check "Back" button click
    else if (x > canvas.width / 2 - 100 && x < canvas.width / 2 + 100 && y > canvas.height / 2 + 70 && y < canvas.height / 2 + 120) {
      scene = 'menu';
    }
  }
}

canvas.addEventListener('click', handleMouseClick);


function calculateTrajectory(x0, y0, angle, power) {
  const path = [];
  const angleRad = angle * Math.PI / 180;
  let velocityX = power * Math.cos(angleRad);
  let velocityY = -power * Math.sin(angleRad);
  let x = x0;
  let y = y0;

  while (y < canvas.height) {
      x += velocityX;
      y += velocityY;
      velocityY += gravity;
      path.push({x: x, y: y});
      
      if (checkTerrainCollision(x, y)) {
          break;
      }
  }
  

  return path;
}

let audioCtx;
let masterGain;

function initAudio() {
  if (!audioCtx) {
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
  masterGain.gain.value = musicEnabled ? 1 : 0;
}

function playNote(frequency, duration, startTime, waveform = 'sine') {
  if (!musicEnabled) return;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = waveform;
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.5, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}


function stopMusic() {
  if (music) {
    clearInterval(music);
    music = null;
  } 
}

function drawTrajectoryLine(ctx, x0, y0, angle, power) {
      ctx.strokeStyle = 'black';
      ctx.setLineDash([5, 5]);
      const path = calculateTrajectory(x0, y0, angle, power);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      for (const point of path) {
          ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
  // Function to draw health bars
function drawHealthBar(ctx, x, y, health) {
    const barWidth = 40;
    const barHeight = 8;
    let healthColor;
  
    if (health > 66) {
      healthColor = 'green';
    } else if (health > 33) {
      healthColor = 'yellow';
    } else {
      healthColor = 'red';
    }
  
    ctx.fillStyle = 'white';
    ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
  
    ctx.fillStyle = healthColor;
    ctx.fillRect(x - barWidth / 2, y, (health / 100) * barWidth, barHeight);
  }

function generateTerrain() {
  terrainHeights = [];
  const resolution = 1000;
  const smoothness = 5;

  // Initial rough terrain
  for (let i = 0; i < resolution; i++) {
      terrainHeights.push(Math.random() * 200 + 150);
  }

  // Smoothing
  for (let i = 0; i < smoothness; i++) {
      const smoothedHeights = [...terrainHeights];
      for (let j = 1; j < resolution - 1; j++) {
          smoothedHeights[j] = (terrainHeights[j - 1] + terrainHeights[j] + terrainHeights[j + 1]) / 3;
      }
      terrainHeights = smoothedHeights;
  }

  // Ensure minimum height
  for (let i = 0; i < resolution; i++) {
      terrainHeights[i] = Math.max(50, terrainHeights[i]);
  }

  if (scene === 'game') {
      mech1X = Math.random() * (resolution * 0.8);
      mech2X = Math.random() * (resolution * 0.8);
  }
}

// Function to draw a mech robot
function drawMech(ctx, x, y, angle, color) {
  ctx.save();
  ctx.translate(x, y); // Move origin to mech position

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(-15, -20, 30, 20); // Body rectangle

    // Body detail (a circle in the center)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.fill();

  // Legs
  ctx.fillStyle = 'darkgray';
  ctx.fillRect(-20, 0, 10, 20);
  ctx.fillRect(10, 0, 10, 20);

    // Turret
    ctx.translate(0, -20); // Move to turret position
    ctx.rotate(angle * Math.PI / 180); // Rotate turret
    ctx.fillStyle = 'darkgray';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2); // Turret circle
    ctx.fill();

  // Gun
  ctx.fillStyle = 'black';
    ctx.fillRect(10, -2, 15, 4); // Gun rectangle

    ctx.restore(); // Restore original state
}

// Main game loop
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
