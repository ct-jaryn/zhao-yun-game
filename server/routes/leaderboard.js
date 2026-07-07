const express = require('express');
const router = express.Router();
const service = require('../services/leaderboardService');
const { optionalAuthMiddleware } = require('../middleware/auth');

function ok(res, data) {
  return res.json({ success: true, data });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

router.get('/', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    return ok(res, service.getList(limit));
  } catch (err) {
    next(err);
  }
});

router.post('/', optionalAuthMiddleware, (req, res, next) => {
  try {
    const record = req.body || {};
    if (typeof record.score !== 'number' || Number.isNaN(record.score)) {
      return fail(res, 400, '缺少有效成绩信息');
    }

    const sanitized = {
      score: Number(record.score) || 0,
      kills: Number(record.kills) || 0,
      wave: Number(record.wave) || 1,
      level: Number(record.level) || 1,
      time: Number(record.time) || 0
    };

    if (req.userId) {
      sanitized.userId = req.userId;
      sanitized.username = req.username;
      sanitized.name = req.username;
    } else {
      sanitized.name = String(record.name || '无名英雄').slice(0, 20);
    }

    const entry = service.addRecord(sanitized);
    if (!entry) {
      return fail(res, 500, '保存排行榜记录失败');
    }
    return ok(res, entry);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
