/**
 * Admin Notification Sender
 * সব ব্যবহারকারীকে বা নির্দিষ্ট ব্যবহারকারীকে নোটিফিকেশন পাঠানো
 */
import { requireAdmin } from '../components/adminGuard.js';
import { adminSidebar } from './admin/postEditor.js';

export async function renderNotificationSender() {
  if (!await requireAdmin()) return;
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <div class="admin-layout">
      ${adminSidebar('/admin/notifications/send')}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1>নোটিফিকেশন পাঠান</h1>
        </div>

        <div class="admin-form-card">
          <div class="form-group">
            <label>প্রাপক</label>
            <select id="notif-target" class="form-select">
              <option value="all">সকল ব্যবহারকারী</option>
              <option value="specific">নির্দিষ্ট ব্যবহারকারী (UID)</option>
            </select>
          </div>

          <div class="form-group hidden" id="uid-group">
            <label>ব্যবহারকারীর UID</label>
            <input type="text" id="notif-uid" class="form-input" placeholder="Firebase UID"/>
          </div>

          <div class="form-group">
            <label>আইকন (ইমোজি)</label>
            <input type="text" id="notif-icon" class="form-input" placeholder="🔔" value="🔔" maxlength="2"/>
          </div>

          <div class="form-group">
            <label>বার্তা *</label>
            <textarea id="notif-message" class="form-textarea" rows="3"
              placeholder="নোটিফিকেশন বার্তা লিখুন..."></textarea>
          </div>

          <div class="form-group">
            <label>লিংক (ঐচ্ছিক)</label>
            <input type="text" id="notif-link" class="form-input" placeholder="/blog/post-id"/>
          </div>

          <div class="form-group">
            <label>পাঠানোর ধরন</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="notif-type" value="inapp" checked/>
                In-app শুধু
              </label>
              <label class="radio-label">
                <input type="radio" name="notif-type" value="both"/>
                In-app + Push (FCM)
              </label>
            </div>
          </div>

          <!-- Preview -->
          <div class="notif-preview" id="notif-preview">
            <h4>প্রিভিউ</h4>
            <div class="notif-item" style="pointer-events:none">
              <div class="notif-icon" id="prev-icon">🔔</div>
              <div class="notif-body">
                <p id="prev-msg">বার্তা এখানে দেখাবে...</p>
                <span class="notif-time">এইমাত্র</span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary" id="send-btn" onclick="NotifSender.send()">
            🔔 নোটিফিকেশন পাঠান
          </button>
        </div>

        <!-- Sent History -->
        <div class="admin-section" style="margin-top:2rem">
          <h2>সম্প্রতি পাঠানো</h2>
          <div id="notif-history">
            <div class="page-loader" style="min-height:80px"><span class="loader-ring"></span></div>
          </div>
        </div>
      </main>
    </div>`;

  // Live preview
  document.getElementById('notif-message').addEventListener('input', e => {
    document.getElementById('prev-msg').textContent = e.target.value || 'বার্তা এখানে দেখাবে...';
  });
  document.getElementById('notif-icon').addEventListener('input', e => {
    document.getElementById('prev-icon').textContent = e.target.value || '🔔';
  });
  document.getElementById('notif-target').addEventListener('change', e => {
    document.getElementById('uid-group').classList.toggle('hidden', e.target.value !== 'specific');
  });

  _loadHistory();

  window.NotifSender = {
    async send() {
      const message = document.getElementById('notif-message').value.trim();
      const icon    = document.getElementById('notif-icon').value || '🔔';
      const link    = document.getElementById('notif-link').value.trim();
      const target  = document.getElementById('notif-target').value;
      const uid     = document.getElementById('notif-uid')?.value.trim();
      const type    = document.querySelector('input[name="notif-type"]:checked').value;

      if (!message) { window.Toast.show('বার্তা লিখুন।', 'warning'); return; }
      if (target === 'specific' && !uid) { window.Toast.show('UID দিন।', 'warning'); return; }

      const btn = document.getElementById('send-btn');
      btn.textContent = 'পাঠানো হচ্ছে...'; btn.disabled = true;

      try {
        const { collection, addDoc, getDocs, query, serverTimestamp } =
          await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        const notifData = { message, icon, link: link || null, read: false, createdAt: serverTimestamp() };

        if (target === 'specific') {
          await addDoc(collection(window.__firebase.db, 'notifications'), { ...notifData, uid });
        } else {
          // সব ইউজারকে নোটিফিকেশন পাঠাও
          const users = await getDocs(collection(window.__firebase.db, 'users'));
          const batch_size = 10;
          const uids = users.docs.map(d => d.id);
          for (let i = 0; i < uids.length; i += batch_size) {
            await Promise.all(
              uids.slice(i, i + batch_size).map(u =>
                addDoc(collection(window.__firebase.db, 'notifications'), { ...notifData, uid: u })
              )
            );
          }
        }

        // Admin log তৈরি করো
        await addDoc(collection(window.__firebase.db, 'admin'), {
          type: 'notification', message, icon, target, sentBy: window.__user.uid,
          sentAt: serverTimestamp()
        });

        window.Toast.show(`নোটিফিকেশন পাঠানো হয়েছে${target==='all'?' সবাইকে':' ব্যবহারকারীকে'}!`, 'success');
        document.getElementById('notif-message').value = '';
        _loadHistory();
      } catch (e) {
        window.Toast.show('পাঠানো ব্যর্থ: ' + e.message, 'error');
      } finally {
        btn.textContent = '🔔 নোটিফিকেশন পাঠান'; btn.disabled = false;
      }
    }
  };
}

async function _loadHistory() {
  const wrap = document.getElementById('notif-history');
  try {
    const { collection, query, where, orderBy, limit, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const snap = await getDocs(query(
      collection(window.__firebase.db, 'admin'),
      where('type','==','notification'),
      orderBy('sentAt','desc'), limit(5)
    ));
    const items = snap.docs.map(d => d.data());
    wrap.innerHTML = items.length
      ? `<table class="admin-table">
           <thead><tr><th>আইকন</th><th>বার্তা</th><th>প্রাপক</th><th>সময়</th></tr></thead>
           <tbody>
             ${items.map(n => `
               <tr>
                 <td>${n.icon || '🔔'}</td>
                 <td>${n.message}</td>
                 <td>${n.target === 'all' ? 'সবাই' : 'নির্দিষ্ট'}</td>
                 <td>${n.sentAt?.toDate?.().toLocaleString('bn-BD') || '—'}</td>
               </tr>`).join('')}
           </tbody>
         </table>`
      : '<p class="empty-state">এখনো কিছু পাঠানো হয়নি।</p>';
  } catch { wrap.innerHTML = ''; }
}
