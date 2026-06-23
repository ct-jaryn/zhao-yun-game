const express = require('express');
const path = require('path');
const fs = require('fs');

const leaderboardRouter = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, '..', 'client', 'dist');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.json({ limit: '1mb' }));
app.use(express.static(CLIENT_DIR));

app.use('/api/leaderboard', leaderboardRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎮 赵云传服务端已启动: http://localhost:${PORT}`);
});
