const crypto = require('crypto');

function genNonce(len=16){
  return crypto.randomBytes(len).toString('base64');
}

function cspNonce(req,res,next){
  res.locals.cspNonce = genNonce(16);
  next();
}

// Build CSP string with dynamic nonce
function buildCsp(req,res){
  const strict = (process.env.FEATURE_CSP_STRICT||'true') !== 'false';
  const reportOnly = (process.env.CSP_REPORT_ONLY||'true') === 'true';
  const reportUri = process.env.CSP_REPORT_URI || '/api/v1/csp-report';
  const nonce = res.locals.cspNonce;
  const base = [
    `default-src 'self'`,
    `img-src 'self' data: blob:`,
    strict ? `script-src 'self' 'nonce-${nonce}'` : `script-src 'self' 'unsafe-inline'`,
    strict ? `style-src 'self' 'nonce-${nonce}'` : `style-src 'self' 'unsafe-inline'`,
    `connect-src 'self' http: https:`,
    `font-src 'self' data:`,
  ];
  if (reportUri) base.push(`report-uri ${reportUri}`);
  return { header: reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', value: base.join('; ') };
}

function cspHeader(req,res,next){
  if ((process.env.FEATURE_CSP||'true') === 'false') return next();
  if ((process.env.FEATURE_CSP_NONCE||'true') === 'true'){
    const { header, value } = buildCsp(req,res);
    res.setHeader(header, value);
  }
  next();
}

module.exports = { cspNonce, cspHeader };
