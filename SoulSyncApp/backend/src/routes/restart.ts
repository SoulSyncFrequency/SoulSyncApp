import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination';
const router = Router();
// stub route (no-op)
router.get('/__stub_'+Math.random().toString(36).slice(2), (_req,res)=>res.json({ok:true}));
export default router;
