import fs from 'node:fs';
import path from 'node:path';

export class FileDeckRepository {
  #deckDir;

  /**
   * @param {string} deckDir Directory containing JSON manifests
   */
  constructor(deckDir) {
    this.#deckDir = deckDir;
  }

  loadAll() {
    if (!fs.existsSync(this.#deckDir)) return [];

    const files = fs.readdirSync(this.#deckDir).filter((f) => f.endsWith('.json'));
    const decks = [];

    for (const file of files) {
      try {
        const full = path.join(this.#deckDir, file);
        const content = fs.readFileSync(full, 'utf8');
        const parsed = JSON.parse(content);
        decks.push(parsed);
      } catch {
        // Skip malformed files
      }
    }

    return decks;
  }
}
