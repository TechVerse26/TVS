/**
 * CourseCard — Reusable card for courses
 */
export const CourseCard = {
  render(course, enrollment = null) {
    const progress = enrollment
      ? Math.round(((enrollment.completedLessons?.length || 0) / (course.lessons || 1)) * 100)
      : null;

    return `
      <article class="course-card">
        <a href="/course/${course.id}" class="course-card-cover">
          ${course.cover
            ? `<img src="${course.cover}" alt="${course.title}" loading="lazy"/>`
            : `<div class="course-cover-ph"><span>${(course.title||'T')[0]}</span></div>`}
          <span class="course-level level-${course.level}">${course.level || 'শিক্ষার্থী'}</span>
        </a>
        <div class="course-card-body">
          <div class="course-tags">
            ${(course.tags||[]).slice(0,2).map(t=>`<span class="tag-sm">${t}</span>`).join('')}
          </div>
          <h3 class="course-card-title">
            <a href="/course/${course.id}">${course.title}</a>
          </h3>
          <div class="course-card-meta">
            <span><i class="fa-solid fa-book-open icon-muted"></i> ${course.lessons || '—'} লেসন</span>
            <span><i class="fa-solid fa-clock icon-muted"></i> ${course.duration || '—'}</span>
          </div>
          ${progress !== null ? `
            <div class="card-progress">
              <div class="progress-track thin">
                <div class="progress-fill" style="width:${progress}%"></div>
              </div>
              <span class="progress-pct">${progress}%</span>
            </div>` : ''}
          <a href="/course/${course.id}" class="btn ${enrollment ? 'btn-outline' : 'btn-primary'} full-width" style="margin-top:.75rem">
            ${enrollment ? (progress === 100 ? '<i class="fa-solid fa-check"></i> সম্পন্ন' : 'চালিয়ে যান') : 'কোর্স দেখুন'}
          </a>
        </div>
      </article>`;
  },

  skeleton() {
    return `
      <article class="course-card skeleton-card" aria-hidden="true">
        <div class="course-card-cover sk-block" style="height:180px"></div>
        <div class="course-card-body">
          <div class="sk-line sk-short"></div>
          <div class="sk-line sk-full"></div>
          <div class="sk-line sk-mid"></div>
        </div>
      </article>`;
  }
};
