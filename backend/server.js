import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from './logger.js';
import authRoutes from './routes/auth.js';
import roomsRouter from './routes/rooms.js';
import waitingRouter from './routes/waiting.js';
import zoomRouter from './routes/zoom-endpoint.js'
import eventRouter from './routes/events.js';
import errorHandler from './middleware/errorHandler.js';
import 'express-async-errors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH,OPTIONS');
  if (_req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRouter);
app.use('/api/waiting', waitingRouter);
app.use('/api/zoom', zoomRouter);
app.use('/api/events', eventRouter);

app.post('/api/log', (req, res) => {
  const { level, message, meta } = req.body;
  if (level && message) {
    logger.log(level, `[CLIENT] ${message}`, meta);
  }
  res.status(200).end();
});

const distPath = path.join(__dirname, '..', 'frontend', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ message: 'Virtual Office API' });
  });
}

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
