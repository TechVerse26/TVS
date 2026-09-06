/**
 * Admin Dashboard — Phase 3
 * শুধুমাত্র Admin access, stats + quick actions
 */
import { requireAdmin } from '../components/adminGuard.js';

export async function renderAdmin() {
  if (!await requireAdmin()) return;
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <div class="admin-layout">

      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="url(#admlg)"/>
            <path d="M8 14h12M14 8l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
            <defs><linearGradient id="admlg" x1="0" y1="0" x2="28" y2="28">
              <stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/>
            </linearGradient></defs>
          </svg>
          <span>Admin Panel</span>
        </div>
        <nav class="admin-nav">
          ${ADMIN_NAV.map(item => `
            <a href="${item.href}" class="admin-nav-link ${item.href === '/admin' ? 'active' : ''}">
              <span class="admin-nav-icon icon">${item.icon}</span>
              <span>${item.label}</span>
            </a>`).join('')}
        </nav>
        <div class="admin-sidebar-footer">
          <a href="/" class="admin-nav-link">
            <span class="admin-nav-icon icon"><i class="fa-solid fa-arrow-left"></i></span>
            <span>সাইটে ফিরুন</span>
          </a>
        </div>
      </aside>

      <!-- Main -->
      <main class="admin-main">
        <div class="admin-topbar">
          <h1>ড্যাশবোর্ড</h1>
          <div class="admin-user">
            <span>${window.__user?.displayName || 'Admin'}</span>
            ${window.__user?.photoURL
              ? `<img src="${window.__user.photoURL}" class="admin-avatar" alt=""/>`
              : `<div class="admin-avatar-ph">${(window.__user?.displayName||'A')[0]}</div>`}
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="admin-stats-grid" id="admin-stats">
          ${STAT_CARDS.map(s => `
            <div class="admin-stat-card">
              <div class="asc-icon icon-box icon-box-lg">${s.icon}</div>
              <div class="asc-info">
                <strong id="stat-${s.key}">—</strong>
                <span>${s.label}</span>
              </div>
            </div>`).join('')}
        </div>

        <!-- Quick Actions -->
        <div class="admin-section">
          <h2>দ্রুত কাজ</h2>
          <div class="quick-actions">
            <a href="/admin/posts/new" class="qa-card">
              <span class="qa-icon icon-box icon-box-md"><i class="fa-solid fa-pen"></i></span>
              <strong>নতুন পোস্ট</strong>
              <span>ব্লগ আর্টিকেল লিখুন</span>
            </a>
            <a href="/admin/courses/new" class="qa-card">
              <span class="qa-icon icon-box icon-box-md"><i class="fa-solid fa-book-open"></i></span>
              <strong>নতুন কোর্স</strong>
              <span>লার্নিং কোর্স যোগ করুন</span>
            </a>
            <a href="/admin/notifications/send" class="qa-card">
              <span class="qa-icon icon-box icon-box-md"><i class="fa-solid fa-bell"></i></span>
              <strong>নোটিফিকেশন পাঠান</strong>
              <span>সব ব্যবহারকারীকে</span>
            </a>
            <a href="/admin/analytics" class="qa-card">
              <span class="qa-icon icon-box icon-box-md"><i class="fa-solid fa-chart-column"></i></span>
              <strong>Analytics</strong>
              <span>ট্র্যাফিক ও ভিউ দেখুন</span>
            </a>
          </div>
        </div>

        <!-- Recent Posts Table -->
        <div class="admin-section">
          <div class="admin-section-header">
            <h2>সাম্প্রতিক পোস্ট</h2>
            <a href="/admin/posts" class="btn btn-outline btn-sm">সব দেখুন</a>
          </div>
          <div class="admin-table-wrap" id="recent-posts-table">
            <div class="page-loader" style="min-height:120px"><span class="loader-ring"></span></div>
          </div>
        </div>

        <!-- Recent Users Table -->
        <div class="admin-section">
          <div class="admin-section-header">
            <h2>নতুন ব্যবহারকারী</h2>
            <a href="/admin/users" class="btn btn-outline btn-sm">সব দেখুন</a>
          </div>
          <div class="admin-table-wrap" id="recent-users-table">
            <div class="page-loader" style="min-height:120px"><span class="loader-ring"></span></div>
          </div>
        </div>
      </main>
    </div>
  `;

  _loadStats();
  _loadRecentPosts();
  _loadRecentUsers();
}

async function _loadStats() {
  try {
    const { collection, getCountFromServer, query, where } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const db = window.__firebase.db;
    const [posts, courses, users, comments] = await Promise.all([
      getCountFromServer(collection(db, 'posts')),
      getCountFromServer(collection(db, 'courses')),
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(collection(db, 'comments')),
    ]);
    const counts = {
      posts   : posts.data().count,
      courses : courses.data().count,
      users   : users.data().count,
      comments: comments.data().count,
    };
    Object.entries(counts).forEach(([key, val]) => {
      const el = document.getElementById(`stat-${key}`);
      if (el) el.textContent = val;
    });
  } catch {
    ['posts','courses','users','comments'].forEach(k => {
      const el = document.getElementById(`stat-${k}`);
      if (el) el.textContent = '—';
    });
  }
}

async function _loadRecentPosts() {
  const wrap = document.getElementById('recent-posts-table');
  try {
    const { collection, query, orderBy, limit, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const snap  = await getDocs(query(
      collection(window.__firebase.db, 'posts'), orderBy('createdAt','desc'), limit(5)
    ));
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    wrap.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>শিরোনাম</th><th>ক্যাটাগরি</th><th>ভিউ</th><th>কাজ</th></tr></thead>
        <tbody>
          ${posts.map(p => `
            <tr>
              <td><a href="/blog/${p.id}" target="_blank">${p.title}</a></td>
              <td><span class="table-badge">${p.category || '—'}</span></td>
              <td>${p.views || 0}</td>
              <td>
                <a href="/admin/posts/edit/${p.id}" class="table-action">সম্পাদনা</a>
                <button class="table-action danger" onclick="AdminDash.deletePost('${p.id}')">মুছুন</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {
    wrap.innerHTML = '<p class="empty-state">ডেটা লোড হয়নি।</p>';
  }
}

