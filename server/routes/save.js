const express = require('express');
const router = express.Router();
const service = require('../services/saveService');
const { authMiddleware } = require('../middleware/auth');

function ok(res, data) {
  return res.json({ success: true, ...data });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

router.get('/', authMiddleware, (req, res, next) => {
  try {
    const result = service.download(req.userId);
    if (!result.success) {
      return fail(res, 404, result.message);
    }
    return ok(res, { data: result.data });
  } catch (err) {
    next(err);
  }
});

router.post('/upload', authMiddleware, (req, res, next) => {
  try {
    const { saveData } = req.body || {};
    if (!saveData || typeof saveData !== 'object' || Array.isArray(saveData)) {
      return fail(res, 400, '缺少有效存档数据');
    }
    const result = service.upload(req.userId, saveData);
    if (!result.success) {
      return fail(res, 400, result.message);
    }
    return ok(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
