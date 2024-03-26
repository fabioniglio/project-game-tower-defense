class Level {
  constructor(level, speed, enemyCount, wave) {
    this.level = level;
    this.speed = speed;
    this.enemyCount = enemyCount;
    this.wave = wave;
  }

  // Method to start the level
  start() {
    console.log(
      `Starting Level ${this.level} with ${this.enemyCount} enemies.`
    );
    // Initialize level-specific elements here
  }

  // Additional methods as needed
}
