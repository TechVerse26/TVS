/**
 * Toast Notification Component
 * success | error | info | warning
 */
export const Toast = {
  init() {
    // container already in HTML
  },

  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    const id        = 'toast-' + Date.now();

    const icons = {
      success : '<i class="fa-solid fa-check"></i>',
      error   : '<i class="fa-solid fa-xmark"></i>',
      warning : '<i class="fa-solid fa-triangle-exclamation"></i>',
      info    : '<i class="fa-solid fa-circle-info"></i>',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id        = id;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" onclick="Toast.dismiss('${id}')" aria-label="বন্ধ করুন"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);
    // trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  },

  dismiss(id) {
    const toast = document.getElementById(id);
    if (!toast) return;
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }
};

window.Toast = Toast;
