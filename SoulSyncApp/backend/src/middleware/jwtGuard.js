const jwt = require('jsonwebtoken');
let jwksClient;
if(process.env.ADMIN_JWT_JWKS_URL){
  jwksClient = require('jwks-rsa')({ jwksUri: process.env.ADMIN_JWT_JWKS_URL });
}

function getKey(header, callback){
  if(!jwksClient) return callback(new Error('No JWKS client'));
  jwksClient.getSigningKey(header.kid, function(err, key){
    if(err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const jwt = require('jsonwebtoken');

module.exports = function jwtGuard(req,res,next){
  const auth = req.headers['authorization'];
  if(auth && auth.startsWith('Bearer ')){
    const token = auth.slice(7);
    try{
      const decoded = (() => { const keys = (process.env.ADMIN_JWT_KEYS || process.env.ADMIN_JWT_SECRET || 'changeme').split(',').map(s=>s.trim()).filter(Boolean); (() => { if(jwksClient){ let out=null; jwt.verify(token, getKey, { algorithms:['RS256'] }, (err, decoded)=>{ if(!err) out=decoded; }); if(out) return out; } const keys = (process.env.ADMIN_JWT_KEYS || process.env.ADMIN_JWT_SECRET || 'changeme').split(',').map(s=>s.trim()).filter(Boolean); let ok=null; for(const k of keys){ try { ok = jwt.verify(token, k); break; } catch(_){} } if(!ok) throw new Error('verify failed'); return ok; })();
      if(decoded.role && decoded.role === 'admin'){
        req.user = decoded;
        return next();
      }
    }catch(e){
      return res.status(403).json({ error:'Invalid token'});
    }
  }
  // fallback
  try {
    const adminGuard = require('./adminGuard');
    return adminGuard(req,res,next);
  } catch(_e){
    return res.status(403).json({ error:'Forbidden'});
  }
};
