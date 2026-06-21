import { spawn } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      req.on('timeout', () => { req.destroy(); retry(); });
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

async function build() {
  console.log('> Running npm run build...');
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'build'], {
      cwd: __dirname,
      stdio: ['ignore', 'inherit', 'inherit'],
      shell: true
    });
    proc.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`npm run build exited with code ${code}`));
    });
  });
}

async function main() {
  const testScript = process.argv[2];
  if (!testScript) {
    console.error('Usage: node test-runner.mjs <test-script.mjs>');
    process.exit(1);
  }

  await build();

  console.log('> Starting vite preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    cwd: __dirname,
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: true
  });

  let testExitCode = 1;
  try {
    await waitForServer('http://localhost:5173/');
    console.log('> Server ready, running', testScript);

    testExitCode = await new Promise((resolve) => {
      const testProc = spawn('node', [testScript], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
      });
      testProc.on('exit', code => resolve(code ?? 1));
    });
  } finally {
    console.log('> Stopping server...');
    server.kill('SIGTERM');
    // force kill after 5s
    setTimeout(() => server.kill('SIGKILL'), 5000).unref();
  }

  process.exit(testExitCode);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
