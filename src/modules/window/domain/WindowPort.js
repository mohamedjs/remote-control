/**
 * Pure domain types and ports for the desktop native window launcher.
 * ZERO I/O.
 */

/**
 * @typedef {Object} WindowPort
 * @property {(url: string, dataDir: string) => Promise<boolean> | boolean} openWindow
 * @property {(url: string) => void} openFallbackBrowser
 */
