const express = require('express');
const router = express.Router();
const service = require('../services/saveService');

router.get('/', (req, res) => {
  const save = service.getSave();
  if (!save) {
    return res.status(404).json({ success: false, message: '暂无存档' });
  }
  res.json({ success: true, data: save });
});

router.post('/', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: '存档数据无效' });
  }
  try {
    service.save(data);
    res.json({ success: true, message: '存档已保存' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