async function _loadRecentUsers() {
  const wrap = document.getElementById('recent-users-table');
  try {
    const { collection, query, orderBy, limit, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const snap  = await getDocs(query(
      collection(window.__firebase.db, 'users'), orderBy('createdAt','desc'), limit(5)
    ));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    wrap.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>নাম</th><th>ইমেইল</th><th>যোগদান</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>${u.displayName || '—'}</td>
              <td>${u.email || '—'}</td>
              <td>${u.createdAt?.toDate?.().toLocaleDateString('bn-BD') || '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {
    wrap.innerHTML = '<p class="empty-state">ডেটা লোড হয়নি।</p>';
  }
}

window.AdminDash = {
  async deletePost(id) {
    if (!confirm('এই পোস্টটি মুছে ফেলবেন?')) return;
    try {
      const { doc, deleteDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await deleteDoc(doc(window.__firebase.db, 'posts', id));
      window.Toast.show('পোস্ট মুছে ফেলা হয়েছে।', 'success');
      _loadRecentPosts();
    } catch { window.Toast.show('মুছতে ব্যর্থ হয়েছে।', 'error'); }
  }
};

const ADMIN_NAV = [
  { href: '/admin',                  icon: '<i class="fa-solid fa-chart-column"></i>', label: 'ড্যাশবোর্ড'   },
  { href: '/admin/posts',            icon: '<i class="fa-solid fa-pen"></i>', label: 'পোস্টসমূহ'    },
  { href: '/admin/posts/new',        icon: '<i class="fa-solid fa-plus"></i>', label: 'নতুন পোস্ট'   },
  { href: '/admin/courses',          icon: '<i class="fa-solid fa-book-open"></i>', label: 'কোর্সসমূহ'    },
  { href: '/admin/users',            icon: '<i class="fa-solid fa-users"></i>', label: 'ব্যবহারকারী'  },
  { href: '/admin/comments',         icon: '<i class="fa-solid fa-comments"></i>', label: 'মন্তব্যসমূহ'  },
  { href: '/admin/notifications/send', icon: '<i class="fa-solid fa-bell"></i>', label: 'নোটিফিকেশন' },
  { href: '/admin/analytics',        icon: '<i class="fa-solid fa-chart-line"></i>', label: 'Analytics'    },
];

const STAT_CARDS = [
  { key: 'posts',    icon: '<i class="fa-solid fa-file-lines"></i>', label: 'মোট পোস্ট'          },
  { key: 'courses',  icon: '<i class="fa-solid fa-book-open"></i>', label: 'মোট কোর্স'          },
  { key: 'users',    icon: '<i class="fa-solid fa-users"></i>', label: 'মোট ব্যবহারকারী'    },
  { key: 'comments', icon: '<i class="fa-solid fa-comments"></i>', label: 'মোট মন্তব্য'        },
];
