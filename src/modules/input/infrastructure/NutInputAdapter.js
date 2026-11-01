import { createRequire } from 'node:module';
import { NamedKey } from '../domain/InputPort.js';

const require = createRequire(import.meta.url);

export class NutInputAdapter {
  #nut = null;
  #mouse = null;
  #keyboard = null;
  #Key = null;
  #Point = null;
  #available = false;
  #logger;

  constructor(logger = console) {
    this.#logger = logger;
    this.#initNut();
  }

  #initNut() {
    try {
      const nutModule = require('@nut-tree-fork/nut-js');

      this.#nut = nutModule;
      this.#mouse = nutModule.mouse;
      this.#keyboard = nutModule.keyboard;
      this.#Key = nutModule.Key;
      this.#Point = nutModule.Point;

      // Disable default autoDelay for instant live remote control
      this.#mouse.config.mouseSpeed = 2000;
      this.#mouse.config.autoDelayMs = 0;
      this.#keyboard.config.autoDelayMs = 0;
      this.#available = true;
    } catch (err) {
      this.#available = false;
      this.#logger.warn?.('nut.js native dependencies unavailable, operating in mock/log mode:', err.message);
    }
  }

  isAvailable() {
    return this.#available;
  }

  get nutInstance() {
    return this.#nut;
  }

  async getPosition() {
    if (!this.#available || !this.#mouse) return { x: 0, y: 0 };
    const pos = await this.#mouse.getPosition();
    return { x: pos.x, y: pos.y };
  }

  async setPosition(x, y) {
    if (!this.#available || !this.#mouse || !this.#Point) return;
    await this.#mouse.setPosition(new this.#Point(x, y));
  }

  async click(button = 'left') {
    if (!this.#available || !this.#mouse) return;
    if (button === 'right') {
      await this.#mouse.rightClick();
    } else {
      await this.#mouse.leftClick();
    }
  }

  async scroll(amount, direction = 'down') {
    if (!this.#available || !this.#mouse) return;
    if (direction === 'up') {
      await this.#mouse.scrollUp(amount);
    } else {
      await this.#mouse.scrollDown(amount);
    }
  }

  #resolveKey(name) {
    if (!this.#Key || typeof name !== 'string' || !name) return null;
    if (NamedKey[name] && this.#Key[NamedKey[name]]) return this.#Key[NamedKey[name]];
    if (this.#Key[name]) return this.#Key[name];
    if (name.length === 1) {
      if (/[a-zA-Z]/.test(name)) return this.#Key[name.toUpperCase()] ?? null;
      if (/[0-9]/.test(name)) return this.#Key['Num' + name] ?? null;
    }
    return null;
  }

  #resolveMod(mod) {
    if (!this.#Key) return null;
    const isMac = process.platform === 'darwin';
    const map = {
      Shift: this.#Key.LeftShift,
      Control: this.#Key.LeftControl,
      Alt: this.#Key.LeftAlt,
      Meta: isMac ? this.#Key.LeftCmd : this.#Key.LeftSuper,
      primary: isMac ? this.#Key.LeftCmd : this.#Key.LeftControl,
    };
    return map[mod] ?? null;
  }

  async tapKey(keyName, mods = []) {
    if (!this.#available || !this.#keyboard || !this.#Key) return;

    const targetKey = this.#resolveKey(keyName);
    if (!targetKey) return;

    const modKeys = mods.map((m) => this.#resolveMod(m)).filter(Boolean);

    for (const m of modKeys) await this.#keyboard.pressKey(m);
    try {
      await this.#keyboard.pressKey(targetKey);
      await this.#keyboard.releaseKey(targetKey);
    } finally {
      for (const m of [...modKeys].reverse()) await this.#keyboard.releaseKey(m);
    }
  }

  async typeText(text) {
    if (!this.#available || !this.#keyboard) return;
    await this.#keyboard.type(text);
  }
}
