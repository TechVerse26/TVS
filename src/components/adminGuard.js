/**
 * Admin Guard
 * Admin custom claim যাচাই করে, না থাকলে redirect করে
 */
export async function requireAdmin() {
  // Auth settle হওয়ার জন্য অপেক্ষা
  await new Promise(resolve => {
    if (window.__user !== undefined) { resolve(); return; }
    const t = setInterval(() => {
      if (window.__user !== undefined) { clearInterval(t); resolve(); }
    }, 80);
  });

  if (!window.__user) {
    window.App.navigate('/auth');
    return false;
  }

  try {
    // Token force refresh করে custom claim পড়ো
    const token = await window.__user.getIdTokenResult(true);
    if (!token.claims.admin) {
      document.getElementById('page-content').innerHTML = `
        <div class="error-page">
          <div class="error-code" style="font-size:4rem">🚫</div>
          <h1>অ্যাক্সেস নেই</h1>
          <p>এই পেজটি শুধুমাত্র Admin-দের জন্য।</p>
          <a href="/" class="btn btn-primary">হোমে ফিরুন</a>
        </div>`;
      return false;
    }
    return true;
  } catch {
    window.App.navigate('/');
    return false;
  }
}
