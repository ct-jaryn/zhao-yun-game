import { authManager } from '../auth/AuthManager.js';
import { Toast } from './Toast.js';

export class CloudSaveController {
  constructor(save) {
    this.save = save;
  }

  async upload() {
    if (!authManager.isLoggedIn()) {
      Toast.show('请先登录后再上传云存档', 'error');
      return;
    }
    try {
      const res = await authManager.fetchWithAuth('/api/save/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveData: this.save.toJSON() })
      });
      const json = await res.json();
      if (json.success) {
        Toast.show('云存档上传成功', 'success');
      } else {
        Toast.show('上传失败：' + json.message, 'error');
      }
    } catch (err) {
      console.error('[CloudSaveController] 云存档上传失败:', err);
      Toast.show('上传失败，请检查网络或稍后再试', 'error');
    }
  }

  async download() {
    if (!authManager.isLoggedIn()) {
      Toast.show('请先登录后再下载云存档', 'error');
      return;
    }
    try {
      const res = await authManager.fetchWithAuth('/api/save');
      const json = await res.json();
      if (json.success && json.data) {
        if (this.save.importFromString(btoa(encodeURIComponent(JSON.stringify(json.data))))) {
          this.save.persist();
          Toast.show('云存档下载成功，页面将刷新', 'success');
          location.reload();
        } else {
          Toast.show('存档解析失败', 'error');
        }
      } else {
        Toast.show('下载失败：' + json.message, 'error');
      }
    } catch (err) {
      console.error('[CloudSaveController] 云存档下载失败:', err);
      Toast.show('下载失败，请检查网络或稍后再试', 'error');
    }
  }
}
