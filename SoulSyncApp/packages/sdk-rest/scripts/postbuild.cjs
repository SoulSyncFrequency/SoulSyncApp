const fs = require('fs'); const path = require('path');
const dist = path.join(__dirname,'..','dist'); if(!fs.existsSync(dist)) fs.mkdirSync(dist);
if (fs.existsSync(path.join(__dirname,'..','src','index.ts'))) {
  fs.copyFileSync(path.join(__dirname,'..','src','index.ts'), path.join(dist,'index.d.ts'));
}
