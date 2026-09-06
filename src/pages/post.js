/**
 * Single Post Page — Firestore থেকে পোস্ট লোড + Markdown render
 * Phase 2: Comments + Bookmark
 */
import { Comments } from '../components/comments.js';
import { Bookmark } from '../components/bookmark.js';

export async function renderPost() {
  const id = window.__routeParams?.id;
  const el = document.getElementById('page-content');
  if (!id) { window.App.navigate('/blog'); return; }

  el.innerHTML = `<div class="page-loader"><span class="loader-ring"></span></div>`;

  try {
    const { doc, getDoc, updateDoc, increment } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    const snap = await getDoc(doc(window.__firebase.db, 'posts', id));
    if (!snap.exists()) { (await import('./404.js')).render404(); return; }

    const post = { id: snap.id, ...snap.data() };
    const date = post.createdAt?.toDate
      ? post.createdAt.toDate().toLocaleDateString('bn-BD', { year:'numeric', month:'long', day:'numeric' })
      : '';

    // Increment view count (fire-and-forget)
    updateDoc(snap.ref, { views: increment(1) }).catch(() => {});

    // Simple markdown → HTML (bold, italic, code, headings, links)
    const html = _md(post.content || '_কনটেন্ট পাওয়া যায়নি।_');

    el.innerHTML = `
      <article class="post-page">
        <div class="container post-container">
          <div class="post-page-meta">
            ${post.category ? `<a href="/blog?cat=${post.category}" class="post-category">${post.category}</a>` : ''}
            <span class="post-date">${date}</span>
            ${post.readTime ? `<span class="post-read">${post.readTime} পড়া</span>` : ''}
            ${post.views   ? `<span class="post-views"><i class="fa-solid fa-eye icon-muted"></i> ${post.views} ভিউ</span>` : ''}
          </div>
          <h1 class="post-page-title">${post.title}</h1>
          ${post.excerpt ? `<p class="post-page-excerpt">${post.excerpt}</p>` : ''}
          ${post.cover   ? `<img src="${post.cover}" alt="${post.title}" class="post-page-cover"/>` : ''}
          <div class="post-content">${html}</div>

          <div class="post-footer-actions">
            <button class="btn btn-ghost" onclick="history.back()"><i class="fa-solid fa-arrow-left"></i> ফিরে যান</button>
            ${Bookmark.buttonHTML(id)}
          </div>

          <!-- Comments -->
          ${await Comments.render(id)}
        </div>
      </article>
    `;

    // Load comments & bookmark state in parallel
    Comments.load(id);
    Bookmark.isSaved(id).then(saved => {
      const btn = document.getElementById(`bm-btn-${id}`);
      if (btn && saved) btn.classList.add('saved');
    });

  } catch (err) {
    el.innerHTML = `<div class="error-page">
      <h2>পোস্ট লোড ব্যর্থ হয়েছে</h2>
      <p>${err.message}</p>
      <a href="/blog" class="btn btn-primary">ব্লগে ফিরুন</a>
    </div>`;
  }
}

// Minimal Markdown renderer
function _md(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm,  '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|o|l])/gm, '')
    .replace(/^(.+)$/gm, m => m.startsWith('<') ? m : `<p>${m}</p>`);
}
