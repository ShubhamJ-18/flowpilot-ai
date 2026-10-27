import { isDev } from '../config/env.js';

const SENSITIVE_PATTERNS = [/password/i, /token/i, /secret/i, /authorization/i, /cookie/i, /credential/i, /apikey/i];

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_PATTERNS.some(pat => pat.test(key));
    if (isSensitive) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info(message, meta = {}) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message, ...sanitize(meta) }));
  },
  warn(message, meta = {}) {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: 'WARN', message, ...sanitize(meta) }));
  },
  error(message, error = null, meta = {}) {
    const errorDetails = error instanceof Error ? { errorName: error.name, errorMessage: error.message, stack: isDev ? error.stack : undefined } : { error };
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', message, ...errorDetails, ...sanitize(meta) }));
  },
  debug(message, meta = {}) {
    if (isDev) {
      console.debug(JSON.stringify({ timestamp: new Date().toISOString(), level: 'DEBUG', message, ...sanitize(meta) }));
    }
  },
};
