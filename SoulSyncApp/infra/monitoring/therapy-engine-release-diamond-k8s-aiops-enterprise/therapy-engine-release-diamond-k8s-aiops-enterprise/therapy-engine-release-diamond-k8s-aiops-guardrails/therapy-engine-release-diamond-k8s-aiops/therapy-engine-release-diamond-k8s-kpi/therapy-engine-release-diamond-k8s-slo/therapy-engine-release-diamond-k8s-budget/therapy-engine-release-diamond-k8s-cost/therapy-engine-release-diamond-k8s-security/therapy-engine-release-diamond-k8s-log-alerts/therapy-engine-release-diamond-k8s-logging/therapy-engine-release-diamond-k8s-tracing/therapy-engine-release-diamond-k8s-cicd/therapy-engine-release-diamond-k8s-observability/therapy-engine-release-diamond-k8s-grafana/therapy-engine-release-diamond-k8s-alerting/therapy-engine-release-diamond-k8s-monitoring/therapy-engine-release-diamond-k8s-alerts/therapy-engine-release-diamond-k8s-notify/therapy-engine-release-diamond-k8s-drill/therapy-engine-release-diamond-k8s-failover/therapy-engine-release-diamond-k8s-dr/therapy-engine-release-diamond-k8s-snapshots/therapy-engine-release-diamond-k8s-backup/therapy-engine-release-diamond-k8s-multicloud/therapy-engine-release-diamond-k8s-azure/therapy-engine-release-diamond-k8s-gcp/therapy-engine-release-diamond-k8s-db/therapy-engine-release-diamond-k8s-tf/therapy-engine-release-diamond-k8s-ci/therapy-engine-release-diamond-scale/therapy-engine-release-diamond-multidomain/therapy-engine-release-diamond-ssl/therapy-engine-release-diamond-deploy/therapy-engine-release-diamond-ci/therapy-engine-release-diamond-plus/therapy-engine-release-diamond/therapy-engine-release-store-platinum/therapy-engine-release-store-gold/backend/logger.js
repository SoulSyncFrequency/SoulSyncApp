const { trace } = require('@opentelemetry/api');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

function logWithTrace(level, message, meta = {}) {
  try {
    const span = trace.getSpan(trace.context.active());
    const traceId = span ? span.spanContext().traceId : undefined;
    const base = traceId ? { traceId } : {};
    logger.log(level, { message, ...base, ...meta });
  } catch (e) {
    logger.log(level, { message, ...meta });
  }
}

module.exports = {
  info: (msg, meta) => logWithTrace('info', msg, meta),
  warn: (msg, meta) => logWithTrace('warn', msg, meta),
  error: (msg, meta) => logWithTrace('error', msg, meta)
};
