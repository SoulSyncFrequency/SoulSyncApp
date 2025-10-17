// Basic tests to ensure admin route & OpenAPI path exist
const fs = require('fs');
const path = require('path');

test('admin route file exists', ()=>{
  const p = path.join(__dirname,'../..','src/routes/admin.js');
  expect(fs.existsSync(p)).toBe(true);
});

test('OpenAPI contains /api/v1/admin/audit-logs', ()=>{
  const spec = fs.readFileSync(path.join(__dirname,'../../openapi.yml'),'utf-8');
  expect(spec).toMatch(/\/api\/v1\/admin\/audit-logs/);
});
