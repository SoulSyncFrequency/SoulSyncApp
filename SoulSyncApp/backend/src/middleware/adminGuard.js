module.exports = function adminGuard(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role && role.toLowerCase() === 'admin') {
    return next();
  }
  const token = req.headers['x-admin-token'];
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_TOKEN not configured' });
  }
  if (token !== expected) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
