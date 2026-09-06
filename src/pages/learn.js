/**
 * Learning Page — Course listing with progress tracking
 */
import { CourseCard } from '../components/coursecard.js';

export async function renderLearn() {
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <div class="page-hero small-hero">
      <div class="container">
        <div class="hero-badge"><i class="fa-solid fa-book-open icon-accent"></i> সম্পূর্ণ বাংলায়</div>
        <h1>লার্নিং হাব</h1>
        <p>হাতে-কলমে শিখুন — ভিডিও, আর্টিকেল ও প্রজেক্ট সহ।</p>
      </div>
    </div>

    <div class="container learn-layout">

      <!-- Track Filter -->
      <div class="filter-bar" id="track-filter">
        ${TRACKS.map((t, i) => `
          <button class="filter-btn ${i === 0 ? 'active' : ''}"
            data-track="${t.slug}" onclick="LearnPage.filter('${t.slug}')">
            ${t.icon} ${t.name}
          </button>`).join('')}
      </div>

      <!-- Stats Bar -->
      <div class="learn-stats" id="learn-stats">
        <div class="ls-item"><strong id="ls-total">—</strong><span>কোর্স</span></div>
        <div class="ls-item"><strong id="ls-enrolled">—</strong><span>এনরোলড</span></div>
        <div class="ls-item"><strong id="ls-completed">—</strong><span>সম্পন্ন</span></div>
      </div>

      <!-- Course Grid -->
      <div class="courses-grid" id="courses-grid">
        ${[1,2,3,4,5,6].map(() => CourseCard.skeleton()).join('')}
      </div>
    </div>
  `;

  window.LearnPage = { filter: _filter };
  await _loadCourses('all');
  _loadUserStats();
}

async function _filter(track) {
  document.querySelectorAll('#track-filter .filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.track === track));
  await _loadCourses(track);
}

async function _loadCourses(track = 'all') {
  const grid = document.getElementById('courses-grid');
  grid.innerHTML = [1,2,3,4,5,6].map(() => CourseCard.skeleton()).join('');

  // Load user progress map if logged in
  let progressMap = {};
  if (window.__user) {
    try {
      const { collection, query, where, getDocs } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const snap = await getDocs(
        query(collection(window.__firebase.db, 'enrollments'),
          where('uid', '==', window.__user.uid))
      );
      snap.docs.forEach(d => { progressMap[d.data().courseId] = d.data(); });
    } catch { /* silent */ }
  }

  try {
    const { collection, query, orderBy, where, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    let q = collection(window.__firebase.db, 'courses');
    const constraints = [orderBy('order', 'asc')];
    if (track !== 'all') constraints.unshift(where('track', '==', track));
    const snap   = await getDocs(query(q, ...constraints));
    const courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    grid.innerHTML = courses.length
      ? courses.map(c => CourseCard.render(c, progressMap[c.id])).join('')
      : DEMO_COURSES.filter(c => track === 'all' || c.track === track)
          .map(c => CourseCard.render(c, progressMap[c.id])).join('');
  } catch {
    const filtered = track === 'all'
      ? DEMO_COURSES
      : DEMO_COURSES.filter(c => c.track === track);
    grid.innerHTML = filtered.map(c => CourseCard.render(c)).join('');
  }
}

async function _loadUserStats() {
  const total = document.getElementById('ls-total');
  if (total) total.textContent = DEMO_COURSES.length + '+';

  if (!window.__user) {
    document.getElementById('ls-enrolled').textContent  = '—';
    document.getElementById('ls-completed').textContent = '—';
    return;
  }
  try {
    const { collection, query, where, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const snap = await getDocs(
      query(collection(window.__firebase.db, 'enrollments'),
        where('uid', '==', window.__user.uid))
    );
    const enrollments = snap.docs.map(d => d.data());
    document.getElementById('ls-enrolled').textContent  = enrollments.length;
    document.getElementById('ls-completed').textContent = enrollments.filter(e => e.completed).length;
  } catch { /* silent */ }
}

const TRACKS = [
  { slug: 'all',        name: 'সব',         icon: '<i class="fa-solid fa-globe"></i>' },
  { slug: 'webdev',     name: 'Web Dev',    icon: '<i class="fa-solid fa-laptop-code"></i>' },
  { slug: 'javascript', name: 'JavaScript', icon: '<i class="fa-solid fa-bolt"></i>' },
  { slug: 'firebase',   name: 'Firebase',   icon: '<i class="fa-solid fa-fire"></i>' },
  { slug: 'python',     name: 'Python',     icon: '<i class="fa-solid fa-terminal"></i>' },
  { slug: 'design',     name: 'UI/UX',      icon: '<i class="fa-solid fa-palette"></i>' },
];

export const DEMO_COURSES = [
  { id:'c1', title:'HTML & CSS ফাউন্ডেশন', track:'webdev',     level:'শিক্ষার্থী', lessons:12, duration:'৬ ঘণ্টা', cover:'', tags:['html','css'] },
  { id:'c2', title:'JavaScript সম্পূর্ণ গাইড', track:'javascript', level:'মধ্যবর্তী', lessons:24, duration:'১৫ ঘণ্টা', cover:'', tags:['js','es6'] },
  { id:'c3', title:'Firebase দিয়ে Real-time App', track:'firebase',   level:'মধ্যবর্তী', lessons:18, duration:'১০ ঘণ্টা', cover:'', tags:['firebase','auth'] },
  { id:'c4', title:'Python প্রোগ্রামিং বেসিক',  track:'python',     level:'শিক্ষার্থী', lessons:15, duration:'৮ ঘণ্টা',  cover:'', tags:['python','basics'] },
  { id:'c5', title:'UI/UX ডিজাইন প্রিন্সিপাল', track:'design',     level:'শিক্ষার্থী', lessons:10, duration:'৫ ঘণ্টা',  cover:'', tags:['ui','figma'] },
  { id:'c6', title:'PWA ও Service Worker',      track:'webdev',     level:'উন্নত',    lessons:8,  duration:'৪ ঘণ্টা',  cover:'', tags:['pwa','sw'] },
];
