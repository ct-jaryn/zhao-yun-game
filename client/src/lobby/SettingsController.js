import { escapeHtml } from '../utils/html.js';
import { Toast } from './Toast.js';

export class SettingsController {
  constructor(save, cloudSaveController) {
    this.save = save;
    this.cloudSaveController = cloudSaveController;
    this._bindSettingsButton();
  }

  _bindSettingsButton() {
    const btn = document.getElementById('lobbySettingsBtn');
    if (btn) {
      btn.addEventListener('click', () => this.open());
    }
  }

  open() {
    this._close();
    const settings = this.save.settings || {};
    const dialog = document.createElement('div');
    dialog.className = 'lobby-dialog';
    dialog.id = 'lobbySettingsDialog';
    dialog.innerHTML = `
      <div class="lobby-dialog-card settings-card">
        <h3>设置</h3>
        <div class="settings-body">
          <div class="setting-row">
            <label>音乐音量</label>
            <input type="range" id="settingMusicVolume" min="0" max="1" step="0.1" value="${settings.musicVolume ?? 0.7}">
            <span id="settingMusicVolumeValue">${Math.round((settings.musicVolume ?? 0.7) * 100)}%</span>
          </div>
          <div class="setting-row">
            <label>音效音量</label>
            <input type="range" id="settingSfxVolume" min="0" max="1" step="0.1" value="${settings.sfxVolume ?? 0.8}">
            <span id="settingSfxVolumeValue">${Math.round((settings.sfxVolume ?? 0.8) * 100)}%</span>
          </div>
          <div class="setting-row">
            <label>屏幕震动</label>
            <input type="checkbox" id="settingScreenShake" ${settings.screenShake !== false ? 'checked' : ''}>
          </div>
          <div class="setting-row">
            <label>显示伤害数字</label>
            <input type="checkbox" id="settingShowDamageNumbers" ${settings.showDamageNumbers !== false ? 'checked' : ''}>
          </div>
          <div class="setting-row">
            <label>语言</label>
            <select id="settingLanguage">
              <option value="zh-CN" ${settings.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
              <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>English</option>
            </select>
          </div>
          <div class="setting-row save-code-row">
            <label>存档码</label>
            <textarea id="settingSaveCode" rows="3" readonly>${escapeHtml(this.save.exportToString())}</textarea>
            <div class="save-code-actions">
              <button class="btn" id="settingExportBtn">复制存档码</button>
              <button class="btn" id="settingImportBtn">导入存档码</button>
            </div>
          </div>
          <div class="setting-row save-code-row">
            <label>云存档（与当前账号绑定）</label>
            <div class="save-code-actions">
              <button class="btn" id="settingCloudUpload">上传存档</button>
              <button class="btn" id="settingCloudDownload">下载存档</button>
            </div>
          </div>
        </div>
        <div class="lobby-dialog-actions">
          <button class="btn btn-danger" id="settingResetBtn">重置存档</button>
          <button class="btn btn-primary" id="settingConfirmBtn">保存</button>
          <button class="btn" id="settingCancelBtn">取消</button>
        </div>
      </div>
    `;

    document.getElementById('lobbyScreen').appendChild(dialog);

    // 滑块实时显示百分比
    dialog.querySelector('#settingMusicVolume').addEventListener('input', (e) => {
      dialog.querySelector('#settingMusicVolumeValue').textContent = Math.round(e.target.value * 100) + '%';
    });
    dialog.querySelector('#settingSfxVolume').addEventListener('input', (e) => {
      dialog.querySelector('#settingSfxVolumeValue').textContent = Math.round(e.target.value * 100) + '%';
    });

    dialog.querySelector('#settingExportBtn').addEventListener('click', () => {
      const code = this.save.exportToString();
      navigator.clipboard.writeText(code).then(() => Toast.show('存档码已复制到剪贴板', 'success')).catch(() => Toast.show('复制失败', 'error'));
    });
    dialog.querySelector('#settingImportBtn').addEventListener('click', () => {
      const code = prompt('请粘贴存档码：');
      if (!code) return;
      if (this.save.importFromString(code)) {
        Toast.show('导入成功，页面将刷新', 'success');
        location.reload();
      } else {
        Toast.show('导入失败，请检查存档码', 'error');
      }
    });
    dialog.querySelector('#settingResetBtn').addEventListener('click', () => {
      const ok = confirm('确定要重置所有存档吗？此操作不可恢复。');
      if (ok) {
        this.save.resetAll();
        location.reload();
      }
    });
    dialog.querySelector('#settingCloudUpload').addEventListener('click', () => this.cloudSaveController.upload());
    dialog.querySelector('#settingCloudDownload').addEventListener('click', () => this.cloudSaveController.download());
    dialog.querySelector('#settingConfirmBtn').addEventListener('click', () => this._save(dialog));
    dialog.querySelector('#settingCancelBtn').addEventListener('click', () => this._close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) this._close();
    });
  }

  _close() {
    const dialog = document.getElementById('lobbySettingsDialog');
    if (dialog) dialog.remove();
  }

  _save(dialog) {
    this.save.settings.musicVolume = parseFloat(dialog.querySelector('#settingMusicVolume').value);
    this.save.settings.sfxVolume = parseFloat(dialog.querySelector('#settingSfxVolume').value);
    this.save.settings.screenShake = dialog.querySelector('#settingScreenShake').checked;
    this.save.settings.showDamageNumbers = dialog.querySelector('#settingShowDamageNumbers').checked;
    this.save.settings.language = dialog.querySelector('#settingLanguage').value;
    this.save.persist();
    this._close();
  }
}
