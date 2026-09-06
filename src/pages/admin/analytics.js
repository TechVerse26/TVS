/**
 * Analytics Dashboard — Firebase Analytics + Firestore stats
 */
import { requireAdmin } from '../components/adminGuard.js';
import { adminSidebar } from './admin/postEditor.js';

export async function renderAnalytics() {
  if (!await requireAdmin()) return;
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <div class="admin-layout">
      ${adminSidebar('/admin/analytics')}
      <main class="admin-main">
        <div class="admin-topbar">
          <h1>Analytics ড্যাশবোর্ড</h1>
          <select id="period-select" class="form-select" style="width:auto"
            onchange="Analytics.changePeriod(this.value)">
            <option value="7">শেষ ৭ দিন</option>
            <option value="30" selected>শেষ ৩০ দিন</option>
            <option value="90">শেষ ৯০ দিন</option>
          </select>
        </div>

        <!-- Overview Cards -->
        <div class="analytics-overview" id="analytics-overview">
          ${OV_CARDS.map(c => `
            <div class="ov-card">
              <div class="ov-icon">${c.icon}</div>
              <div class="ov-info">
                <strong id="ov-${c.key}">—</strong>
                <span>${c.label}</span>
                <small id="ov-${c.key}-change" class="ov-change"></small>
              </div>
            </div>`).join('')}
        </div>

        <!-- Top Posts -->
        <div class="analytics-grid">
          <div class="analytics-card">
            <h3>🔥 সবচেয়ে বেশি পঠিত পোস্ট</h3>
            <div id="top-posts">
              <div class="page-loader" style="min-height:100px"><span class="loader-ring"></span></div>
            </div>
          </div>

          <!-- Top Courses -->
          <div class="analytics-card">
            <h3>📚 সবচেয়ে এনরোলড কোর্স</h3>
            <div id="top-courses">
              <div class="page-loader" style="min-height:100px"><span class="loader-ring"></span></div>
            </div>
          </div>
        </div>

        <!-- Category breakdown -->
        <div class="analytics-card full-width" style="margin-top:1.5rem">
          <h3>📊 ক্যাটাগরি অনুযায়ী পোস্ট</h3>
          <div id="cat-breakdown" class="cat-chart"></div>
        </div>

        <!-- Firebase Analytics Note -->
        <div class="analytics-note">
          <span>💡</span>
          <p>বিস্তারিত ভিজিটর Analytics-এর জন্য
            <a href="https://analytics.google.com" target="_blank" rel="noopener">
              Firebase Analytics Console
            </a>
            দেখুন।
          </p>
        </div>
      </main>
    </div>`;

  _loadAnalytics(30);

  window.Analytics = {
    changePeriod(days) { _loadAnalytics(parseInt(days)); }
  };
}

async function _loadAnalytics(days) {
  try {
    const { collection, query, orderBy, limit, getDocs, where, Timestamp, getCountFromServer } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const db   = window.__firebase.db;
    const from = new Date(Date.now() - days * 86400000);

    const [postsSnap, usersSnap, enrollSnap, commentsSnap, topPostsSnap, topCoursesSnap] =
      await Promise.all([
        getCountFromServer(collection(db, 'posts')),
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'enrollments')),
        getCountFromServer(collection(db, 'comments')),
        getDocs(query(collection(db,'posts'), orderBy('views','desc'), limit(5))),
        getDocs(query(collection(db,'courses'), orderBy('enrollCount','desc'), limit(5))),
      ]);

    // Overview
    const stats = {
      posts   : postsSnap.data().count,
      users   : usersSnap.data().count,
      enrolls : enrollSnap.data().count,
      comments: commentsSnap.data().count,
    };
    Object.entries(stats).forEach(([k,v]) => {
      const el = document.getElementById(`ov-${k}`);
      if (el) el.textContent = v;
    });

    // Top posts
    const topPosts = topPostsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    document.getElementById('top-posts').innerHTML = topPosts.length
      ? _rankList(topPosts, p => p.title, p => `${p.views||0} ভিউ`, p => `/blog/${p.id}`)
      : '<p class="empty-state">ডেটা নেই।</p>';

    // Top courses
    const topCourses = topCoursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    document.getElementById('top-courses').innerHTML = topCourses.length
      ? _rankList(topCourses, c => c.title, c => `${c.enrollCount||0} এনরোল`, c => `/course/${c.id}`)
      : '<p class="empty-state">ডেটা নেই।</p>';

    // Category breakdown
    _renderCatChart(topPosts);

  } catch {
    ['posts','users','enrolls','comments'].forEach(k => {
      const el = document.getElementById(`ov-${k}`);
      if (el) el.textContent = '—';
    });
  }
}

function _rankList(items, getName, getMeta, getHref) {
  return `<ol class="rank-list">
    ${items.map((item, i) => `
      <li class="rank-item">
        <span class="rank-num">${i+1}</span>
        <div class="rank-info">
          <a href="${getHref(item)}" target="_blank">${getName(item)}</a>
          <span class="rank-meta">${getMeta(item)}</span>
        </div>
      </li>`).join('')}
  </ol>`;
}

function _renderCatChart(posts) {
  const catMap = {};
  posts.forEach(p => { catMap[p.category||'অন্যান্য'] = (catMap[p.category||'অন্যান্য']||0) + (p.views||0); });
  const max    = Math.max(...Object.values(catMap), 1);
  const wrap   = document.getElementById('cat-breakdown');
  wrap.innerHTML = Object.entries(catMap)
    .sort((a,b) => b[1]-a[1])
    .map(([cat, views]) => `
      <div class="cat-bar-row">
        <span class="cat-bar-label">${cat}</span>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${(views/max*100).toFixed(1)}%"></div>
        </div>
        <span class="cat-bar-val">${views} ভিউ</span>
      </div>`).join('') || '<p class="empty-state">ডেটা নেই।</p>';
}

const OV_CARDS = [
  { key:'posts',    icon:'📝', label:'মোট পোস্ট'       },
  { key:'users',    icon:'👥', label:'মোট ব্যবহারকারী'  },
  { key:'enrolls',  icon:'🎓', label:'মোট এনরোলমেন্ট'  },
  { key:'comments', icon:'💬', label:'মোট মন্তব্য'      },
];
