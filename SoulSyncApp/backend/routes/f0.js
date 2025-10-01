// API route for F₀ Engine v2 (SoulSync)
const express = require('express');
const router = express.Router();
const { computeF0 } = require('../services/F0Engine.v2.js');

router.post('/f0score', (req, res) => {
  try {
    const score = computeF0(req.body || {});
    return res.json({ F0_score: score });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid input', details: err.message });
  }
});

module.exports = router;
