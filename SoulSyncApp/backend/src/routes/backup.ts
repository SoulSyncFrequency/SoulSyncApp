import { Router } from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import unzipper from 'unzipper';
const router = Router();

const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

router.post('/admin/backup', async (_req, res) => {
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  const file = path.join(BACKUP_DIR, `backup-${stamp}.zip`);
  const output = fs.createWriteStream(file);
  const archive = archiver('zip');

  archive.pipe(output);
  ['.env','package.json'].forEach(f=>{ if(fs.existsSync(f)) archive.file(f,{name:f}); });
  archive.glob('backend/src/**/*.ts');
  archive.glob('frontend/src/**/*.tsx');
  archive.finalize();

  output.on('close',()=>{
    res.json({ url: `/backups/backup-${stamp}.zip` });
  });
});

const upload = multer({ dest: 'uploads/' });
router.post('/admin/restore', upload.single('file'), async (req,res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const zipPath = req.file.path;
  fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: process.cwd() }))
    .on('close',()=>{
      res.json({ restored: true });
      setTimeout(()=>process.exit(0), 2000);
    });
});

export default router;
