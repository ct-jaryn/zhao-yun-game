const express = require('express');
const router = express.Router();
const service = require('../services/leaderboardService');

router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  res.json({ success: true, data: service.getList(limit) });
});

router.post('/', (req, res) => {
  const record = req.body;
  if (!record || typeof record.score !== 'number') {
    return res.status(400).json({ success: false, message: '缺少有效成绩信息' });
  }
  const entry = service.addRecord(record);
  res.json({ success: true, data: entry });
});

module.exports = router;
