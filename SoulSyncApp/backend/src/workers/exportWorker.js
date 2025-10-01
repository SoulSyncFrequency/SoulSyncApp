const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { connection } = require('../queues/exportQueue');
const prisma = new PrismaClient();

const outDir = process.env.EXPORT_DIR || path.join(process.cwd(), 'storage', 'exports');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function doExport(job){
  const { format, q } = job.data;
  const filters = {};
  if(q.userId) filters.userId = q.userId;
  if(q.status) filters.status = parseInt(q.status,10);
  if(q.from || q.to){
    filters.createdAt = {};
    if(q.from) filters.createdAt.gte = new Date(q.from);
    if(q.to) filters.createdAt.lte = new Date(q.to);
  }
  const items = await prisma.auditLog.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' }
  });
  const fileId = `${job.id}.${format}`;
  const filePath = path.join(outDir, fileId);
  if(format === 'csv'){
    const parser = new Parser();
    fs.writeFileSync(filePath, parser.parse(items), 'utf8');
  }else if(format === 'json'){
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
  }else if(format === 'xlsx'){
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('AuditLogs');
    if(items.length){
      ws.columns = Object.keys(items[0]).map(k => ({ header:k, key:k }));
      items.forEach(it=>ws.addRow(it));
    }
    await wb.xlsx.writeFile(filePath);
  }
  return { fileId };
}

new Worker('audit-export', doExport, connection);
console.log('Export worker started');
