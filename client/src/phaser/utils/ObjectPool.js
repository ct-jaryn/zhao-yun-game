export class ObjectPool {
  constructor(factory, resetter, initialSize = 0) {
    this.factory = factory;
    this.resetter = resetter;
    this.available = [];
    this.active = new Set();

    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  acquire(...args) {
    let obj = this.available.pop();
    if (!obj) {
      obj = this.factory();
    }
    this.resetter(obj, ...args);
    this.active.add(obj);
    return obj;
  }

  release(obj) {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      this.available.push(obj);
    }
  }

  releaseAll() {
    for (const obj of this.active) {
      this.available.push(obj);
    }
    this.active.clear();
  }

  clear() {
    for (const obj of this.active) {
      if (obj.destroy) obj.destroy();
    }
    for (const obj of this.available) {
      if (obj.destroy) obj.destroy();
    }
    this.active.clear();
    this.available = [];
  }
}
