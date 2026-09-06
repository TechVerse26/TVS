/**
 * Course Detail Page — Lessons list, enroll, progress tracker
 */
export async function renderCourse() {
  const id = window.__routeParams?.id;
  const el = document.getElementById('page-content');
  if (!id) { window.App.navigate('/learn'); return; }

  el.innerHTML = `<div class="page-loader"><span class="loader-ring"></span></div>`;

  let course     = null;
  let lessons    = [];
  let enrollment = null;

  try {
    const { doc, getDoc, collection, query, orderBy, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    const [courseSnap, lessonsSnap] = await Promise.all([
      getDoc(doc(window.__firebase.db, 'courses', id)),
      getDocs(query(collection(window.__firebase.db, 'courses', id, 'lessons'), orderBy('order', 'asc')))
    ]);

    if (!courseSnap.exists()) { (await import('./404.js')).render404(); return; }
    course  = { id: courseSnap.id, ...courseSnap.data() };
    lessons = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Load enrollment if logged in
    if (window.__user) {
      const enrollSnap = await getDoc(
        doc(window.__firebase.db, 'enrollments', `${window.__user.uid}_${id}`)
      );
      if (enrollSnap.exists()) enrollment = enrollSnap.data();
    }
  } catch {
    // Demo fallback
    const { DEMO_COURSES } = await import('./learn.js');
    course  = DEMO_COURSES.find(c => c.id === id) || DEMO_COURSES[0];
    lessons = DEMO_LESSONS;
  }

  const completedSet = new Set(enrollment?.completedLessons || []);
  const progress     = lessons.length ? Math.round((completedSet.size / lessons.length) * 100) : 0;
  const isEnrolled   = !!enrollment;

  el.innerHTML = `
    <div class="course-page">
      <!-- Hero -->
      <div class="course-hero">
        <div class="container">
          <div class="course-hero-inner">
            <div class="course-hero-info">
              <div class="breadcrumb">
                <a href="/learn">লার্নিং</a>
                <span><i class="fa-solid fa-chevron-right icon-muted" style="font-size:.7em"></i></span>
                <span>${course.track || 'কোর্স'}</span>
              </div>
              <h1>${course.title}</h1>
              <p>${course.description || 'এই কোর্সে হাতে-কলমে শিখবেন — ধাপে ধাপে।'}</p>
              <div class="course-meta-row">
                <span class="course-level level-${course.level}">${course.level || 'শিক্ষার্থী'}</span>
                <span><i class="fa-solid fa-book-open icon-muted"></i> ${course.lessons || lessons.length} লেসন</span>
                <span><i class="fa-solid fa-clock icon-muted"></i> ${course.duration || '—'}</span>
              </div>
              ${isEnrolled ? `
                <div class="progress-bar-wrap">
                  <div class="progress-label">
                    <span>অগ্রগতি</span>
                    <span>${progress}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width:${progress}%"></div>
                  </div>
                </div>
                <a href="/course/${id}/lesson/${lessons.find(l=>!completedSet.has(l.id))?.id || lessons[0]?.id}" class="btn btn-primary">
                  ${progress > 0 ? 'পড়া চালিয়ে যান <i class="fa-solid fa-arrow-right"></i>' : 'শুরু করুন <i class="fa-solid fa-arrow-right"></i>'}
                </a>
              ` : `
                <button class="btn btn-primary" id="enroll-btn" onclick="CoursePage.enroll()">
                  ${window.__user ? 'বিনামূল্যে এনরোল করুন' : 'লগইন করে এনরোল করুন'}
                </button>
              `}
            </div>
            <div class="course-hero-cover">
              ${course.cover
                ? `<img src="${course.cover}" alt="${course.title}"/>`
                : `<div class="course-cover-placeholder"><span>${(course.title||'T')[0]}</span></div>`}
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="container course-layout">
        <!-- Lessons List -->
        <div class="lessons-section">
          <h2>লেসন তালিকা</h2>
          <div class="lessons-list" id="lessons-list">
            ${lessons.map((l, i) => _lessonItem(l, i, completedSet, isEnrolled)).join('')}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="course-sidebar">
          <div class="sidebar-card">
            <h3>এই কোর্সে শিখবেন</h3>
            <ul class="what-learn">
              ${(course.outcomes || DEMO_OUTCOMES).map(o => `<li><i class="fa-solid fa-check icon-accent"></i> ${o}</li>`).join('')}
            </ul>
          </div>
          ${course.tags?.length ? `
            <div class="sidebar-card">
              <h3>ট্যাগ</h3>
              <div class="tag-list">
                ${course.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>
    </div>
  `;

  window.CoursePage = {
    async enroll() {
      if (!window.__user) { window.App.navigate('/auth'); return; }
      const btn = document.getElementById('enroll-btn');
      btn.textContent = 'এনরোল হচ্ছে...'; btn.disabled = true;
      try {
        const { setDoc, doc } =
          await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        await setDoc(
          doc(window.__firebase.db, 'enrollments', `${window.__user.uid}_${id}`),
          { uid: window.__user.uid, courseId: id, enrolledAt: new Date(), completedLessons: [], completed: false }
        );
        window.Toast.show('এনরোল সফল হয়েছে! <i class="fa-solid fa-circle-check"></i>', 'success');
        window.App.navigate(`/course/${id}`);
      } catch (e) {
        window.Toast.show('এনরোল ব্যর্থ হয়েছে।', 'error');
        btn.textContent = 'এনরোল করুন'; btn.disabled = false;
      }
    }
  };
}

function _lessonItem(lesson, index, completedSet, isEnrolled) {
  const done   = completedSet.has(lesson.id);
  const locked = !isEnrolled && index > 0;
  return `
    <div class="lesson-item ${done ? 'done' : ''} ${locked ? 'locked' : ''}">
      <div class="lesson-num">${done ? '<i class="fa-solid fa-check"></i>' : locked ? '<i class="fa-solid fa-lock"></i>' : index + 1}</div>
      <div class="lesson-info">
        <div class="lesson-title">
          ${locked
            ? lesson.title
            : `<a href="/course/${window.__routeParams?.id}/lesson/${lesson.id}">${lesson.title}</a>`}
        </div>
        <div class="lesson-meta">
          ${lesson.type === 'video' ? '<i class="fa-solid fa-clapperboard"></i> ভিডিও' : '<i class="fa-solid fa-file-lines"></i> পড়া'}
          ${lesson.duration ? `· ${lesson.duration}` : ''}
        </div>
      </div>
      ${done ? '<span class="lesson-badge done-badge">সম্পন্ন</span>' : ''}
    </div>`;
}

const DEMO_LESSONS = [
  { id:'l1', title:'পরিচিতি ও সেটআপ',        type:'video', duration:'১৫ মি', order:1 },
  { id:'l2', title:'মূল ধারণাসমূহ',           type:'text',  duration:'২০ মি', order:2 },
  { id:'l3', title:'হাতে-কলমে প্র্যাকটিস',   type:'video', duration:'৩০ মি', order:3 },
  { id:'l4', title:'প্রজেক্ট তৈরি — পর্ব ১', type:'video', duration:'৪৫ মি', order:4 },
  { id:'l5', title:'প্রজেক্ট তৈরি — পর্ব ২', type:'video', duration:'৪৫ মি', order:5 },
  { id:'l6', title:'রিভিউ ও কুইজ',            type:'text',  duration:'১০ মি', order:6 },
];

const DEMO_OUTCOMES = [
  'মূল ধারণাগুলো বুঝতে পারবেন',
  'নিজে প্রজেক্ট তৈরি করতে পারবেন',
  'বাস্তব সমস্যা সমাধান করতে পারবেন',
  'পরবর্তী লেভেলে যাওয়ার জন্য প্রস্তুত হবেন',
];
