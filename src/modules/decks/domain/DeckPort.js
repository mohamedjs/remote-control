/**
 * Pure domain types and ports for deck manifests, control execution, and intent parsing.
 * ZERO I/O.
 */

/**
 * @typedef {Object} Control
 * @property {string} id
 * @property {string} label
 * @property {string} [glyph]
 * @property {boolean} [wide]
 * @property {boolean} [repeat]
 * @property {Object} action
 * @property {string} [action.key]
 * @property {string} [action.media]
 * @property {string[]} [action.mods]
 */

/**
 * @typedef {Object} Deck
 * @property {string} id
 * @property {string} name
 * @property {string} [context]
 * @property {number} [order]
 * @property {Control[]} controls
 */

/**
 * @typedef {Object} DeckRepositoryPort
 * @property {() => Promise<Deck[]> | Deck[]} loadAll
 */

/**
 * @typedef {Object} IntentParserPort
 * @property {() => boolean} isConfigured
 * @property {(text: string, catalog: Array<{ deck: string, control: string, label: string }>) => Promise<{ ok: boolean, actions?: Array<{ deck: string, control: string, label: string }>, reason?: string }>} parseIntent
 */
