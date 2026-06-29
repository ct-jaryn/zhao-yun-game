export class Toast {
  static show(message, type = 'info', duration = 2500) {
    const container = document.getElementById('lobbyScreen');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `lobby-toast toast-${type}`;
    toast.innerHTML = `
      <span class="lobby-toast-icon">${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <span class="lobby-toast-text">${message}</span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}
