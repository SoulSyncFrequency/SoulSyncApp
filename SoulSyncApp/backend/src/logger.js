const pino = require('pino');
const fs = require('fs');
const logDir = '/var/log/backend';
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const transport = pino.transport({
  targets: [
    { target: 'pino/file', options: { destination: logDir + '/app.log' } }
  ]
});
const logger = pino(transport);
module.exports = logger;

// Trace-aware child logger helper
const { context, trace } = (()=>{
  try { return require('@opentelemetry/api'); } catch(e){ return { context:{ active:()=>({}) }, trace:{ getSpan:()=>null } }; }
})();

function withTraceId(req){
  try{
    const span = trace.getSpan(context.active());
    const tid = span && span.spanContext ? span.spanContext().traceId : (req.headers['x-trace-id'] || null);
    if (tid) return logger.child({ trace_id: tid });
  }catch(e){}
  return logger;
}
module.exports.withTraceId = withTraceId;
