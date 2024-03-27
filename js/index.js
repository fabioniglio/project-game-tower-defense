let animationId; // Declare this outside to keep track of the animation frame ID
let gameStarted = false;
let endGame = false;
let isPaused = false;
let isRadiusBoostActive = false;

const mouse = {
  x: undefined,
  y: undefined,
};

// Get Document
const startGameButton = document.getElementById("startGameButton");

const restartGameButton = document.getElementById("restartGameButton");

const backGameButton = document.getElementById("backGameButton");

const orcsKilled = document.getElementById("orcs-killed");

const level = document.getElementById("level");

const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 768;

c.fillStyle = "white";
c.fillRect(0, 0, canvas.width, canvas.height);

const placementTilesData2D = [];

for (let i = 0; i < placementTilesData.length; i += 20) {
  placementTilesData2D.push(placementTilesData.slice(i, i + 20));
}

let placementTiles = [];

placementTilesData2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 14) {
      //adding building placement tile here
      placementTiles.push(
        new PlacementTile({
          position: {
            x: x * 64,
            y: y * 64,
          },
        })
      );
    }
  });
});

const image = new Image();
image.onload = () => {
  animate();
};

const levels = [
  new Level(1, 1, 3, 4),
  new Level(2, 5, 10, 5),
  new Level(3, 6, 13, 6),
  new Level(4, 7, 17, 7),
  new Level(5, 8, 20, 8),
  new Level(6, 9, 23, 9),

  // Add more levels as needed
];
console.log(levels);
let enemies = [];

function spawnEnemies(spawnCount) {
  for (let i = 1; i < spawnCount + 1; i++) {
    const xOffset = i * 150;
    enemies.push(
      new Enemy({
        position: {
          x: waypoints[0].x - xOffset,
          y: waypoints[0].y,
        },
      })
    );
  }

  waveActive = false;
}

let buildings = [];
let activeTile = undefined;
let enemyCount = 3;
let hearts = 20;
let coins = 500;
const explosions = [];
let currentLevelIndex = 0;
let currentWave = 1;
let waveActive = false;
let countOrcsKilled = 0;

document.querySelector("#heart").innerText = hearts;
document.querySelector("#coins").innerText = coins;

spawnEnemies(levels[currentLevelIndex].enemyCount);

function animate() {
  if (isPaused) {
    return; // Exit the function early if the game is paused
  }
  animationId = requestAnimationFrame(animate);

  c.drawImage(image, 0, 0);
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.update();

    if (enemy.position.x > canvas.width) {
      hearts -= 1;
      enemies.splice(i, 1);
      document.querySelector("#heart").innerText = hearts;
      console.log("hearts", hearts);
      if (hearts == 0) {
        console.log("End Over");
        cancelAnimationFrame(animationId);
        document.querySelector("#gameOver").style.display = "flex";
        document.querySelector(
          "#orcs-killed"
        ).innerText = `Score: ${countOrcsKilled} orcs killed!`;
        gameStarted = false;
      }
    }
  }
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    explosion.draw();
    explosion.update();

    if (explosion.frames.current >= explosion.frames.max - 1) {
      explosions.splice(i, 1);
    }
  }

  if (enemies.length === 0 && !waveActive) {
    if (currentWave < levels[currentLevelIndex].wave) {
      console.log("wave", levels[currentLevelIndex].wave);
      // Start a new wave
      waveActive = true;
      enemyCount += 2;
      level.innerText = `Level ${levels[currentLevelIndex].level} - Wave ${currentWave}`;
      spawnEnemies(levels[currentLevelIndex].enemyCount + enemyCount);
      currentWave++;
    } else if (currentLevelIndex < levels.length - 1) {
      // Move to the next level
      currentLevelIndex++;
      currentWave = 1;
      waveActive = true;
      enemyCount = 0;
      level.innerText = `Level ${levels[currentLevelIndex].level} - Wave ${currentWave}`;

      spawnEnemies(levels[currentLevelIndex].enemyCount);
    } else {
      // All levels completed
      console.log("Game Completed!");
      cancelAnimationFrame(animationId);
      // Show game completed message or screen
      document.querySelector(
        "#orcs-killed"
      ).innerText = `Score: ${countOrcsKilled} orcs killed!`;
      document.querySelector("#gameOver").style.display = "flex";
      gameStarted = false;
    }
  }

  placementTiles.forEach((tile) => {
    tile.update(mouse);
  });

  buildings.forEach((building) => {
    building.update();
    building.target = null;
    const validEnemies = enemies.filter((enemy) => {
      const xDifference = enemy.center.x - building.center.x;
      const yDifference = enemy.center.y - building.center.y;

      const distance = Math.hypot(xDifference, yDifference);
      return distance < enemy.radius + building.radius;
    });
    building.target = validEnemies[0];

    for (let i = building.projectiles.length - 1; i >= 0; i--) {
      const projectile = building.projectiles[i];

      projectile.update();

      const xDifference = projectile.enemy.center.x - projectile.position.x;
      const yDifference = projectile.enemy.center.y - projectile.position.y;

      const distance = Math.hypot(xDifference, yDifference);

      //this is when a Projectile hits an enemy
      if (distance < projectile.enemy.radius + projectile.radius) {
        projectile.enemy.health -= 20;
        if (projectile.enemy.health <= 0) {
          const enemyIndex = enemies.findIndex((enemy) => {
            return projectile.enemy === enemy;
          });
          if (enemyIndex > -1) {
            enemies.splice(enemyIndex, 1);
            coins += 25;
            countOrcsKilled++;
            document.querySelector("#coins").innerText = coins;
          }
        }

        explosions.push(
          new Sprite({
            position: { x: projectile.position.x, y: projectile.position.y },
            imageSrc: "./img/explosion.png",
            frames: { max: 4 },
            offset: { x: 0, y: 0 },
          })
        );
        building.projectiles.splice(i, 1);
      }
    }
  });
}

