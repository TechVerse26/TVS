/**
 * Lesson Reader Page — Content + Mark complete + Navigation
 */
import { Auth } from '../components/auth.js';

export async function renderLesson() {
  const { id: courseId, lessonId } = window.__routeParams || {};
  const el = document.getElementById('page-content');
  if (!courseId || !lessonId) { window.App.navigate('/learn'); return; }

  const user = await Auth.requireAuth('/auth');
  el.innerHTML = `<div class="page-loader"><span class="loader-ring"></span></div>`;

  let lesson    = null;
  let allLessons= [];
  let enrollment= null;

  try {
    const { doc, getDoc, collection, query, orderBy, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    const [lessonSnap, lessonsSnap, enrollSnap] = await Promise.all([
      getDoc(doc(window.__firebase.db, 'courses', courseId, 'lessons', lessonId)),
      getDocs(query(collection(window.__firebase.db, 'courses', courseId, 'lessons'), orderBy('order','asc'))),
      getDoc(doc(window.__firebase.db, 'enrollments', `${user.uid}_${courseId}`))
    ]);

    if (!lessonSnap.exists()) { (await import('./404.js')).render404(); return; }
    lesson     = { id: lessonSnap.id, ...lessonSnap.data() };
    allLessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    enrollment = enrollSnap.exists() ? enrollSnap.data() : { completedLessons: [] };
  } catch {
    lesson     = DEMO_LESSON;
    allLessons = DEMO_ALL;
    enrollment = { completedLessons: [] };
  }

  const completedSet = new Set(enrollment.completedLessons || []);
  const isDone       = completedSet.has(lessonId);
  const curIdx       = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson   = allLessons[curIdx - 1];
  const nextLesson   = allLessons[curIdx + 1];
  const progress     = Math.round((completedSet.size / allLessons.length) * 100);

  el.innerHTML = `
    <div class="lesson-page">
      <!-- Lesson Topbar -->
      <div class="lesson-topbar">
        <div class="lesson-topbar-inner">
          <a href="/course/${courseId}" class="back-link"><i class="fa-solid fa-arrow-left"></i> কোর্সে ফিরুন</a>
          <div class="lesson-progress-mini">
            <div class="progress-track thin">
              <div class="progress-fill" style="width:${progress}%"></div>
            </div>
            <span>${progress}%</span>
          </div>
        </div>
      </div>

      <div class="lesson-body">
        <!-- Sidebar — Lessons List -->
        <aside class="lesson-sidebar" id="lesson-sidebar">
          <div class="lesson-sidebar-inner">
            <h4>লেসনসমূহ</h4>
            ${allLessons.map((l, i) => `
              <a href="/course/${courseId}/lesson/${l.id}"
                class="ls-item ${l.id === lessonId ? 'active' : ''} ${completedSet.has(l.id) ? 'done' : ''}">
                <span class="ls-num">${completedSet.has(l.id) ? '<i class="fa-solid fa-check"></i>' : i + 1}</span>
                <span class="ls-title">${l.title}</span>
              </a>`).join('')}
          </div>
        </aside>

        <!-- Main Content -->
        <main class="lesson-main">
          <div class="lesson-type-badge">
            ${lesson.type === 'video' ? '<i class="fa-solid fa-clapperboard"></i> ভিডিও লেসন' : '<i class="fa-solid fa-file-lines"></i> পড়ার লেসন'}
          </div>
          <h1 class="lesson-title">${lesson.title}</h1>

          ${lesson.type === 'video' && lesson.videoUrl ? `
            <div class="video-wrap">
              <iframe src="${lesson.videoUrl}" allowfullscreen
                title="${lesson.title}" loading="lazy"></iframe>
            </div>` : ''}

          <div class="lesson-content">
            ${_md(lesson.content || DEMO_LESSON.content)}
          </div>

          <!-- Actions -->
          <div class="lesson-actions">
            ${prevLesson ? `
              <a href="/course/${courseId}/lesson/${prevLesson.id}" class="btn btn-ghost">
                <i class="fa-solid fa-arrow-left"></i> আগের লেসন
              </a>` : '<div></div>'}

            <button class="btn ${isDone ? 'btn-ghost' : 'btn-primary'}" id="complete-btn"
              onclick="LessonPage.markComplete()" ${isDone ? 'disabled' : ''}>
              ${isDone ? '<i class="fa-solid fa-check"></i> সম্পন্ন হয়েছে' : 'সম্পন্ন হিসেবে চিহ্নিত করুন'}
            </button>

            ${nextLesson ? `
              <a href="/course/${courseId}/lesson/${nextLesson.id}" class="btn btn-primary">
                পরের লেসন <i class="fa-solid fa-arrow-right"></i>
              </a>` : `
              <button class="btn btn-primary" onclick="LessonPage.finish()">
                <i class="fa-solid fa-trophy"></i> কোর্স শেষ করুন
              </button>`}
          </div>
        </main>
      </div>
    </div>
  `;

  window.LessonPage = {
    async markComplete() {
      const btn = document.getElementById('complete-btn');
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> সেভ হচ্ছে...'; btn.disabled = true;
      try {
        const { doc, updateDoc, arrayUnion } =
          await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        await updateDoc(
          doc(window.__firebase.db, 'enrollments', `${user.uid}_${courseId}`),
          { completedLessons: arrayUnion(lessonId) }
        );
        btn.innerHTML = '<i class="fa-solid fa-check"></i> সম্পন্ন হয়েছে';
        window.Toast.show('লেসন সম্পন্ন! <i class="fa-solid fa-circle-check"></i>', 'success');
        // Update sidebar
        document.querySelector(`.ls-item[href="/course/${courseId}/lesson/${lessonId}"]`)
          ?.classList.add('done');
        if (nextLesson) setTimeout(() => window.App.navigate(`/course/${courseId}/lesson/${nextLesson.id}`), 1200);
      } catch {
        window.Toast.show('সেভ ব্যর্থ হয়েছে।', 'error');
        btn.disabled = false; btn.innerHTML = 'সম্পন্ন হিসেবে চিহ্নিত করুন';
      }
    },

    async finish() {
      try {
        const { doc, updateDoc } =
          await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        await updateDoc(
          doc(window.__firebase.db, 'enrollments', `${user.uid}_${courseId}`),
          { completed: true, completedAt: new Date() }
        );
        window.Toast.show('অভিনন্দন! কোর্স সম্পন্ন হয়েছে! <i class="fa-solid fa-trophy"></i>', 'success');
        window.App.navigate(`/course/${courseId}`);
      } catch {
        window.App.navigate(`/course/${courseId}`);
      }
    }
  };
}

function _md(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g,'</p><p>')
    .replace(/^(?!<[hupol])/gm,'')
    .replace(/^([^<\n].+)$/gm,'<p>$1</p>');
}

const DEMO_LESSON = {
  id: 'l1', title: 'পরিচিতি ও সেটআপ', type: 'text', order: 1,
  content: `## এই লেসনে শিখবেন

এই লেসনে আমরা মূল ধারণাগুলো পরিচয় করিয়ে দেব।

## সেটআপ

প্রথমে নিচের টুলগুলো ইনস্টল করুন:

- **VS Code** — কোড এডিটর
- **Node.js** — রানটাইম এনভায়রনমেন্ট
- **Git** — ভার্সন কন্ট্রোল

## প্রথম পদক্ষেপ

\`\`\`
// আপনার প্রথম কোড
console.log("Tech Verse-এ স্বাগতম!");
\`\`\`

এই কোড রান করলে কনসোলে বার্তা দেখতে পাবেন।`
};

const DEMO_ALL = [
  { id:'l1', title:'পরিচিতি ও সেটআপ',        type:'text',  order:1 },
  { id:'l2', title:'মূল ধারণাসমূহ',           type:'video', order:2 },
  { id:'l3', title:'হাতে-কলমে প্র্যাকটিস',   type:'video', order:3 },
];
