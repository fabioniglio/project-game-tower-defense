class Level {
  constructor(level, speed, enemyCount, wave) {
    this.level = level;
    this.speed = speed;
    this.enemyCount = enemyCount;
    this.wave = wave;
  }

  // Method to increase speed of enemies the level
  addSpeed() {
    this.speed += 0.5;
  }

  // Additional methods as needed
}
