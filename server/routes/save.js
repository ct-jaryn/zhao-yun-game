const express = require('express');
const router = express.Router();
const service = require('../services/saveService');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  res.json(service.download(req.userId));
});

router.post('/upload', authMiddleware, (req, res) => {
  const { saveData } = req.body || {};
  if (!saveData || typeof saveData !== 'object') {
    return res.status(400).json({ success: false, message: '缺少存档数据' });
  }
  res.json(service.upload(req.userId, saveData));
});

module.exports = router;
