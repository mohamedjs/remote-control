/**
 * Pure domain types and ports for doctor and self-test diagnostics.
 * ZERO I/O.
 */

/**
 * @typedef {Object} DiagnosticItem
 * @property {string} name
 * @property {'pass' | 'fail' | 'warn'} status
 * @property {string} message
 * @property {string} [fix]
 */

/**
 * @typedef {Object} DiagnosticPort
 * @property {() => Promise<DiagnosticItem[]>} runChecks
 */
