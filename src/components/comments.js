/**
 * Comments Component
 * Firestore-backed nested comments with Like & Reply
 */
export const Comments = {

  async render(postId) {
    return `
      <section class="comments-section" id="comments-${postId}">
        <h3 class="comments-title">মন্তব্য</h3>

        ${window.__user ? `
          <div class="comment-form" id="comment-form-${postId}">
            <div class="comment-avatar">
              ${window.__user.photoURL
                ? `<img src="${window.__user.photoURL}" alt=""/>`
                : `<div class="avatar-sm">${(window.__user.displayName||'U')[0]}</div>`}
            </div>
            <div class="comment-input-wrap">
              <textarea id="comment-text-${postId}" placeholder="আপনার মন্তব্য লিখুন..."
                rows="3" class="comment-textarea"></textarea>
              <button class="btn btn-primary comment-submit"
                onclick="Comments.submit('${postId}')">মন্তব্য করুন</button>
            </div>
          </div>` : `
          <div class="comment-login-prompt">
            <a href="/auth" class="btn btn-outline">মন্তব্য করতে লগইন করুন</a>
          </div>`}

        <div class="comments-list" id="comments-list-${postId}">
          <div class="page-loader" style="min-height:80px"><span class="loader-ring"></span></div>
        </div>
      </section>`;
  },

  async load(postId) {
    const list = document.getElementById(`comments-list-${postId}`);
    if (!list) return;
    try {
      const { collection, query, orderBy, where, getDocs } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      // Load top-level comments
      const snap = await getDocs(
        query(
          collection(window.__firebase.db, 'comments'),
          where('postId',   '==', postId),
          where('parentId', '==', null),
          orderBy('createdAt', 'desc')
        )
      );
      const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!comments.length) {
        list.innerHTML = '<p class="empty-state">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্য করুন!</p>';
        return;
      }
      list.innerHTML = comments.map(c => this._commentHTML(c, postId)).join('');
    } catch {
      list.innerHTML = '<p class="empty-state">মন্তব্য লোড হয়নি।</p>';
    }
  },

  async submit(postId, parentId = null, replyTo = null) {
    if (!window.__user) { window.App.navigate('/auth'); return; }
    const textareaId = replyTo ? `reply-text-${parentId}` : `comment-text-${postId}`;
    const textarea   = document.getElementById(textareaId);
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) { window.Toast.show('মন্তব্য লিখুন।', 'warning'); return; }

    // Basic spam filter
    const spamWords = ['http', 'www.', 'spam'];
    if (spamWords.some(w => text.toLowerCase().includes(w))) {
      window.Toast.show('অবৈধ কন্টেন্ট।', 'error'); return;
    }

    try {
      const { collection, addDoc, serverTimestamp } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await addDoc(collection(window.__firebase.db, 'comments'), {
        postId,
        parentId : parentId || null,
        text,
        uid      : window.__user.uid,
        author   : window.__user.displayName || 'ব্যবহারকারী',
        avatar   : window.__user.photoURL || null,
        likes    : 0,
        createdAt: serverTimestamp(),
      });
      textarea.value = '';
      window.Toast.show('মন্তব্য যোগ হয়েছে!', 'success');
      await this.load(postId);
    } catch {
      window.Toast.show('মন্তব্য যোগ ব্যর্থ হয়েছে।', 'error');
    }
  },

  async like(commentId, postId) {
    if (!window.__user) { window.App.navigate('/auth'); return; }
    try {
      const { doc, updateDoc, increment } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await updateDoc(doc(window.__firebase.db, 'comments', commentId), { likes: increment(1) });
      const btn = document.getElementById(`like-btn-${commentId}`);
      if (btn) {
        const cur = parseInt(btn.dataset.likes || '0') + 1;
        btn.dataset.likes = cur;
        btn.innerHTML = `<i class="fa-solid fa-heart icon-accent"></i> ${cur}`;
        btn.disabled  = true;
      }
    } catch { /* silent */ }
  },

  toggleReply(parentId) {
    const form = document.getElementById(`reply-form-${parentId}`);
    if (form) form.hidden = !form.hidden;
  },

  _commentHTML(comment, postId) {
    const date = comment.createdAt?.toDate
      ? comment.createdAt.toDate().toLocaleDateString('bn-BD', { year:'numeric', month:'short', day:'numeric' })
      : '';
    return `
      <div class="comment" id="comment-${comment.id}">
        <div class="comment-avatar">
          ${comment.avatar
            ? `<img src="${comment.avatar}" alt="${comment.author}"/>`
            : `<div class="avatar-sm">${(comment.author||'U')[0]}</div>`}
        </div>
        <div class="comment-body">
          <div class="comment-header">
            <strong>${comment.author}</strong>
            <span class="comment-date">${date}</span>
          </div>
          <p class="comment-text">${_escape(comment.text)}</p>
          <div class="comment-actions">
            <button class="comment-action-btn" id="like-btn-${comment.id}"
              data-likes="${comment.likes||0}"
              onclick="Comments.like('${comment.id}','${postId}')">
              <i class="fa-solid fa-heart"></i> ${comment.likes || 0}
            </button>
            ${window.__user ? `
              <button class="comment-action-btn" onclick="Comments.toggleReply('${comment.id}')">
                <i class="fa-solid fa-reply"></i> রিপ্লাই
              </button>` : ''}
          </div>
          <!-- Reply form -->
          <div id="reply-form-${comment.id}" hidden class="reply-form">
            <textarea id="reply-text-${comment.id}" placeholder="রিপ্লাই লিখুন..." rows="2" class="comment-textarea"></textarea>
            <button class="btn btn-primary btn-sm"
              onclick="Comments.submit('${postId}','${comment.id}','${comment.id}')">রিপ্লাই করুন</button>
          </div>
        </div>
      </div>`;
  }
};

function _escape(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

window.Comments = Comments;
