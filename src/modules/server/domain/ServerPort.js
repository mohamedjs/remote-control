/**
 * Pure domain types and ports for local server and websocket transport.
 * ZERO I/O.
 */

/**
 * @typedef {Object} ServerConfig
 * @property {number} port
 * @property {string} host
 */

/**
 * @typedef {Object} ServerStatus
 * @property {boolean} running
 * @property {string} host
 * @property {number} port
 * @property {string} localIp
 * @property {number} connectedClients
 */

/**
 * @typedef {Object} ServerPort
 * @property {(config: ServerConfig) => Promise<ServerStatus>} start
 * @property {() => Promise<void>} stop
 * @property {(payload: any) => void} broadcast
 * @property {() => ServerStatus} getStatus
 */
