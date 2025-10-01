const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { rateLimiter } = require('../middleware/rateLimiter');
const jwtGuard = require('../middleware/jwtGuard');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

// GET /api/v1/admin/audit-logs
router.get('/api/v1/admin/audit-logs', jwtGuard, async (req,res)=>{
  try{
    const limit = Math.min(parseInt(req.query.limit || '50',10), 200);
    const offset = parseInt(req.query.offset || '0',10);
    const filters = {};
    if(req.query.userId){ filters.userId = req.query.userId; }
    if(req.query.status){ filters.status = parseInt(req.query.status,10); }
    if(req.query.from || req.query.to){
      filters.createdAt = {};
      if(req.query.from) filters.createdAt.gte = new Date(req.query.from);
      if(req.query.to) filters.createdAt.lte = new Date(req.query.to);
    }
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: filters,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where: filters })
    ]);
    if(req.query.format === 'csv'){
      const parser = new Parser();
      const csv = parser.parse(items);
      res.header('Content-Type','text/csv');
      return res.attachment('audit-logs.csv').send(csv);
    }
    if(req.query.format === 'json'){
      return res.json(items);
    }
    if(req.query.format === 'xlsx'){
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('AuditLogs');
      if(items.length){
        ws.columns = Object.keys(items[0]).map(k => ({ header:k, key:k }));
        items.forEach(it=>ws.addRow(it));
      }
      res.header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment('audit-logs.xlsx');
      await wb.xlsx.write(res);
      return;
    }
    res.json({ total, limit, offset, items });
  }catch(err){
    console.error('admin audit logs error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;

const crypto = require('crypto');

// In-memory throttle map: per key (user or ip) max 5 exports / 10 min
const throttleMap = new Map();
function throttleKey(req){
  return (req.user?.id || req.headers['x-user-id'] || req.ip || 'anon').toString();
}
function allowExport(req){
  const key = throttleKey(req);
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const max = 5;
  const arr = throttleMap.get(key)?.filter(t=> now - t < windowMs) || [];
  if(arr.length >= max) return false;
  arr.push(now); throttleMap.set(key, arr);
  return true;
}
function signPayload(obj, secret){
  const data = Buffer.from(JSON.stringify(obj)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return data + "." + sig;
}
function verifyToken(token, secret){
  const [data, sig] = token.split('.');
  const calc = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (sig !== calc) return null;
  const obj = JSON.parse(Buffer.from(data,'base64url').toString('utf8'));
  if (obj.exp && Date.now() > obj.exp) return null;
  return obj;
}

// GET /api/v1/admin/audit-logs/export-signed?format=csv|json|xlsx&ttl=300
router.get('/api/v1/admin/audit-logs/export-signed', rateLimiter('adminExport'), jwtGuard, async (req,res)=>{
  try{
    if(!allowExport(req)) return res.status(429).json({ error:'Too Many Requests' });
    const format = (req.query.format || 'csv').toLowerCase();
    if(!['csv','json','xlsx'].includes(format)) return res.status(400).json({ error:'Invalid format' });
    const ttlSec = Math.min(parseInt(req.query.ttl || '300',10), 3600);
    const token = signPayload({
      format,
      q: {
        userId: req.query.userId || null,
        status: req.query.status ? parseInt(req.query.status,10) : null,
        from: req.query.from || null,
        to: req.query.to || null
      },
      exp: Date.now() + ttlSec*1000
    }, process.env.EXPORT_SIGNING_SECRET || 'export_dev');
    res.json({ url: `/api/v1/admin/audit-logs/export-download?token=${token}`, expiresIn: ttlSec });
  }catch(e){
    console.error(e); res.status(500).json({ error:'Internal error' });
  }
});

// GET /api/v1/admin/audit-logs/export-download?token=...
router.get('/api/v1/admin/audit-logs/export-download', async (req,res)=>{
  try{
    const token = req.query.token;
    const fileToken = req.query.fileToken;
    if(fileToken){
      try{
        const obj = JSON.parse(Buffer.from(fileToken,'base64url').toString('utf8'));
        if(obj.exp && Date.now()>obj.exp) return res.status(403).json({ error:'Expired link' });
        const path = require('path'); const fs = require('fs');
        const filePath = require('path').join(process.cwd(), 'storage','exports', obj.file);
        if(!fs.existsSync(filePath)) return res.status(404).json({ error:'File not ready' });
        const ext = path.extname(filePath).slice(1);
        const name = 'audit-logs.'+ext;
        if(ext==='csv') res.header('Content-Type','text/csv');
        if(ext==='json') res.header('Content-Type','application/json');
        if(ext==='xlsx') res.header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.attachment(name).send(fs.readFileSync(filePath));
      }catch(e){ return res.status(400).json({ error:'Bad file token' }); }
    }
    const secret = process.env.EXPORT_SIGNING_SECRET || 'export_dev';
    const payload = verifyToken(token, secret);
    if(!payload) return res.status(403).json({ error:'Invalid or expired token' });
    // reuse existing export logic
    req.query = { ...(payload.q||{}), format: payload.format || 'csv', limit: '200', offset: '0' };
    // call original handler body by reusing function: we duplicate minimal logic to avoid refactor
    const limit = Math.min(parseInt(req.query.limit || '50',10), 200);
    const offset = parseInt(req.query.offset || '0',10);
    const filters = {};
    if(req.query.userId){ filters.userId = req.query.userId; }
    if(req.query.status){ filters.status = parseInt(req.query.status,10); }
    if(req.query.from || req.query.to){
      filters.createdAt = {};
      if(req.query.from) filters.createdAt.gte = new Date(req.query.from);
      if(req.query.to) filters.createdAt.lte = new Date(req.query.to);
    }
    const items = await prisma.auditLog.findMany({
      where: filters,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    if(req.query.format === 'csv'){
      const parser = new Parser();
      const csv = parser.parse(items);
      res.header('Content-Type','text/csv');
      return res.attachment('audit-logs.csv').send(csv);
    }
    if(req.query.format === 'json'){
      return res.json(items);
    }
    if(req.query.format === 'xlsx'){
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('AuditLogs');
      if(items.length){
        ws.columns = Object.keys(items[0]).map(k => ({ header:k, key:k }));
        items.forEach(it=>ws.addRow(it));
      }
      res.header('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment('audit-logs.xlsx');
      await wb.xlsx.write(res);
      return;
    }
    res.json(items);
  }catch(e){
    console.error(e); res.status(500).json({ error:'Internal error' });
  }
});

const { exportQueue } = require('../queues/exportQueue');

// POST /api/v1/admin/audit-logs/export-request
router.post('/api/v1/admin/audit-logs/export-request', rateLimiter('adminExport'), jwtGuard, async (req,res)=>{
  try{
    const format = (req.body?.format || 'csv').toLowerCase();
    if(!['csv','json','xlsx'].includes(format)) return res.status(400).json({ error:'Invalid format' });
    const q = {
      userId: req.body?.userId || null,
      status: req.body?.status || null,
      from: req.body?.from || null,
      to: req.body?.to || null
    };
    const job = await exportQueue.add('export', { format, q });
    return res.status(202).json({ jobId: job.id });
  }catch(e){
    console.error(e); res.status(500).json({ error:'Internal error' });
  }
});

// GET /api/v1/admin/audit-logs/export-status/:id
router.get('/api/v1/admin/audit-logs/export-status/:id', rateLimiter('adminExport'), jwtGuard, async (req,res)=>{
  try{
    const id = req.params.id;
    const { Queue } = require('bullmq');
    const { connection } = require('../queues/exportQueue');
    const q = new Queue('audit-export', connection);
    const job = await q.getJob(id);
    if(!job) return res.status(404).json({ error:'Not found' });
    const state = await job.getState();
    const result = job.returnvalue || null;
    let downloadUrl = null;
    if(state === 'completed' && result?.fileId){
      // signed link via existing export-download with file param
      const fileToken = Buffer.from(JSON.stringify({ file: result.fileId, exp: Date.now()+ (15*60*1000) })).toString('base64url');
      downloadUrl = `/api/v1/admin/audit-logs/export-download?fileToken=${fileToken}`;
    }
    res.json({ state, downloadUrl });
  }catch(e){
    console.error(e); res.status(500).json({ error:'Internal error' });
  }
});

router.get('/api/v1/admin/audit-logs/insights', jwtGuard, async (req,res)=>{
  try{
    const limit = Math.min(parseInt(req.query.limit || '1000',10), 5000);
    const filters = {};
    if(req.query.userId) filters.userId = req.query.userId;
    if(req.query.status) filters.status = parseInt(req.query.status,10);
    if(req.query.from || req.query.to){
      filters.createdAt = {};
      if(req.query.from) filters.createdAt.gte = new Date(req.query.from);
      if(req.query.to) filters.createdAt.lte = new Date(req.query.to);
    }
    const logs = await prisma.auditLog.findMany({ where: filters, take: limit, orderBy: { createdAt: 'desc' } });
    const provider = process.env.AI_PROVIDER_URL || null;
    const key = process.env.AI_API_KEY || null;
    const { externalInsights, heuristicInsights } = require('../services/insights');
    let result;
    if(provider){
      try{ result = await externalInsights(provider, key, logs); }
      catch(e){ result = heuristicInsights(logs); }
    }else{
      result = heuristicInsights(logs);
    }
    res.json({ count: logs.length, ...result });
  }catch(e){
    console.error(e); res.status(500).json({ error:'Internal error' });
  }
});

router.get('/api/v1/admin/features', jwtGuard, (req,res)=>{
  res.json({
    ASYNC_EXPORT: process.env.FEATURE_ASYNC_EXPORT !== 'false',
    AI_INSIGHTS: process.env.FEATURE_AI_INSIGHTS !== 'false',
    OTEL_METRICS: process.env.FEATURE_OTEL_METRICS !== 'false'
  });
});

router.get('/api/v1/health/security', (req,res)=>{
  const flags = {
    FEATURE_CSP: process.env.FEATURE_CSP !== 'false',
    FEATURE_CSP_STRICT: process.env.FEATURE_CSP_STRICT !== 'false',
    FEATURE_CSP_NONCE: process.env.FEATURE_CSP_NONCE !== 'false',
    CSP_REPORT_ONLY: process.env.CSP_REPORT_ONLY === 'true',
    TRUST_PROXY: process.env.TRUST_PROXY === 'true',
    FORCE_HTTPS: process.env.FORCE_HTTPS === 'true',
    ENABLE_HSTS: process.env.ENABLE_HSTS !== 'false'
  };
  const hdrs = {};
  ['content-security-policy','content-security-policy-report-only','strict-transport-security','x-content-type-options','referrer-policy','cross-origin-resource-policy'].forEach(h=>{
    const v = res.getHeader(h);
    if (v) hdrs[h] = v;
  });
  res.json({ flags, headers: hdrs });
});
