import { spawn } from 'child_process';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function findAvailablePort(start = 5177) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(start, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        findAvailablePort(start + 1).then(resolve, reject);
      } else {
        reject(err);
      }
    });
  });
}

function waitForServer(url, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(url, { timeout: 2000 }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error(`Server ${url} did not start within ${timeout}ms`));
        return;
      }
      setTimeout(check, 500);
    };
    check();
  });
}

export default async function setup() {
  const port = await findAvailablePort(5177);
  const baseUrl = `http://localhost:${port}/`;
  process.env.TEST_BASE_URL = baseUrl;

  const server = spawn('npx', ['vite', 'preview', '--port', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: true
  });

  // Expose to global teardown via globalThis.
  globalThis.__VITE_PREVIEW_SERVER__ = server;
  globalThis.__TEST_BASE_URL__ = baseUrl;

  await waitForServer(baseUrl);
  console.log(`[global-setup] vite preview ready at ${baseUrl}`);
}
