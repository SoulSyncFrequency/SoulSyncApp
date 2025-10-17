const fs = require('fs');
const path = require('path');

test('AuditLog model exists in schema.prisma', ()=>{
  const schema=fs.readFileSync(path.join(__dirname,'../../prisma/schema.prisma'),'utf-8');
  expect(schema).toMatch(/model\s+AuditLog/);
});
