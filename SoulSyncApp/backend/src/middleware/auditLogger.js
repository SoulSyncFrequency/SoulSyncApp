const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditLogger(req,res,next){
  const start=Date.now();
  res.on('finish', async ()=>{
    try {
      if(req.path.startsWith('/api/v1/therapy') || req.path.startsWith('/api/v1/nutrition')){
        const userId=req.user?.id || req.headers['x-user-id'] || 'anonymous';
        await prisma.auditLog.create({
          data:{
            traceId: req.trace_id || undefined,
            userId: String(userId),
            endpoint: req.path,
            status: res.statusCode,
          }
        });
      }
    } catch(err){ console.error('Audit log failed',err); }
  });
  next();
}
module.exports=auditLogger;
