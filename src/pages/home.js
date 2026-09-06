/**
 * Home Page
 * Hero + Stats + Featured Posts + Categories
 */
import { PostCard } from '../components/postcard.js';

export async function renderHome() {
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="hero-orb orb-1"></div>
        <div class="hero-orb orb-2"></div>
        <div class="grid-lines"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge"><i class="fa-solid fa-rocket icon-accent"></i> বাংলাদেশের #১ টেক প্ল্যাটফর্ম</div>
        <h1 class="hero-title">
          প্রযুক্তি শিখুন,<br/>
          <span class="gradient-text">ভবিষ্যৎ গড়ুন</span>
        </h1>
        <p class="hero-sub">
          Tech Verse-এ পাবেন আধুনিক প্রযুক্তির টিউটোরিয়াল, টুলস, ব্লগ এবং
          একটি সক্রিয় শিক্ষার্থী কমিউনিটি — সম্পূর্ণ বাংলায়।
        </p>
        <div class="hero-actions">
          <a href="/learn" class="btn btn-primary">লার্নিং শুরু করুন</a>
          <button class="btn btn-ghost" onclick="window.Search.open()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            খুঁজুন <kbd>Ctrl K</kbd>
          </button>
        </div>
        <div class="hero-stats">
          <div class="stat"><strong id="stat-posts">—</strong><span>আর্টিকেল</span></div>
          <div class="stat"><strong id="stat-users">—</strong><span>শিক্ষার্থী</span></div>
          <div class="stat"><strong id="stat-tools">১২+</strong><span>টুলস</span></div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">বিষয় অনুযায়ী</h2>
        <div class="categories-grid" id="categories-grid">
          ${CATEGORIES.map(c => `
            <a href="/blog?cat=${c.slug}" class="cat-card">
              <span class="cat-icon icon-box icon-box-lg">${c.icon}</span>
              <span class="cat-name">${c.name}</span>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Latest Posts -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">সাম্প্রতিক পোস্ট</h2>
          <a href="/blog" class="see-all">সব দেখুন <i class="fa-solid fa-arrow-right"></i></a>
        </div>
        <div class="posts-grid" id="home-posts">
          ${[1,2,3].map(() => PostCard.skeleton()).join('')}
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-card">
          <h2>আজই শুরু করুন</h2>
          <p>Tech Verse-এ যোগ দিন এবং হাজারো শিক্ষার্থীর সাথে একসাথে শিখুন।</p>
          <a href="/auth?tab=register" class="btn btn-white">বিনামূল্যে রেজিস্টার করুন</a>
        </div>
      </div>
    </section>
  `;

  // Load real data async
  _loadStats();
  _loadPosts();
}

async function _loadStats() {
  try {
    const { collection, getCountFromServer } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const [postsSnap, usersSnap] = await Promise.all([
      getCountFromServer(collection(window.__firebase.db, 'posts')),
      getCountFromServer(collection(window.__firebase.db, 'users')),
    ]);
    const animate = (el, target) => {
      let n = 0; const step = Math.ceil(target / 30);
      const t = setInterval(() => {
        n = Math.min(n + step, target);
        el.textContent = n + '+';
        if (n >= target) clearInterval(t);
      }, 40);
    };
    animate(document.getElementById('stat-posts'), postsSnap.data().count);
    animate(document.getElementById('stat-users'), usersSnap.data().count);
  } catch {
    document.getElementById('stat-posts').textContent = '50+';
    document.getElementById('stat-users').textContent = '500+';
  }
}

async function _loadPosts() {
  const container = document.getElementById('home-posts');
  if (!container) return;
  try {
    const { collection, query, orderBy, limit, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const q    = query(collection(window.__firebase.db, 'posts'), orderBy('createdAt', 'desc'), limit(3));
    const snap = await getDocs(q);
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    container.innerHTML = posts.length
      ? posts.map(p => PostCard.render(p)).join('')
      : DEMO_POSTS.map(p => PostCard.render(p)).join('');
  } catch {
    container.innerHTML = DEMO_POSTS.map(p => PostCard.render(p)).join('');
  }
}

const CATEGORIES = [
  { slug: 'javascript', name: 'JavaScript', icon: '<i class="fa-solid fa-bolt"></i>' },
  { slug: 'firebase',   name: 'Firebase',   icon: '<i class="fa-solid fa-fire"></i>' },
  { slug: 'pwa',        name: 'PWA',        icon: '<i class="fa-solid fa-mobile-screen-button"></i>' },
  { slug: 'css',        name: 'CSS',        icon: '<i class="fa-solid fa-palette"></i>' },
  { slug: 'python',     name: 'Python',     icon: '<i class="fa-solid fa-terminal"></i>' },
  { slug: 'tools',      name: 'টুলস',        icon: '<i class="fa-solid fa-screwdriver-wrench"></i>' },
];

const DEMO_POSTS = [
  { id: '1', title: 'JavaScript ES2024 — নতুন কী এলো?', excerpt: 'এই বছরের সবচেয়ে গুরুত্বপূর্ণ JavaScript আপডেটগুলো নিয়ে বিস্তারিত আলোচনা।', category: 'JavaScript', readTime: '৫ মিনিট', createdAt: { toDate: () => new Date() } },
  { id: '2', title: 'Firebase Firestore সম্পূর্ণ গাইড', excerpt: 'Firestore দিয়ে রিয়েল-টাইম ডেটাবেস তৈরি করার সম্পূর্ণ পদ্ধতি বাংলায়।', category: 'Firebase',    readTime: '৮ মিনিট', createdAt: { toDate: () => new Date() } },
  { id: '3', title: 'PWA কী এবং কেন ব্যবহার করবেন?',   excerpt: 'Progressive Web App তৈরি করে আপনার ওয়েবসাইটকে অ্যাপে রূপান্তর করুন।',   category: 'PWA',        readTime: '৬ মিনিট', createdAt: { toDate: () => new Date() } },
];
