export class PauseManager {
  constructor(game) {
    this.game = game;
    this.paused = false;
    this.pauseStack = 0;
    this.pauseReasons = new Set();
  }

  reset() {
    this.paused = false;
    this.pauseStack = 0;
    this.pauseReasons.clear();
  }

  addPause(reason) {
    if (this.pauseReasons.has(reason)) return;
    this.pauseReasons.add(reason);
    this.pauseStack++;
    if (this.pauseStack === 1) {
      this.paused = true;
    }
  }

  removePause(reason) {
    if (!this.pauseReasons.has(reason)) return;
    this.pauseReasons.delete(reason);
    this.pauseStack--;
    if (this.pauseStack <= 0) {
      this.pauseStack = 0;
      this.paused = false;
    }
  }

  isPaused() {
    return this.paused;
  }

  hasReason(reason) {
    return this.pauseReasons.has(reason);
  }
}
