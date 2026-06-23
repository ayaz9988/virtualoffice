import { logger } from './logger';

const API = 'http://localhost:4000/api';

async function request(method, path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (err) {
    logger.error(`${method} ${path} failed`, { error: err.message });
    throw err;
  }
}

export function register(name, email, password) {
  return request('POST', '/auth/register', { name, email, password });
}

export function login(email, password) {
  return request('POST', '/auth/login', { email, password });
}
