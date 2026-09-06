/**
 * Footer Component
 */
export const Footer = {
  render() {
    document.getElementById('footer').innerHTML = `
      <div class="footer-inner">
        <div class="footer-brand">
          <a href="/" class="nav-logo">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="8" fill="url(#flg)"/>
              <path d="M8 14h12M14 8l6 6-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="flg" x1="0" y1="0" x2="28" y2="28">
                  <stop stop-color="#6366f1"/><stop offset="1" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Tech <strong>Verse</strong></span>
          </a>
          <p>শিক্ষা, প্রযুক্তি এবং উদ্ভাবনের স্মার্ট প্ল্যাটফর্ম।</p>
        </div>

        <div class="footer-links">
          <div class="footer-col">
            <h4>প্ল্যাটফর্ম</h4>
            <a href="/">হোম</a>
            <a href="/blog">ব্লগ</a>
            <a href="/learn">লার্নিং</a>
            <a href="/tools">টুলস</a>
          </div>
          <div class="footer-col">
            <h4>অ্যাকাউন্ট</h4>
            <a href="/auth">লগইন</a>
            <a href="/auth?tab=register">রেজিস্টার</a>
            <a href="/profile">প্রোফাইল</a>
          </div>
          <div class="footer-col">
            <h4>যোগাযোগ</h4>
            <a href="mailto:hello@techverse.dev">ইমেইল করুন</a>
            <a href="/about">আমাদের সম্পর্কে</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Tech Verse. সর্বস্বত্ব সংরক্ষিত।</span>
        <span class="footer-made">Made with <i class="fa-solid fa-heart icon-accent"></i> in Bangladesh</span>
      </div>
    `;
  }
};
