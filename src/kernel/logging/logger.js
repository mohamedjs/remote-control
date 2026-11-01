/**
 * Structured logger with contextual prefixes and log levels.
 */
export function createLogger(context = 'App') {
  const prefix = `[${context}]`;

  return {
    debug(...args) {
      if (process.env.DEBUG || process.env.VERBOSE) {
        console.debug(prefix, ...args);
      }
    },
    info(...args) {
      console.log(prefix, ...args);
    },
    warn(...args) {
      console.warn(prefix, '⚠️', ...args);
    },
    error(...args) {
      console.error(prefix, '🛑', ...args);
    },
  };
}
