/**
 * Admin Post Editor — নতুন পোস্ট লেখা ও সম্পাদনা
 */
import { requireAdmin } from '../components/adminGuard.js';

export async function renderPostEditor() {
  if (!await requireAdmin()) return;

  const editId = window.__routeParams?.id; // edit mode হলে id থাকবে
  const el     = document.getElementById('page-content');
  let existing = null;

  if (editId) {
    try {
      const { doc, getDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDoc(doc(window.__firebase.db, 'posts', editId));
      if (snap.exists()) existing = { id: snap.id, ...snap.data() };
    } catch { /* নতুন হিসেবে খুলবে */ }
  }

  el.innerHTML = `
    <div class="admin-layout">
      ${_sidebar('/admin/posts/new')}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1>${existing ? 'পোস্ট সম্পাদনা' : 'নতুন পোস্ট'}</h1>
          <div class="editor-actions">
            <button class="btn btn-ghost" onclick="history.back()">বাতিল</button>
            <button class="btn btn-primary" id="publish-btn" onclick="PostEditor.save()">
              ${existing ? 'আপডেট করুন' : 'প্রকাশ করুন'}
            </button>
          </div>
        </div>

        <div class="editor-layout">
          <!-- Left: Content -->
          <div class="editor-left">
            <div class="form-group">
              <label>শিরোনাম *</label>
              <input type="text" id="ed-title" class="editor-title-input"
                placeholder="পোস্টের শিরোনাম লিখুন..."
                value="${existing?.title || ''}"/>
            </div>
            <div class="form-group">
              <label>সারসংক্ষেপ</label>
              <textarea id="ed-excerpt" rows="2" class="form-textarea"
                placeholder="সংক্ষিপ্ত বিবরণ (সার্চ ও কার্ডে দেখাবে)">${existing?.excerpt || ''}</textarea>
            </div>
            <div class="form-group">
              <div class="editor-toolbar">
                <button type="button" class="tb-btn" onclick="PostEditor.wrap('**','**')" title="Bold"><b>B</b></button>
                <button type="button" class="tb-btn" onclick="PostEditor.wrap('*','*')"   title="Italic"><i>I</i></button>
                <button type="button" class="tb-btn" onclick="PostEditor.heading()"       title="Heading">H2</button>
                <button type="button" class="tb-btn" onclick="PostEditor.wrap('\`','\`')" title="Code">{'}'}</button>
                <button type="button" class="tb-btn" onclick="PostEditor.codeBlock()"    title="Code Block">```</button>
                <button type="button" class="tb-btn" onclick="PostEditor.listItem()"     title="List">• তালিকা</button>
                <div class="tb-sep"></div>
                <button type="button" class="tb-btn" onclick="PostEditor.togglePreview()" id="preview-toggle">
                  👁 প্রিভিউ
                </button>
              </div>
              <div class="editor-split">
                <textarea id="ed-content" class="editor-textarea"
                  placeholder="Markdown-এ কনটেন্ট লিখুন...">${existing?.content || ''}</textarea>
                <div id="ed-preview" class="editor-preview post-content hidden"></div>
              </div>
            </div>
          </div>

          <!-- Right: Meta -->
          <div class="editor-right">
            <div class="editor-meta-card">
              <h3>পোস্ট সেটিংস</h3>
              <div class="form-group">
                <label>ক্যাটাগরি</label>
                <select id="ed-category" class="form-select">
                  <option value="">নির্বাচন করুন</option>
                  ${CATS.map(c => `<option value="${c}" ${existing?.category===c?'selected':''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>পড়ার সময়</label>
                <input type="text" id="ed-readtime" class="form-input"
                  placeholder="যেমন: ৫ মিনিট" value="${existing?.readTime || ''}"/>
              </div>
              <div class="form-group">
                <label>কভার ইমেজ URL</label>
                <input type="url" id="ed-cover" class="form-input"
                  placeholder="https://..." value="${existing?.cover || ''}"/>
                <div id="cover-preview" class="cover-preview ${existing?.cover ? '' : 'hidden'}">
                  ${existing?.cover ? `<img src="${existing.cover}" alt="Cover"/>` : ''}
                </div>
              </div>
              <div class="form-group">
                <label>ট্যাগ (কমা দিয়ে আলাদা করুন)</label>
                <input type="text" id="ed-tags" class="form-input"
                  placeholder="js, firebase, web"
                  value="${(existing?.tags||[]).join(', ')}"/>
              </div>
              <div class="form-group">
                <label class="toggle-label">
                  <input type="checkbox" id="ed-featured" ${existing?.featured?'checked':''}/> 
                  Featured পোস্ট
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Cover preview on input
  document.getElementById('ed-cover').addEventListener('input', e => {
    const wrap = document.getElementById('cover-preview');
    if (e.target.value) {
      wrap.classList.remove('hidden');
      wrap.innerHTML = `<img src="${e.target.value}" alt="Cover" onerror="this.style.display='none'"/>`;
    } else {
      wrap.classList.add('hidden');
    }
  });

  // Live preview on content change
  document.getElementById('ed-content').addEventListener('input', () => {
    const preview = document.getElementById('ed-preview');
    if (!preview.classList.contains('hidden')) PostEditor._renderPreview();
  });

  window.PostEditor = {
    async save() {
      const title    = document.getElementById('ed-title').value.trim();
      const content  = document.getElementById('ed-content').value.trim();
      const excerpt  = document.getElementById('ed-excerpt').value.trim();
      const category = document.getElementById('ed-category').value;
      const readTime = document.getElementById('ed-readtime').value.trim();
      const cover    = document.getElementById('ed-cover').value.trim();
      const tagsRaw  = document.getElementById('ed-tags').value;
      const featured = document.getElementById('ed-featured').checked;
      const tags     = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

      if (!title || !content) {
        window.Toast.show('শিরোনাম ও কনটেন্ট আবশ্যক।', 'warning'); return;
      }

      const btn = document.getElementById('publish-btn');
      btn.textContent = 'সেভ হচ্ছে...'; btn.disabled = true;

      try {
        const { collection, doc, addDoc, updateDoc, serverTimestamp } =
          await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const data = {
          title, content, excerpt, category, readTime,
          cover, tags, featured,
          updatedAt: serverTimestamp(),
        };
        if (editId) {
          await updateDoc(doc(window.__firebase.db, 'posts', editId), data);
          window.Toast.show('পোস্ট আপডেট হয়েছে!', 'success');
        } else {
          data.createdAt = serverTimestamp();
          data.views     = 0;
          data.authorId  = window.__user.uid;
          data.author    = window.__user.displayName || 'Admin';
          await addDoc(collection(window.__firebase.db, 'posts'), data);
          window.Toast.show('পোস্ট প্রকাশিত হয়েছে! 🎉', 'success');
        }
        window.App.navigate('/admin/posts');
      } catch (e) {
        window.Toast.show('সেভ ব্যর্থ: ' + e.message, 'error');
        btn.textContent = editId ? 'আপডেট করুন' : 'প্রকাশ করুন';
        btn.disabled = false;
      }
    },

    wrap(before, after) {
      const ta  = document.getElementById('ed-content');
      const s   = ta.selectionStart, e = ta.selectionEnd;
      const sel = ta.value.substring(s, e) || 'টেক্সট';
      ta.value  = ta.value.substring(0,s) + before + sel + after + ta.value.substring(e);
      ta.focus();
    },

    heading()   { this.wrap('\n## ', '\n'); },
    codeBlock() { this.wrap('\n```\n', '\n```\n'); },
    listItem()  { this.wrap('\n- ', ''); },

    togglePreview() {
      const ta      = document.getElementById('ed-content');
      const preview = document.getElementById('ed-preview');
      const btn     = document.getElementById('preview-toggle');
      const isShown = !preview.classList.contains('hidden');
      preview.classList.toggle('hidden', isShown);
      ta.classList.toggle('hidden', !isShown);
      btn.textContent = isShown ? '👁 প্রিভিউ' : '✏️ সম্পাদনা';
      if (!isShown) this._renderPreview();
    },

    _renderPreview() {
      const content = document.getElementById('ed-content').value;
      document.getElementById('ed-preview').innerHTML = _md(content);
    }
  };
}

function _md(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code>$1</code>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g,'</p><p>')
    .replace(/^([^<\n].+)$/gm,'<p>$1</p>');
}

function _sidebar(active) {
  const ADMIN_NAV = [
    { href: '/admin',                    icon: '📊', label: 'ড্যাশবোর্ড'    },
    { href: '/admin/posts',              icon: '✍️', label: 'পোস্টসমূহ'     },
    { href: '/admin/posts/new',          icon: '➕', label: 'নতুন পোস্ট'    },
    { href: '/admin/courses',            icon: '📚', label: 'কোর্সসমূহ'     },
    { href: '/admin/users',              icon: '👥', label: 'ব্যবহারকারী'   },
    { href: '/admin/comments',           icon: '💬', label: 'মন্তব্যসমূহ'   },
    { href: '/admin/notifications/send', icon: '🔔', label: 'নোটিফিকেশন'    },
    { href: '/admin/analytics',          icon: '📈', label: 'Analytics'     },
  ];
  return `
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect width="28" height="28" rx="8" fill="url(#slg)"/>
          <path d="M8 14h12M14 8l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          <defs><linearGradient id="slg" x1="0" y1="0" x2="28" y2="28">
            <stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/>
          </linearGradient></defs>
        </svg>
        <span>Admin Panel</span>
      </div>
      <nav class="admin-nav">
        ${ADMIN_NAV.map(item => `
          <a href="${item.href}" class="admin-nav-link ${item.href === active ? 'active' : ''}">
            <span class="admin-nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>`).join('')}
      </nav>
      <div class="admin-sidebar-footer">
        <a href="/" class="admin-nav-link">
          <span class="admin-nav-icon">←</span>
          <span>সাইটে ফিরুন</span>
        </a>
      </div>
    </aside>`;
}

export { _sidebar as adminSidebar };

const CATS = ['JavaScript','Firebase','PWA','CSS','Python','HTML','React','Tools','সাধারণ'];
