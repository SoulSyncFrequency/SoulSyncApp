const limits = {
  global: { windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000',10), max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '100',10) },
  adminExport: { windowMs: parseInt(process.env.RATE_LIMIT_EXPORT_WINDOW_MS || '60000',10), max: parseInt(process.env.RATE_LIMIT_EXPORT_MAX || '20',10) }
};
const buckets = new Map();
function allow(key, cfg){
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter(t => now - t < cfg.windowMs);
  if(arr.length >= cfg.max) return false;
  arr.push(now); buckets.set(key, arr);
  return true;
}
function rateLimiter(name){
  const cfg = limits[name] || limits.global;
  return function(req,res,next){
    if(process.env.FEATURE_RATE_LIMIT === 'false') return next();
    const k = (req.user?.id || req.ip || 'anon') + ':' + name;
    if(!allow(k, cfg)) return res.status(429).json({ error:'Too Many Requests' });
    next();
  };
}
module.exports = { rateLimiter };
