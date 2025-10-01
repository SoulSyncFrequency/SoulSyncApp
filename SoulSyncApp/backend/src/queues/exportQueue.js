const { Queue, QueueEvents, Worker } = require('bullmq');
const path = require('path');
const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } };

const exportQueue = new Queue('audit-export', connection);
const exportEvents = new QueueEvents('audit-export', connection);

module.exports = { exportQueue, exportEvents, connection };
