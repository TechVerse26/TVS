/**
 * Newsletter Component
 * EmailJS দিয়ে সাবস্ক্রিপশন, Firestore-এ subscriber সেভ
 */
export const Newsletter = {

  /**
   * Newsletter signup form HTML
   * যেকোনো পেজে এটা embed করা যাবে
   */
  formHTML(variant = 'default') {
    if (variant === 'inline') {
      return `
        <div class="newsletter-inline">
          <div class="nl-icon">📬</div>
          <div class="nl-text">
            <strong>নিউজলেটার সাবস্ক্রাইব করুন</strong>
            <span>নতুন পোস্ট ও কোর্স সরাসরি ইমেইলে পাবেন।</span>
          </div>
          <div class="nl-form-wrap">
            <input type="email" id="nl-email-inline" class="nl-input"
              placeholder="আপনার ইমেইল..." autocomplete="email"/>
            <button class="btn btn-primary" onclick="Newsletter.subscribe('inline')">
              সাবস্ক্রাইব
            </button>
          </div>
        </div>`;
    }

    return `
      <section class="newsletter-section">
        <div class="container">
          <div class="newsletter-card">
            <div class="nl-content">
              <div class="nl-badge">📬 নিউজলেটার</div>
              <h2>সর্বশেষ আপডেট পান</h2>
              <p>প্রতি সপ্তাহে নতুন আর্টিকেল, কোর্স ও টেক নিউজ — সরাসরি আপনার ইনবক্সে।</p>
              <ul class="nl-perks">
                <li>✓ সাপ্তাহিক টেক নিউজলেটার</li>
                <li>✓ নতুন কোর্সের আর্লি অ্যাক্সেস</li>
                <li>✓ এক্সক্লুসিভ টিউটোরিয়াল</li>
                <li>✓ স্প্যাম নেই, যেকোনো সময় আনসাবস্ক্রাইব</li>
              </ul>
            </div>
            <div class="nl-form">
              <div class="form-group">
                <label for="nl-name">আপনার নাম</label>
                <input type="text" id="nl-name" class="form-input"
                  placeholder="আপনার নাম" autocomplete="name"/>
              </div>
              <div class="form-group">
                <label for="nl-email">ইমেইল ঠিকানা *</label>
                <input type="email" id="nl-email" class="form-input"
                  placeholder="example@email.com" autocomplete="email"/>
              </div>
              <div class="form-group">
                <label>আগ্রহের বিষয়</label>
                <div class="interest-tags">
                  ${['JavaScript','Firebase','PWA','Python','CSS','সাধারণ টেক'].map(t => `
                    <label class="interest-tag">
                      <input type="checkbox" name="interest" value="${t}"/>
                      ${t}
                    </label>`).join('')}
                </div>
              </div>
              <button class="btn btn-primary full-width" id="nl-submit-btn"
                onclick="Newsletter.subscribe('main')">
                📬 সাবস্ক্রাইব করুন
              </button>
              <p class="nl-privacy">
                আপনার ইমেইল কখনো শেয়ার করা হবে না।
                <a href="/privacy">গোপনীয়তা নীতি</a>
              </p>
            </div>
          </div>
        </div>
      </section>`;
  },

  async subscribe(variant = 'main') {
    const emailId = variant === 'inline' ? 'nl-email-inline' : 'nl-email';
    const email   = document.getElementById(emailId)?.value.trim();
    const name    = variant === 'main' ? document.getElementById('nl-name')?.value.trim() : '';
    const btn     = variant === 'main'
      ? document.getElementById('nl-submit-btn')
      : null;

    // Validation
    if (!email || !_validEmail(email)) {
      window.Toast.show('সঠিক ইমেইল ঠিকানা দিন।', 'warning'); return;
    }

    // Interests (main form only)
    const interests = variant === 'main'
      ? [...document.querySelectorAll('input[name="interest"]:checked')].map(i => i.value)
      : [];

    if (btn) { btn.textContent = 'সাবস্ক্রাইব হচ্ছে...'; btn.disabled = true; }

    try {
      // ১. Firestore-এ সেভ করো
      await this._saveToFirestore({ email, name, interests });

      // ২. EmailJS দিয়ে welcome email পাঠাও
      await this._sendWelcomeEmail({ email, name });

      window.Toast.show('সাবস্ক্রাইব সফল হয়েছে! স্বাগত ইমেইল পাঠানো হয়েছে। 🎉', 'success', 5000);

      // Form reset
      if (variant === 'inline') {
        document.getElementById('nl-email-inline').value = '';
      } else {
        document.getElementById('nl-email').value = '';
        document.getElementById('nl-name').value  = '';
        document.querySelectorAll('input[name="interest"]').forEach(i => i.checked = false);
      }
    } catch (e) {
      const msg = e.code === 'already-exists'
        ? 'এই ইমেইলে আগেই সাবস্ক্রাইব করা আছে।'
        : 'সাবস্ক্রাইব ব্যর্থ হয়েছে।';
      window.Toast.show(msg, 'error');
    } finally {
      if (btn) { btn.textContent = '📬 সাবস্ক্রাইব করুন'; btn.disabled = false; }
    }
  },

  async _saveToFirestore({ email, name, interests }) {
    const { doc, setDoc, serverTimestamp } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    // email-কে doc ID হিসেবে ব্যবহার করো (duplicate avoid করতে)
    const safeId = email.replace(/[.@]/g, '_');
    await setDoc(
      doc(window.__firebase.db, 'subscribers', safeId),
      {
        email,
        name       : name || null,
        interests,
        subscribedAt: serverTimestamp(),
        active     : true,
      },
      { merge: false } // duplicate হলে error
    );
  },

  async _sendWelcomeEmail({ email, name }) {
    // EmailJS সেটআপ:
    // ১. emailjs.com → account তৈরি করো
    // ২. Email service যোগ করো (Gmail)
    // ৩. Template তৈরি করো
    // ৪. নিচে তোমার IDs বসাও
    const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ← EmailJS service ID
    const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // ← EmailJS template ID
    const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ← EmailJS public key

    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') return; // configured না থাকলে skip

    // EmailJS CDN dynamically লোড করো
    if (!window.emailjs) {
      await new Promise((res, rej) => {
        const s  = document.createElement('script');
        s.src    = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
      window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email  : email,
      to_name   : name || 'সাবস্ক্রাইবার',
      from_name : 'Tech Verse',
      reply_to  : 'hello@techverse.dev',
    });
  },

  /**
   * Unsubscribe — ইমেইল থেকে আনসাব্স্ক্রাইব
   */
  async unsubscribe(email) {
    try {
      const { doc, updateDoc } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const safeId = email.replace(/[.@]/g, '_');
      await updateDoc(doc(window.__firebase.db, 'subscribers', safeId), { active: false });
      window.Toast.show('আনসাবস্ক্রাইব সফল হয়েছে।', 'success');
    } catch {
      window.Toast.show('আনসাবস্ক্রাইব ব্যর্থ হয়েছে।', 'error');
    }
  },
};

function _validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

window.Newsletter = Newsletter;
