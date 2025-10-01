const { rateLimiter } = require('./middleware/rateLimiter');
const { cspNonce, cspHeader } = require('./middleware/cspNonce');
const { metricsMiddleware, metricsHandler } = require('./metrics');
require('./tracing');
// Security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
app.use(helmet());
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
}));
// Auto OpenAPI generator
const expressOasGenerator = require('express-oas-generator');
expressOasGenerator.init(app, {});

app.use('/docs', require('./routes/docs'));
app.use(require('./routes/admin'));
