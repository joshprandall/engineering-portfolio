'use strict';
// The Evidence view of each authored core Leadership lesson, and of every practice record derived
// from it, must list the sources the lesson actually relies on. Before this change 407 Leadership
// records showed the same two SRE chapters (service level objectives and postmortems) whatever
// their topic, including total cost of ownership, hiring and vendor lock-in.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const raw = fs.readFileSync(path.join(root, 'knowledge-data.js'), 'utf8');
const knowledge = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'verification-manifest.json'), 'utf8'));
const before = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'baselines', 'leadership-references.json.gz'))).toString('utf8'));
const lessons = new Map(knowledge.lessons.map(l => [l.id, l]));
const records = new Map(manifest.records.map(r => [r.id, r]));

const SLO = 'https://sre.google/sre-book/service-level-objectives/';
const RISK = 'https://sre.google/sre-book/embracing-risk/';
const INCIDENTS = 'https://sre.google/sre-book/managing-incidents/';
const POSTMORTEM = 'https://sre.google/sre-book/postmortem-culture/';
const INTRO = 'https://sre.google/sre-book/introduction/';
const TOIL = 'https://sre.google/sre-book/eliminating-toil/';
const EBP = 'https://sre.google/workbook/error-budget-policy/';
const NIST_IR = 'https://csrc.nist.gov/pubs/sp/800/61/r3/final';
const EXPECTED = {
  'leadership-tco': ['https://gaoinnovations.gov/cost-guide/types-of-cost-estimates.html'],
  'leadership-budget-capex-opex': ['https://www.ifrs.org/content/dam/ifrs/publications/html-standards/english/2024/issued/ias16.html'],
  'leadership-incident-command': [INCIDENTS, NIST_IR],
  'lab-incident-tabletop': ['https://doi.org/10.6028/NIST.SP.800-84', NIST_IR],
  'leadership-severity': ['https://www.nist.gov/system/files/documents/2024/02/21/CSF%202.0%20Implementation%20Examples.pdf', NIST_IR],
  'leadership-lab-postmortem': [POSTMORTEM, NIST_IR],
  'leadership-postmortem-practice': [POSTMORTEM],
  'leadership-incident-roles': [INCIDENTS, NIST_IR],
  'leadership-change': [INTRO, 'https://dora.dev/capabilities/streamlining-change-approval/'],
  'leadership-delegation': ['https://core.ac.uk/download/205208894.pdf'],
  'leadership-one-on-one': ['https://ninercommons.charlotte.edu/record/2294/files/Flinchum_uncc_0694D_13278.pdf'],
  'leadership-feedback': ['https://doi.org/10.1037/0033-2909.119.2.254'],
  'leadership-exec-communication': ['https://digital.gov/guides/plain-language/principles/organize'],
  'leadership-postmortem': [POSTMORTEM, NIST_IR],
  'leadership-error-budget': [RISK, SLO],
  'leadership-runbook': [INTRO],
  'leadership-service-owner': ['https://queue.acm.org/detail.cfm?id=1142065'],
  'leadership-capacity': [INTRO],
  'leadership-escalation': [EBP, 'https://www.nist.gov/system/files/documents/2024/02/21/CSF%202.0%20Implementation%20Examples.pdf'],
  'leadership-metrics': [SLO],
  'leadership-sli-definition': [SLO],
  'leadership-error-budget-policy': [EBP, SLO],
  'leadership-toil': [TOIL],
  'leadership-service-levels': [SLO],
  'leadership-raci': ['https://towardszero.nsw.gov.au/sites/default/files/2021-05/RACI%20matrix.pdf'],
  'leadership-roadmap': ['https://www.gov.uk/service-manual/agile-delivery/developing-a-roadmap'],
  'leadership-tech-debt': ['https://c2.com/doc/oopsla92.html'],
  'leadership-prioritization': [RISK],
  'leadership-psych-safety': ['https://doi.org/10.2307/2666999'],
  'leadership-hiring': ['https://www.siop.org/tip-article/is-cognitive-ability-the-best-predictor-of-job-performance'],
  'leadership-vendor': ['https://doi.org/10.6028/NIST.SP.800-161r1-upd1'],
  'leadership-vendor-lockin': ['https://eur-lex.europa.eu/eli/reg/2023/2854/oj']
};

const coreOf = (lesson) => EXPECTED[lesson.id] ? lesson.id : EXPECTED[lesson.verification?.parentLessonId] ? lesson.verification.parentLessonId : null;

test('every lesson keeps its references, source count, manifest entry and parent evidence in step', () => {
  assert.equal(knowledge.lessons.length, 8000);
  for (const lesson of knowledge.lessons) {
    const record = records.get(lesson.id);
    assert.ok(record, lesson.id + ' is in the verification manifest');
    assert.deepEqual(record.sources.map(s => [s.title, s.url]), lesson.references.map(r => [r[0], r[1]]), lesson.id + ': manifest sources match the lesson');
    assert.equal(lesson.verification.sourceCount, lesson.references.length, lesson.id + ': source count');
    assert.equal(record.reviewed, lesson.verification.reviewed, lesson.id + ': review date');
    const parent = lesson.verification.parentLessonId;
    if (parent) assert.deepEqual(lesson.references, lessons.get(parent).references, lesson.id + ' inherits its parent’s evidence');
  }
});

test('the 32 core Leadership lessons and their practice records cite the sources their lessons use', () => {
  let covered = 0;
  for (const lesson of knowledge.lessons.filter(l => l.domain === 'leadership')) {
    const core = coreOf(lesson);
    if (!core) {
      assert.deepEqual(lesson.references, before[lesson.id], lesson.id + ' must be unchanged');
      continue;
    }
    covered++;
    assert.deepEqual(lesson.references.map(r => r[1]), EXPECTED[core], lesson.id);
    for (const [title] of lesson.references) assert.ok(title && title.length > 10, lesson.id + ': titled reference');
  }
  assert.equal(covered, 464, 'the 32 core lessons plus their 432 derived records');
});

test('no Leadership record still shows the generic pair of SRE chapters', () => {
  const generic = knowledge.lessons.filter(l => l.domain === 'leadership' && l.references.map(r => r[1]).join(' ') === SLO + ' ' + POSTMORTEM);
  assert.deepEqual(generic.map(l => l.id), []);
});
