const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const leaderboardRouter = require('./routes/leaderboard');
const saveRouter = require('./routes/save');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, '..', 'client', 'dist');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// CORS：生产环境应配置具体白名单
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// 安全响应头
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"]
    }
  }
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.static(CLIENT_DIR));

// 速率限制：认证接口更严格
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '请求过于频繁，请稍后再试' }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '请求过于频繁，请稍后再试' }
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/leaderboard', apiLimiter, leaderboardRouter);
app.use('/api/save', apiLimiter, saveRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: Date.now() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[server] 未捕获异常:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

const server = app.listen(PORT, () => {
  console.log(`🎮 赵云传服务端已启动: http://localhost:${PORT}`);
});

// 优雅关闭
function gracefulShutdown(signal) {
  console.log(`[server] 收到 ${signal}，正在优雅关闭...`);
  server.close(() => {
    console.log('[server] 已停止接收新连接');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
