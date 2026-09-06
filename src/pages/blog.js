/**
 * Blog Page — Post listing with category filter + pagination
 */
import { PostCard } from '../components/postcard.js';

let currentCat  = 'all';
let lastDoc     = null;
let loading     = false;
const PAGE_SIZE = 6;

export async function renderBlog() {
  const el  = document.getElementById('page-content');
  const cat = new URLSearchParams(window.location.search).get('cat') || 'all';
  currentCat = cat;
  lastDoc    = null;

  el.innerHTML = `
    <div class="page-hero small-hero">
      <div class="container">
        <h1>ব্লগ ও আর্টিকেল</h1>
        <p>প্রযুক্তির সর্বশেষ টিউটোরিয়াল, গাইড ও সংবাদ।</p>
      </div>
    </div>

    <div class="container blog-layout">
      <!-- Category Filter -->
      <div class="filter-bar" role="tablist" aria-label="ক্যাটাগরি ফিল্টার">
        <button class="filter-btn ${cat==='all'?'active':''}"
          data-cat="all" onclick="Blog.filter('all')" role="tab">সব</button>
        ${CATS.map(c => `
          <button class="filter-btn ${cat===c.slug?'active':''}"
            data-cat="${c.slug}" onclick="Blog.filter('${c.slug}')" role="tab">
            ${c.icon} ${c.name}
          </button>`).join('')}
      </div>

      <!-- Posts Grid -->
      <div class="posts-grid" id="blog-posts">
        ${[1,2,3,4,5,6].map(() => PostCard.skeleton()).join('')}
      </div>

      <!-- Load More -->
      <div class="load-more-wrap" id="load-more-wrap" hidden>
        <button class="btn btn-outline" id="load-more-btn" onclick="Blog.loadMore()">
          আরো লোড করুন
        </button>
      </div>
    </div>
  `;

  window.Blog = { filter: _filter, loadMore: _loadMore };
  await _fetchPosts(true);
}

async function _filter(cat) {
  currentCat = cat;
  lastDoc    = null;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === cat));
  await _fetchPosts(true);
}

async function _loadMore() {
  await _fetchPosts(false);
}

async function _fetchPosts(reset = false) {
  if (loading) return;
  loading = true;

  const container = document.getElementById('blog-posts');
  const btn       = document.getElementById('load-more-btn');
  const wrap      = document.getElementById('load-more-wrap');
  if (btn) btn.textContent = 'লোড হচ্ছে...';
  if (reset) container.innerHTML = [1,2,3,4,5,6].map(() => PostCard.skeleton()).join('');

  try {
    const { collection, query, orderBy, limit, startAfter, where, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    let q = collection(window.__firebase.db, 'posts');
    const constraints = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
    if (currentCat !== 'all') constraints.unshift(where('category', '==', currentCat));
    if (!reset && lastDoc)    constraints.push(startAfter(lastDoc));

    const snap  = await getDocs(query(q, ...constraints));
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    lastDoc     = snap.docs[snap.docs.length - 1] || null;

    if (reset) container.innerHTML = '';
    if (posts.length) {
      container.insertAdjacentHTML('beforeend', posts.map(p => PostCard.render(p)).join(''));
    } else if (reset) {
      container.innerHTML = '<p class="empty-state">এই ক্যাটাগরিতে এখনো কোনো পোস্ট নেই।</p>';
    }

    if (wrap) wrap.hidden = snap.docs.length < PAGE_SIZE;
  } catch {
    if (reset) {
      container.innerHTML = DEMO.map(p => PostCard.render(p)).join('');
    }
    if (wrap) wrap.hidden = true;
  } finally {
    loading = false;
    if (btn) btn.textContent = 'আরো লোড করুন';
  }
}

const CATS = [
  { slug: 'javascript', name: 'JavaScript', icon: '<i class="fa-solid fa-bolt"></i>' },
  { slug: 'firebase',   name: 'Firebase',   icon: '<i class="fa-solid fa-fire"></i>' },
  { slug: 'pwa',        name: 'PWA',        icon: '<i class="fa-solid fa-mobile-screen-button"></i>' },
  { slug: 'css',        name: 'CSS',        icon: '<i class="fa-solid fa-palette"></i>' },
  { slug: 'python',     name: 'Python',     icon: '<i class="fa-solid fa-terminal"></i>' },
];

const DEMO = [
  { id:'1', title:'JavaScript ES2024 নতুন ফিচার',      excerpt:'এই বছরের সবচেয়ে গুরুত্বপূর্ণ আপডেট।', category:'JavaScript', readTime:'৫ মিনিট', createdAt:{toDate:()=>new Date()} },
  { id:'2', title:'Firebase Firestore সম্পূর্ণ গাইড',  excerpt:'রিয়েল-টাইম ডেটাবেস ব্যবহারের পদ্ধতি।', category:'Firebase',   readTime:'৮ মিনিট', createdAt:{toDate:()=>new Date()} },
  { id:'3', title:'PWA কী এবং কেন ব্যবহার করবেন?',    excerpt:'Service Worker ও Manifest সম্পর্কে জানুন।', category:'PWA',      readTime:'৬ মিনিট', createdAt:{toDate:()=>new Date()} },
  { id:'4', title:'CSS Grid দিয়ে স্মার্ট লেআউট',       excerpt:'আধুনিক লেআউট তৈরির সহজ কৌশল।',         category:'CSS',       readTime:'৪ মিনিট', createdAt:{toDate:()=>new Date()} },
  { id:'5', title:'Python দিয়ে ওয়েব স্ক্র্যাপিং',     excerpt:'Beautiful Soup ব্যবহার করে ডেটা সংগ্রহ।', category:'Python',   readTime:'৭ মিনিট', createdAt:{toDate:()=>new Date()} },
  { id:'6', title:'Vanilla JS দিয়ে SPA তৈরি',          excerpt:'কোনো ফ্রেমওয়ার্ক ছাড়াই সিঙ্গেল পেজ অ্যাপ।', category:'JavaScript', readTime:'১০ মিনিট', createdAt:{toDate:()=>new Date()} },
];
