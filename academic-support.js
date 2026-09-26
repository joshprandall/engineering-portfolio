(() => {
  'use strict';
  const D = window.JR_ACADEMIC_SUPPORT;
  if (!D) return;
  const $ = (s, r=document) => r.querySelector(s);
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function scheduleRows(items=[]){
    return items.map(x => `<div class="support-row"><span>${esc(x.days || x.day)}</span><strong>${esc(x.hours)}</strong></div>`).join('');
  }

  function render(){
    const root = $('#academic-support-root');
    if (!root) return;
    const inst = D.institutions[0];
    const mslc = inst.resources.find(x => x.id === 'osu-mslc');
    const course = mslc.courses['MTH 231'];

    root.innerHTML = `
      <section class="support-hero">
        <p class="eyebrow">ACADEMIC SUPPORT / COURSE-AWARE LEARNING</p>
        <h1>Learning should know when you need a person.</h1>
        <p class="hero-lead">${esc(D.philosophy.summary)}</p>
        <div class="support-meta">
          <span>Resource data checked ${esc(D.sourceChecked)}</span>
          <a class="button primary" href="${esc(mslc.liveScheduleUrl)}" target="_blank" rel="noopener noreferrer">Check live OSU schedule ↗︎</a>
        </div>
      </section>

      <section class="support-section">
        <div class="section-heading"><div><p class="eyebrow">01 / SUPPORT MODEL</p><h2>Six layers of help around every course.</h2></div>
        <p>This structure is reusable for every class, term, institution, certification, and independent learning path.</p></div>
        <div class="support-grid">
          ${D.model.map((x,i)=>`<article class="support-card"><span class="support-number">${String(i+1).padStart(2,'0')}</span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></article>`).join('')}
        </div>
      </section>

      <section class="support-section">
        <div class="section-heading"><div><p class="eyebrow">02 / CURRENT COURSE SUPPORT</p><h2>MTH 231 - Elements of Discrete Mathematics</h2></div>
        <p>Fall 2026 support information is surfaced beside the course instead of living on a separate page you have to remember to check.</p></div>
        <div class="support-grid two">
          <article class="support-card">
            <p class="eyebrow">IN-PERSON MATHEMATICS</p>
            <h3>${esc(mslc.name)}</h3>
            <p>${esc(mslc.location)}</p>
            ${scheduleRows(mslc.term.inPerson)}
          </article>
          <article class="support-card">
            <p class="eyebrow">VIRTUAL MATHEMATICS</p>
            <h3>Remote tutoring</h3>
            <p>${esc(mslc.access.virtualPlatform)}. ${esc(mslc.access.login)}.</p>
            ${scheduleRows(mslc.term.virtual)}
          </article>
          <article class="support-card course-card">
            <p class="eyebrow">MTH 231 TUTOR SCHEDULE</p>
            <h3>Course-specific help</h3>
            ${course.tutors.map(t=>`<div class="tutor"><strong>${esc(t.name)}</strong>${scheduleRows(t.schedule)}</div>`).join('')}
          </article>
          <article class="support-card">
            <p class="eyebrow">EXAM SUPPORT</p>
            <h3>Make-up exam proctoring</h3>
            <p>Arrive with enough time to complete the exam before the center closes.</p>
            ${scheduleRows(mslc.term.examProctoring)}
          </article>
        </div>
      </section>

      <section class="support-section">
        <div class="section-heading"><div><p class="eyebrow">03 / STUDY TOGETHER</p><h2>A learning center is also a collaboration space.</h2></div>
        <p>The model treats study groups as a first-class learning tool, not an afterthought.</p></div>
        <div class="support-callout">
          <div><h3>Study-group mode</h3><p>Use course pages to organize a topic checklist, shared practice queue, problem-session agenda, and post-session review. Institutional spaces can be attached to the course as available places to meet.</p></div>
          <div><h3>Human escalation</h3><p>When a concept remains weak after lessons and practice, the platform can point to live tutoring, office hours, peer collaboration, or private-help options instead of simply repeating the same explanation.</p></div>
        </div>
      </section>

      <section class="support-section">
        <div class="section-heading"><div><p class="eyebrow">04 / RELATED SUPPORT</p><h2>Connect the course to the wider learning network.</h2></div>
        <p>Support should follow the subject: math, science, writing, advising, labs, and other centers can all attach to the same course graph.</p></div>
        <div class="resource-list">
          ${mslc.related.map(x=>`<article><strong>${esc(x.name)}</strong><span>${esc(x.area)}</span><small>${esc(x.location)}</small></article>`).join('')}
        </div>
      </section>

      <section class="support-section">
        <div class="section-heading"><div><p class="eyebrow">05 / DESIGN RULES</p><h2>What the website should inherit from this model.</h2></div></div>
        <div class="support-notes">
          ${mslc.notes.map(x=>`<p>✓ ${esc(x)}</p>`).join('')}
          <p>✓ Time-sensitive schedules are versioned and paired with a live-source link so stale information is obvious.</p>
          <p>✓ The same data model can attach support resources to every course added in future terms.</p>
        </div>
      </section>
    `;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();