function resetGame() {
  coins = 100;
  hearts = 10;
  buildings = [];
  enemies = [];
  activeTile = undefined;
  gameStarted = false; // Reset game started flag
  currentLevelIndex = 0;
  currentWave = 1;
  waveActive = false;
  countOrcsKilled = 0;

  level.innerText = `Level 1 - Wave ${currentWave}`;

  for (let i = 0; i < placementTiles.length; i++) {
    const tile = placementTiles[i];

    tile.isOccupied = false;
  }

  document.querySelector("#coins").innerText = coins;
  document.querySelector("#heart").innerText = hearts;
}

// --------------  Event Listener -------------------- //

startGameButton.addEventListener("click", function () {
  if (!gameStarted) {
    gameStarted = true; // Set the flag to true since the game is starting
    image.src = "img/gameMap.png"; // Assuming your image loading and game initialization happens here
  }
  document.getElementById("start").style.display = "none";
});

backGameButton.addEventListener("click", function () {
  gameStarted = false;
  c.fillStyle = "white";
  c.fillRect(0, 0, canvas.width, canvas.height);

  resetGame();

  document.getElementById("gameOver").style.display = "none";
  document.getElementById("start").style.display = "flex";
});

restartGameButton.addEventListener("click", function () {
  document.getElementById("gameOver").style.display = "none";

  resetGame();

  spawnEnemies(levels[currentLevelIndex].enemyCount);

  c.clearRect(0, 0, canvas.width, canvas.height);

  // Restart the game loop by calling animate() only if it's not already started
  if (!gameStarted) {
    gameStarted = true;
    animate(); // This starts the game loop again
  }
});

canvas.addEventListener("click", (event) => {
  if (activeTile && !activeTile.isOccupied && coins - 50 >= 0) {
    coins -= 50;
    document.querySelector("#coins").innerText = coins;
    buildings.push(
      new Building({
        position: { x: activeTile.position.x, y: activeTile.position.y },
      })
    );
    activeTile.isOccupied = true;
    buildings.sort((a, b) => {
      return a.position.y - b.position.y;
    });
  }
});

window.addEventListener("mousemove", (event) => {
  // Get canvas bounds
  const rect = canvas.getBoundingClientRect();

  // Adjust mouse coordinates
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;

  activeTile = null;
  for (let i = 0; i < placementTiles.length; i++) {
    const tile = placementTiles[i];
    if (
      mouse.x > tile.position.x &&
      mouse.x < tile.position.x + tile.size &&
      mouse.y > tile.position.y &&
      mouse.y < tile.position.y + tile.size
    ) {
      activeTile = tile;
      break;
    }
  }
});

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyP") {
    // Check if the 'P' key was pressed
    isPaused = !isPaused; // Toggle the pause state

    if (!isPaused) {
      // If the game has just been unpaused, restart the animation loop
      requestAnimationFrame(animate);
    }
  }

  if (event.code === "Space" && coins >= 200 && !isRadiusBoostActive) {
    coins -= 200; // Deduct coins
    document.querySelector("#coins").innerText = coins; // Update coins display

    buildingRadiusModifier = 2; // Double the radius modifier
    isRadiusBoostActive = true; // Prevent reactivation

    buildings.forEach(
      (building) => (building.buildingRadiusModifier = buildingRadiusModifier)
    );

    setTimeout(() => {
      buildingRadiusModifier = 1; // Revert to original radius after 5 seconds
      buildings.forEach(
        (building) => (building.buildingRadiusModifier = buildingRadiusModifier)
      );
      isRadiusBoostActive = false; // Allow reactivation
    }, 5000); // 5000 milliseconds = 5 seconds
  }
});
