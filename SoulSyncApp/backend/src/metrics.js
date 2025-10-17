// Minimal metrics using prom-client with OpenMetrics + exemplars
const client = require('prom-client');
const { context, trace } = (()=>{ try { return require('@opentelemetry/api'); } catch(e){ return { context:{ active:()=>({}) }, trace:{ getSpan:()=>null } }; }})();

client.collectDefaultMetrics();
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method','route','status_code'],
  buckets: [0.05,0.1,0.2,0.3,0.5,0.75,1,1.5,2,3,5]
});
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total count of HTTP requests',
  labelNames: ['method','route','status_code']
});

function exemplarLabels(){
  try{
    const span = trace.getSpan(context.active());
    const tid = span && span.spanContext ? span.spanContext().traceId : null;
    return tid ? { trace_id: tid } : undefined;
  }catch(e){ return undefined; }
}

function normalizeRoute(path){
  if(!path) return 'unknown';
  path = path.split('?')[0];
  path = path.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g, ':uuid');
  path = path.replace(/[0-9a-fA-F]{16,}/g, ':hex');
  path = path.replace(/\b\d+\b/g, ':id');
  path = path.replace(/\/+/, '/');
  return path.split('/').slice(0,10).join('/') || '/';
}
function safeLabel(v){ v = String(v||''); return v.length>64 ? v.slice(0,64) : v; }
function metricsMiddleware(req,res,next){

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const diff = Number(process.hrtime.bigint() - start) / 1e9;
    let route = req.route && req.route.path ? req.route.path : req.path || 'unknown';
    route = normalizeRoute(route);
    const labels = { method: safeLabel((req.method||'GET').toUpperCase()), route: safeLabel(route), status_code: safeLabel(String(res.statusCode)) };
    const ex = exemplarLabels();
    try {
      if (ex && httpRequestDuration.observeWithExemplar) {
        httpRequestDuration.observeWithExemplar(labels, diff, ex);
      } else {
        httpRequestDuration.observe(labels, diff);
      }
    } catch (_e) {
      httpRequestDuration.observe(labels, diff);
    }
    httpRequestsTotal.inc(labels);
  });
  next();
}

async function metricsHandler(req,res){
  res.set('Content-Type', client.register.contentType);
  const openmetrics = await client.register.metrics();
  res.send(openmetrics);
}

module.exports = { metricsMiddleware, metricsHandler };
