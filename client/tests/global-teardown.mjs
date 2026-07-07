import { exec } from 'child_process';

function killProcessTree(pid) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`taskkill /F /T /PID ${pid}`, () => {
        setTimeout(resolve, 2000);
      });
    } else {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (e) {}
      setTimeout(() => {
        try {
          process.kill(pid, 'SIGKILL');
        } catch (e) {}
        setTimeout(resolve, 1000);
      }, 2000);
    }
  });
}

export default async function teardown() {
  const server = globalThis.__VITE_PREVIEW_SERVER__;
  if (server) {
    console.log('[global-teardown] stopping vite preview server...');
    await killProcessTree(server.pid);
  }
}
