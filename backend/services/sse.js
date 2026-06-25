import db from '../db.js';

const clients = new Map();

export const addClient = (userId, res) => {
    if (!clients.has(userId)) clients.set(userId, new Set([res]));

    clients.get(userId).add(res);

    res.on('close', () => {
        clients.get(userId)?.delete(res);
        if(clients.get(userId)?.size === 0) clients.delete(userId);
    });
};

export const sendToUser = (userId, event, data) => {
  const userClients = clients.get(userId);
  if (!userClients) return;
  for (const res of userClients) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

export const broadcast = (event, data) => {
  for (const [, userClients] of clients) {
    for (const res of userClients) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  }
}

export const sendToTeacher = (roomId, event, data) => {
    const room = db.prepare(`
        SELECT teacher_id
        FROM rooms
        WHERE id = ?;
    `).get(roomId);

    if (!room) return;
    sendToUser(room.teacher_id, event, data);
}

