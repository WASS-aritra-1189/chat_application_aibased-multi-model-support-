const logger = require('../services/logger');

function errorHandler(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.path });
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
