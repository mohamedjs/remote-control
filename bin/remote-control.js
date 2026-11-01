#!/usr/bin/env node

import { main } from '../src/main.js';

main().then((code) => {
  if (typeof code === 'number' && code !== 0) {
    process.exit(code);
  }
}).catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
