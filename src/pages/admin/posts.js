/**
 * Admin Posts List — সব পোস্ট দেখা, মুছা, সম্পাদনা
 */
import { requireAdmin }   from '../components/adminGuard.js';
import { adminSidebar }   from './admin/postEditor.js';

export async function renderAdminPosts() {
  if (!await requireAdmin()) return;
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <div class="admin-layout">
      ${adminSidebar('/admin/posts')}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1>সকল পোস্ট</h1>
          <a href="/admin/posts/new" class="btn btn-primary">+ নতুন পোস্ট</a>
        </div>

        <!-- Search bar -->
        <div class="admin-search-bar">
          <input type="text" id="post-search" placeholder="পোস্ট খুঁজুন..." class="form-input"
            oninput="AdminPosts.search(this.value)"/>
        </div>

        <div class="admin-table-wrap" id="posts-table">
          <div class="page-loader" style="min-height:200px"><span class="loader-ring"></span></div>
        </div>
      </main>
    </div>`;

  let allPosts = [];

  const { collection, query, orderBy, getDocs } =
    await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
  try {
    const snap = await getDocs(query(
      collection(window.__firebase.db, 'posts'), orderBy('createdAt','desc')
    ));
    allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { allPosts = []; }

  function renderTable(posts) {
    const wrap = document.getElementById('posts-table');
    if (!posts.length) {
      wrap.innerHTML = '<p class="empty-state">কোনো পোস্ট নেই।</p>'; return;
    }
    wrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>শিরোনাম</th><th>ক্যাটাগরি</th>
            <th>ভিউ</th><th>তারিখ</th><th>কাজ</th>
          </tr>
        </thead>
        <tbody>
          ${posts.map(p => `
            <tr>
              <td>
                <a href="/blog/${p.id}" target="_blank" class="table-link">${p.title}</a>
                ${p.featured ? '<span class="table-badge featured">Featured</span>' : ''}
              </td>
              <td><span class="table-badge">${p.category || '—'}</span></td>
              <td>${p.views || 0}</td>
              <td>${p.createdAt?.toDate?.().toLocaleDateString('bn-BD') || '—'}</td>
              <td class="table-actions-cell">
                <a href="/admin/posts/edit/${p.id}" class="table-action">সম্পাদনা</a>
                <button class="table-action danger"
                  onclick="AdminPosts.delete('${p.id}')">মুছুন</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  renderTable(allPosts);

  window.AdminPosts = {
    search(q) {
      const filtered = q
        ? allPosts.filter(p => p.title?.toLowerCase().includes(q.toLowerCase()))
        : allPosts;
      renderTable(filtered);
    },
    async delete(id) {
      if (!confirm('এই পোস্টটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
      try {
        const { doc, deleteDoc } =
          await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        await deleteDoc(doc(window.__firebase.db, 'posts', id));
        allPosts = allPosts.filter(p => p.id !== id);
        renderTable(allPosts);
        window.Toast.show('পোস্ট মুছে ফেলা হয়েছে।', 'success');
      } catch { window.Toast.show('মুছতে ব্যর্থ হয়েছে।', 'error'); }
    }
  };
}
