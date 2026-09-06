/**
 * Auth Page — Login / Register / Reset Password
 */
import { Auth } from '../components/auth.js';

export async function renderAuth() {
  if (window.__user) { window.App.navigate('/profile'); return; }

  const tab = new URLSearchParams(window.location.search).get('tab') || 'login';
  const el  = document.getElementById('page-content');

  el.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="url(#alg)"/>
            <path d="M8 14h12M14 8l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <defs><linearGradient id="alg" x1="0" y1="0" x2="28" y2="28">
              <stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/>
            </linearGradient></defs>
          </svg>
          <span>Tech Verse</span>
        </div>

        <!-- Tabs -->
        <div class="auth-tabs" role="tablist">
          <button class="auth-tab ${tab==='login'?'active':''}"
            onclick="AuthPage.switchTab('login')" role="tab">লগইন</button>
          <button class="auth-tab ${tab==='register'?'active':''}"
            onclick="AuthPage.switchTab('register')" role="tab">রেজিস্টার</button>
        </div>

        <!-- Login Form -->
        <div id="tab-login" class="auth-form ${tab!=='login'?'hidden':''}">
          <button class="btn btn-google" onclick="AuthPage.googleSignIn()">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google দিয়ে লগইন করুন
          </button>

          <div class="divider"><span>অথবা</span></div>

          <div class="form-group">
            <label for="login-email">ইমেইল</label>
            <input type="email" id="login-email" placeholder="আপনার ইমেইল" autocomplete="email"/>
          </div>
          <div class="form-group">
            <label for="login-pass">পাসওয়ার্ড</label>
            <div class="pass-wrap">
              <input type="password" id="login-pass" placeholder="পাসওয়ার্ড" autocomplete="current-password"/>
              <button class="pass-toggle" type="button" id="toggle-login-pass" onclick="AuthPage.togglePass('login-pass')" aria-label="পাসওয়ার্ড দেখুন"><i class="fa-solid fa-eye"></i></button>
            </div>
          </div>
          <button class="btn btn-primary full-width" id="login-btn" onclick="AuthPage.emailLogin()">লগইন করুন</button>
          <button class="link-btn" onclick="AuthPage.switchTab('reset')">পাসওয়ার্ড ভুলে গেছেন?</button>
        </div>

        <!-- Register Form -->
        <div id="tab-register" class="auth-form ${tab!=='register'?'hidden':''}">
          <button class="btn btn-google" onclick="AuthPage.googleSignIn()">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google দিয়ে রেজিস্টার করুন
          </button>
          <div class="divider"><span>অথবা</span></div>
          <div class="form-group">
            <label for="reg-name">নাম</label>
            <input type="text" id="reg-name" placeholder="আপনার পুরো নাম" autocomplete="name"/>
          </div>
          <div class="form-group">
            <label for="reg-email">ইমেইল</label>
            <input type="email" id="reg-email" placeholder="আপনার ইমেইল" autocomplete="email"/>
          </div>
          <div class="form-group">
            <label for="reg-pass">পাসওয়ার্ড</label>
            <div class="pass-wrap">
              <input type="password" id="reg-pass" placeholder="কমপক্ষে ৬ অক্ষর" autocomplete="new-password"/>
              <button class="pass-toggle" type="button" id="toggle-reg-pass" onclick="AuthPage.togglePass('reg-pass')" aria-label="পাসওয়ার্ড দেখুন"><i class="fa-solid fa-eye"></i></button>
            </div>
          </div>
          <button class="btn btn-primary full-width" id="reg-btn" onclick="AuthPage.emailRegister()">অ্যাকাউন্ট তৈরি করুন</button>
        </div>

        <!-- Reset Password -->
        <div id="tab-reset" class="auth-form hidden">
          <p class="reset-info">আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হবে।</p>
          <div class="form-group">
            <label for="reset-email">ইমেইল</label>
            <input type="email" id="reset-email" placeholder="আপনার ইমেইল"/>
          </div>
          <button class="btn btn-primary full-width" onclick="AuthPage.resetPassword()">রিসেট লিংক পাঠান</button>
          <button class="link-btn" onclick="AuthPage.switchTab('login')"><i class="fa-solid fa-arrow-left"></i> লগইনে ফিরুন</button>
        </div>
      </div>
    </div>
  `;

  window.AuthPage = {
    switchTab(tab) {
      document.querySelectorAll('.auth-tab').forEach((t,i) =>
        t.classList.toggle('active', ['login','register'][i] === tab || (tab==='reset' && i===0)));
      ['login','register','reset'].forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) el.classList.toggle('hidden', t !== tab);
      });
    },

    async googleSignIn() {
      try {
        await Auth.signInWithGoogle();
        window.Toast.show('স্বাগতম! সাইন ইন সফল হয়েছে।', 'success');
        window.App.navigate('/');
      } catch(e) {
        window.Toast.show('সাইন ইন ব্যর্থ হয়েছে: ' + e.message, 'error');
      }
    },

    async emailLogin() {
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;
      const btn   = document.getElementById('login-btn');
      if (!email || !pass) { window.Toast.show('ইমেইল ও পাসওয়ার্ড দিন।', 'warning'); return; }
      btn.textContent = 'লগইন হচ্ছে...'; btn.disabled = true;
      try {
        await Auth.signInWithEmail(email, pass);
        window.Toast.show('লগইন সফল হয়েছে!', 'success');
        window.App.navigate('/');
      } catch(e) {
        window.Toast.show('লগইন ব্যর্থ: ' + _friendlyError(e.code), 'error');
      } finally { btn.textContent = 'লগইন করুন'; btn.disabled = false; }
    },

    async emailRegister() {
      const name  = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const pass  = document.getElementById('reg-pass').value;
      const btn   = document.getElementById('reg-btn');
      if (!name || !email || !pass) { window.Toast.show('সব তথ্য পূরণ করুন।', 'warning'); return; }
      if (pass.length < 6) { window.Toast.show('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে।', 'warning'); return; }
      btn.textContent = 'তৈরি হচ্ছে...'; btn.disabled = true;
      try {
        await Auth.registerWithEmail(email, pass, name);
        window.Toast.show('অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম <i class="fa-solid fa-circle-check"></i>', 'success');
        window.App.navigate('/');
      } catch(e) {
        window.Toast.show('রেজিস্টার ব্যর্থ: ' + _friendlyError(e.code), 'error');
      } finally { btn.textContent = 'অ্যাকাউন্ট তৈরি করুন'; btn.disabled = false; }
    },

    async resetPassword() {
      const email = document.getElementById('reset-email').value.trim();
      if (!email) { window.Toast.show('ইমেইল দিন।', 'warning'); return; }
      try {
        await Auth.resetPassword(email);
        window.Toast.show('রিসেট লিংক পাঠানো হয়েছে!', 'success');
        this.switchTab('login');
      } catch(e) {
        window.Toast.show('ব্যর্থ: ' + _friendlyError(e.code), 'error');
      }
    },

    togglePass(id) {
      const input = document.getElementById(id);
      const shown = input.type === 'password';
      input.type  = shown ? 'text' : 'password';
      const btn   = document.getElementById(`toggle-${id}`);
      if (btn) btn.innerHTML = `<i class="fa-solid ${shown ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
    }
  };
}

function _friendlyError(code) {
  const map = {
    'auth/user-not-found'    : 'ইমেইল খুঁজে পাওয়া যায়নি।',
    'auth/wrong-password'    : 'পাসওয়ার্ড ভুল।',
    'auth/email-already-in-use': 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে।',
    'auth/weak-password'     : 'পাসওয়ার্ড দুর্বল।',
    'auth/invalid-email'     : 'ইমেইল ফরম্যাট সঠিক নয়।',
    'auth/popup-closed-by-user': 'সাইন ইন বাতিল করা হয়েছে।',
  };
  return map[code] || 'অজানা ত্রুটি।';
}
