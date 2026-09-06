/**
 * Bookmark Component
 * Save / unsave posts — Firestore-backed, instant UI feedback
 */
export const Bookmark = {

  /**
   * Render a bookmark toggle button
   * @param {string} postId
   * @param {boolean} saved — initial state
   */
  buttonHTML(postId, saved = false) {
    return `
      <button
        class="bookmark-btn ${saved ? 'saved' : ''}"
        id="bm-btn-${postId}"
        onclick="Bookmark.toggle('${postId}')"
        aria-label="${saved ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'}"
        title="${saved ? 'সেভ করা হয়েছে' : 'সেভ করুন'}">
        <svg width="18" height="18" viewBox="0 0 24 24"
          fill="${saved ? 'currentColor' : 'none'}"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>`;
  },

  /**
   * Check whether the current user has saved a post
   */
  async isSaved(postId) {
    if (!window.__user) return false;
    try {
      const { doc, getDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDoc(
        doc(window.__firebase.db, 'bookmarks', `${window.__user.uid}_${postId}`)
      );
      return snap.exists();
    } catch { return false; }
  },

  /**
   * Toggle save state and update button UI
   */
  async toggle(postId) {
    if (!window.__user) { window.App.navigate('/auth'); return; }

    const btn   = document.getElementById(`bm-btn-${postId}`);
    const saved = btn?.classList.contains('saved');

    // Optimistic UI
    btn?.classList.toggle('saved');

    try {
      const { doc, setDoc, deleteDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const ref = doc(window.__firebase.db, 'bookmarks', `${window.__user.uid}_${postId}`);

      if (saved) {
        await deleteDoc(ref);
        window.Toast.show('বুকমার্ক সরানো হয়েছে।', 'info');
        if (btn) btn.setAttribute('aria-label', 'বুকমার্ক করুন');
      } else {
        await setDoc(ref, {
          uid      : window.__user.uid,
          postId,
          savedAt  : new Date(),
        });
        window.Toast.show('বুকমার্ক সেভ হয়েছে! <i class="fa-solid fa-bookmark"></i>', 'success');
        if (btn) btn.setAttribute('aria-label', 'বুকমার্ক সরান');
      }
    } catch {
      // Revert optimistic update on failure
      btn?.classList.toggle('saved');
      window.Toast.show('কাজটি সম্পন্ন হয়নি।', 'error');
    }
  },

  /**
   * Load all bookmarks for the current user
   * Returns array of { postId, savedAt }
   */
  async loadUserBookmarks() {
    if (!window.__user) return [];
    try {
      const { collection, query, where, orderBy, getDocs } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDocs(
        query(
          collection(window.__firebase.db, 'bookmarks'),
          where('uid', '==', window.__user.uid),
          orderBy('savedAt', 'desc')
        )
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  },
};

window.Bookmark = Bookmark;
