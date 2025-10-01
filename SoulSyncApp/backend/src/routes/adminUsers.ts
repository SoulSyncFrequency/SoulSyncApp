import { addNotification } from '../services/notifyService';
import { Router } from 'express';
import { prisma } from '../db';
import { requireRole } from '../middleware/auth';

const router = Router();
router.use(requireRole('ADMIN'));

// Get all users
router.get('/admin/users', async (req,res)=>{
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users);
});

// Change role
router.post('/admin/users/:id/role', async (req,res)=>{
  const id = Number(req.params.id);
  const { role } = req.body;
  const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
const target = await prisma.user.findUnique({ where: { id } });
if(admins<=1 && target?.role==='ADMIN'){
  return res.status(400).json({error:'Cannot remove the only ADMIN'});
}

  const user = await prisma.user.update({ where: { id }, data: { role } }); try{ await addNotification({ type:'USER_ROLE_CHANGED', message:`User ${id} role -> ${role}`, meta:{ url:'/admin/users' } }); }catch{}
  res.json(user);
  try{ await addNotification({ type:'USER_DEACTIVATED', message:`User ${id} deactivated`, meta:{ url:'/admin/users' } }); }catch{}
});

// Deactivate
router.post('/admin/users/:id/deactivate', async (req,res)=>{
  const id = Number(req.params.id);
  const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
const target = await prisma.user.findUnique({ where: { id } });
if(admins<=1 && target?.role==='ADMIN'){
  return res.status(400).json({error:'Cannot remove the only ADMIN'});
}

  const user = await prisma.user.update({ where: { id }, data: { active: false } });
  res.json(user);
  try{ await addNotification({ type:'USER_DEACTIVATED', message:`User ${id} deactivated`, meta:{ url:'/admin/users' } }); }catch{}
});

// Delete
router.delete('/admin/users/:id', async (req,res)=>{
  const id = Number(req.params.id);
  const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
const target = await prisma.user.findUnique({ where: { id } });
if(admins<=1 && target?.role==='ADMIN'){
  return res.status(400).json({error:'Cannot remove the only ADMIN'});
}

  await prisma.user.delete({ where: { id } }); try{ await addNotification({ type:'USER_DELETED', message:`User ${id} deleted`, meta:{ url:'/admin/users' } }); }catch{}
  res.json({ok:true});
});

// Impersonate
router.post('/admin/users/:id/impersonate', async (req,res)=>{
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if(!user) return res.status(404).json({error:'User not found'});
  // very simplified: return user payload; frontend should set as session
  res.json({token: `impersonate-${user.id}`, user});
});

export default router;
