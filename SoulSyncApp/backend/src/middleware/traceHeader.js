const { context, trace } = require('@opentelemetry/api');
module.exports = function traceHeader(req,res,next){
  try{
    const span = trace.getSpan(context.active());
    const tid = span && span.spanContext ? span.spanContext().traceId : null;
    if(tid){ res.setHeader('X-Trace-Id', tid); req.trace_id = tid; }
  }catch(e){}
  next();
};
