const express = require('express');
const router = express.Router();
const service = require('../services/leaderboardService');
const { optionalAuthMiddleware } = require('../middleware/auth');

router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  res.json({ success: true, data: service.getList(limit) });
});

router.post('/', optionalAuthMiddleware, (req, res) => {
  const record = req.body || {};
  if (typeof record.score !== 'number') {
    return res.status(400).json({ success: false, message: '缺少有效成绩信息' });
  }
  if (req.userId) {
    record.userId = req.userId;
    record.username = req.username;
  }
  const entry = service.addRecord(record);
  res.json({ success: true, data: entry });
});

module.exports = router;
