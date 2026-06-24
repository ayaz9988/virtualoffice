import { logger } from './logger';
import { useAuth } from './store/auth';

const API = 'http://localhost:4000/api';

async function request(method, path, body) {
  const token = useAuth.getState().token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = res.status === 204 ? null : await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || 'Request failed');
    return data;
  } catch (err) {
    logger.error(`${method} ${path} failed`, { error: err.message });
    throw err;
  }
}

// Auth
export function register(name, email, password, role) {
  return request('POST', '/auth/register', { name, email, password, role });
}

export function login(email, password) {
  return request('POST', '/auth/login', { email, password });
}

export function getMe() {
  return request('GET', '/auth/me');
}

// Rooms
export function getOpenRooms() {
  return request('GET', '/rooms');
}

export function getMyRoom() {
  return request('GET', '/rooms/mine');
}

export function createRoom() {
  return request('POST', '/rooms');
}

export function updateRoom(id, data) {
  return request('PATCH', `/rooms/${id}`, data);
}

export function deleteRoom(id) {
  return request('DELETE', `/rooms/${id}`);
}

// Waiting
export function joinWaitingRoom(roomId, note) {
  return request('POST', `/rooms/${roomId}/wait`, { note });
}

export function getWaitingQueue(roomId) {
  return request('GET', `/rooms/${roomId}/waiting`);
}

export function admitStudent(waitingId) {
  return request('PATCH', `/waiting/${waitingId}/admit`);
}

export function declineStudent(waitingId) {
  return request('PATCH', `/waiting/${waitingId}/decline`);
}

export function getMyWaitingStatus(roomId) {
  return request('GET', `/waiting/mine?room_id=${roomId}`);
}

// Zoom
export function getZoomSignature(meetingNumber, role) {
  return request('GET', `/zoom/signature?meetingNumber=${meetingNumber}&role=${role}`);
}
