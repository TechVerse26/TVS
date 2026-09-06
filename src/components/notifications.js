/**
 * Notifications Component
 * Firebase Cloud Messaging (FCM) + in-app notification bell
 */
export const Notifications = {
  _unread: 0,

  async init() {
    if (!window.__user) return;
    await this._loadInApp();
    this._setupFCM();
  },

  async _loadInApp() {
    try {
      const { collection, query, where, orderBy, limit, getDocs } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDocs(
        query(
          collection(window.__firebase.db, 'notifications'),
          where('uid', '==', window.__user.uid),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(20)
        )
      );
      this._unread = snap.size;
      this._updateBadge();
      this._notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { /* silent */ }
  },

  _updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    badge.hidden       = this._unread === 0;
    badge.textContent  = this._unread > 9 ? '9+' : this._unread;
  },

  toggle() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) this._renderPanel();
  },

  _renderPanel() {
    const panel = document.getElementById('notif-panel');
    const items = this._notifications || [];
    panel.innerHTML = `
      <div class="notif-header">
        <strong>নোটিফিকেশন</strong>
        ${items.length ? `<button class="link-btn" onclick="Notifications.markAllRead()">সব পড়া হিসেবে চিহ্নিত করুন</button>` : ''}
      </div>
      <div class="notif-list">
        ${items.length
          ? items.map(n => `
              <div class="notif-item ${n.read ? '' : 'unread'}" onclick="Notifications.open('${n.id}','${n.link||''}')">
                <div class="notif-icon icon-box icon-box-sm">${n.icon || '<i class="fa-solid fa-bell"></i>'}</div>
                <div class="notif-body">
                  <p>${n.message}</p>
                  <span class="notif-time">${_timeAgo(n.createdAt?.toDate?.())}</span>
                </div>
              </div>`).join('')
          : '<p class="empty-state">কোনো নোটিফিকেশন নেই।</p>'}
      </div>`;
  },

  async open(id, link) {
    // Mark as read
    try {
      const { doc, updateDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await updateDoc(doc(window.__firebase.db, 'notifications', id), { read: true });
    } catch { /* silent */ }
    if (link) window.App.navigate(link);
  },

  async markAllRead() {
    try {
      const { collection, query, where, getDocs, writeBatch, doc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap  = await getDocs(
        query(collection(window.__firebase.db,'notifications'),
          where('uid','==',window.__user.uid), where('read','==',false))
      );
      const batch = writeBatch(window.__firebase.db);
      snap.docs.forEach(d => batch.update(doc(window.__firebase.db,'notifications',d.id), { read: true }));
      await batch.commit();
      this._unread       = 0;
      this._notifications= [];
      this._updateBadge();
      this._renderPanel();
      window.Toast.show('সব পড়া হিসেবে চিহ্নিত করা হয়েছে।', 'success');
    } catch { /* silent */ }
  },

  async _setupFCM() {
    // FCM requires VAPID key from Firebase Console → Cloud Messaging
    try {
      const { getMessaging, getToken, onMessage } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js');
      const messaging = getMessaging(window.__firebase.app);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY', // ← Firebase Console → Cloud Messaging → Web Push certificates
      });

      if (token) await _saveToken(token);

      // Foreground message handler
      onMessage(messaging, payload => {
        const { title, body } = payload.notification || {};
        window.Toast.show(`<i class="fa-solid fa-bell"></i> ${title}: ${body}`, 'info', 6000);
        this._unread++;
        this._updateBadge();
      });
    } catch { /* FCM not configured yet */ }
  },

  // Render the bell button (call from Navbar)
  bellHTML() {
    return `
      <div class="notif-wrap" style="position:relative">
        <button class="nav-btn icon-btn" onclick="Notifications.toggle()" aria-label="নোটিফিকেশন">
          <i class="fa-solid fa-bell"></i>
          <span id="notif-badge" class="notif-badge" hidden>0</span>
        </button>
        <div id="notif-panel" class="notif-panel" hidden></div>
      </div>`;
  }
};

async function _saveToken(token) {
  try {
    const { doc, setDoc } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    await setDoc(
      doc(window.__firebase.db, 'fcm_tokens', window.__user.uid),
      { token, uid: window.__user.uid, updatedAt: new Date() },
      { merge: true }
    );
  } catch { /* silent */ }
}

function _timeAgo(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)   return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff/60)} মিনিট আগে`;
  if (diff < 86400)return `${Math.floor(diff/3600)} ঘণ্টা আগে`;
  return `${Math.floor(diff/86400)} দিন আগে`;
}

window.Notifications = Notifications;
