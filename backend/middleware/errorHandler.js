import logger from '../logger.js';

export default function errorHandler(err, req, res, _next) {
  logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
}
