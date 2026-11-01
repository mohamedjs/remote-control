import en from './en.json' with { type: 'json' };
import ar from './ar.json' with { type: 'json' };

const dictionaries = { en, ar };

/**
 * Resolve a nested translation key, e.g. "cli.usage".
 * @param {string} key
 * @param {string} [lang='en']
 * @param {Record<string, string>} [vars={}]
 * @returns {string}
 */
export function t(key, lang = 'en', vars = {}) {
  const dict = dictionaries[lang] || dictionaries.en;
  const parts = key.split('.');
  let current = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      current = null;
      break;
    }
  }

  let text = typeof current === 'string' ? current : key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, v);
  }
  return text;
}
