const LOG_API = 'http://localhost:4000/api/log';

const levels = ['debug', 'info', 'warn', 'error'];

function sendLog(level, message, meta = {}) {
  if (levels.indexOf(level) >= levels.indexOf('warn')) {
    fetch(LOG_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, meta, timestamp: new Date().toISOString() }),
    }).catch(() => {});
  }

  const prefix = `[${level.toUpperCase()}]`;
  if (level === 'error') {
    console.error(prefix, message, meta);
  } else if (level === 'warn') {
    console.warn(prefix, message, meta);
  } else {
    console.log(prefix, message, meta);
  }
}

export const logger = {
  debug: (msg, meta) => sendLog('debug', msg, meta),
  info: (msg, meta) => sendLog('info', msg, meta),
  warn: (msg, meta) => sendLog('warn', msg, meta),
  error: (msg, meta) => sendLog('error', msg, meta),
};
