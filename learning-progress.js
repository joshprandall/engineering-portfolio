/* Calendar-based review scheduling. Existing completion/recall keys remain intact. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LearningProgress = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const calendarDate = (date = new Date()) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  function scheduledDate(days, now = new Date()) {
    const date = new Date(now);
    date.setDate(date.getDate() + Math.max(1, Math.min(365, Math.floor(Number(days) || 1))));
    return calendarDate(date);
  }
  function record(previous, correct, now = new Date()) {
    const r = previous && typeof previous === 'object' ? previous : {};
    const total = Math.max(0, Number(r.total) || 0);
    const previousCorrect = Math.min(total, Math.max(0, Number(r.correct) || 0));
    // Repeating the same answer on the same day is practice, not spaced retention.
    const newDay = r.last ? calendarDate(new Date(r.last)) !== calendarDate(now) : true;
    const streak = correct ? Math.max(1, (Number(r.streak) || 0) + (newDay ? 1 : 0)) : 0;
    return { ...r, total: total + 1, correct: previousCorrect + (correct ? 1 : 0), last: now.getTime(), lastResult: Boolean(correct), streak };
  }
  function nextReview(result, now = new Date()) {
    const intervals = [1, 3, 7, 14, 30];
    const days = result.lastResult ? intervals[Math.min(intervals.length - 1, Math.max(0, result.streak - 1))] : 1;
    return { date: scheduledDate(days, now), days, created: now.toISOString(), source: 'recall' };
  }
  function queue(plan, lessons, now = new Date(), domain = null) {
    const byId = new Map(lessons.map(l => [l.id, l]));
    return Object.entries(plan || {}).filter(([id, p]) => byId.has(id) && p && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && (!domain || byId.get(id).domain === domain))
      .map(([id, p]) => ({ lesson: byId.get(id), date: p.date, due: p.date <= calendarDate(now) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.lesson.title.localeCompare(b.lesson.title));
  }
  return { calendarDate, scheduledDate, record, nextReview, queue };
});
