(() => {
  'use strict';
  const D = window.JR_ACADEMIC_COURSES;
  if (!D) return;
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function lessonCard(course, module, lesson){
    const concepts = (lesson.concepts || []).slice(0,6).map(x=>`<span>${esc(x)}</span>`).join('');
    const explanation = (lesson.explanation || []).map(x=>`<li>${esc(x)}</li>`).join('');
    const examples = (lesson.examples || []).map(x=>`<li>${esc(x)}</li>`).join('');
    const practice = (lesson.practice || []).map(x=>`<li>${esc(x)}</li>`).join('');
    return `
      <article class="support-card academic-lesson-card">
        <p class="eyebrow">${esc(course.code)} / ${esc(module.title)}</p>
        <h3>${esc(lesson.title)}</h3>
        <p>${esc(lesson.summary || '')}</p>
        <div class="academic-tags">${concepts}</div>
        ${explanation ? `<details><summary>Core explanation</summary><ul>${explanation}</ul></details>` : ''}
        ${examples ? `<details><summary>Examples</summary><ul>${examples}</ul></details>` : ''}
        ${practice ? `<details><summary>Practice</summary><ul>${practice}</ul></details>` : ''}
      </article>`;
  }

  function render(){
    const root = document.querySelector('#academic-courses-root');
    if (!root) return;
    root.innerHTML = D.terms.map(term => `
      <section class="support-section">
        <div class="section-heading">
          <div><p class="eyebrow">ACADEMIC ARCHIVE / ${esc(term.institution)}</p><h1>${esc(term.label)}</h1></div>
          <p>Course knowledge is retained as reusable lessons instead of disappearing after the term ends.</p>
        </div>
        ${term.courses.map(course => `
          <section class="academic-course">
            <div class="academic-course-head">
              <div><p class="eyebrow">${esc(course.status.toUpperCase())} COURSE</p><h2>${esc(course.code)} - ${esc(course.title)}</h2></div>
              <span>${esc(course.credits)} credits</span>
            </div>
            ${course.modules.map(module => `
              <div class="academic-module">
                <h3>${esc(module.title)}</h3>
                <div class="support-grid two">
                  ${module.lessons.map(lesson => lessonCard(course,module,lesson)).join('')}
                </div>
              </div>`).join('')}
          </section>`).join('')}
      </section>`).join('');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();