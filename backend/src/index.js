const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { PORT, MONGODB_URI } = require('./config');
const chatRoutes = require('./routes/chat');
const logsRoutes = require('./routes/logs');
const dashboardRoutes = require('./routes/dashboard');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./services/logger');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', chatRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

mongoose
  .connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('MongoDB connection failed', { error: err.message });
    process.exit(1);
  });
