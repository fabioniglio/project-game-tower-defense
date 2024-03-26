let animationId; // Declare this outside to keep track of the animation frame ID
let gameStarted = false;
let endGame = false;

const mouse = {
  x: undefined,
  y: undefined,
};

// Get Document
const startGameButton = document.getElementById("startGameButton");

const restartGameButton = document.getElementById("restartGameButton");

const backGameButton = document.getElementById("backGameButton");

const orcsKilled = document.getElementById("orcs-killed");

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
  new Level(1, 3, 3, 4),
  new Level(2, 3.25, 10, 5),
  //   new Level(3, 3.5, 13, 6),
  //   new Level(4, 3.75, 17, 7),
  //   new Level(5, 4, 20, 8),
  //   new Level(6, 4.24, 23, 9),

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
let coins = 100;
const explosions = [];
let currentLevelIndex = 0;
let currentWave = 0;
let waveActive = false;
let countOrcsKilled = 0;

document.querySelector("#heart").innerText = hearts;
document.querySelector("#coins").innerText = coins;

spawnEnemies(levels[currentLevelIndex].enemyCount);

function animate() {
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
  console.log("wave current", currentWave);
  console.log("wave ", levels[currentLevelIndex].wave);
  console.log("level", levels[currentLevelIndex].level);
  if (enemies.length === 0 && !waveActive) {
    if (currentWave < levels[currentLevelIndex].wave) {
      console.log("wave", levels[currentLevelIndex].wave);
      // Start a new wave
      waveActive = true;
      enemyCount += 2;
      spawnEnemies(levels[currentLevelIndex].enemyCount + enemyCount);
      currentWave++;
    } else if (currentLevelIndex < levels.length - 1) {
      // Move to the next level
      currentLevelIndex++;
      currentWave = 0;
      waveActive = true;
      enemyCount = 0;
      console.log(levels[currentLevelIndex].level);
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
        projectile.enemy.health -= 50;
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
  currentWave = 0;
  waveActive = false;
  countOrcsKilled = 0;

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
