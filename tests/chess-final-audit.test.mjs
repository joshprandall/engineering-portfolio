import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const exists=relative=>fs.existsSync(path.join(root,relative));
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

const requiredTests=[
 'tests/chess-rules.test.mjs',
 'tests/chess-productization.test.mjs',
 'tests/chess-roster-integrity.test.mjs',
 'tests/chess-audio.test.mjs',
 'tests/chess-controller.test.cjs',
 'tests/chess-browser.test.cjs',
 'tests/chess-edition-boundary.test.cjs',
 'tests/chess-combat-choreography.test.mjs',
 'tests/chess-combat-vfx.test.mjs',
 'tests/chess-contact-physics.test.mjs',
 'tests/chess-role-readability.test.mjs',
 'tests/chess-material-language.test.mjs',
 'tests/chess-board-motion.test.mjs',
 'tests/chess-camera-choreography.test.mjs',
 'tests/chess-performance.test.cjs',
 'tests/chess-state-recovery.test.mjs',
 'tests/chess-faction-palette.test.mjs',
 'tests/chess-attack-followthrough.test.mjs',
 'tests/chess-presentation-phase.test.mjs',
 'tests/chess-windows-installed-smoke.cjs'
];

const requiredWorkflows=[
 '.github/workflows/crown-and-ash-release.yml',
 '.github/workflows/crown-and-ash-controller.yml',
 '.github/workflows/crown-and-ash-edition.yml',
 '.github/workflows/crown-and-ash-combat.yml',
 '.github/workflows/crown-and-ash-vfx.yml',
 '.github/workflows/crown-and-ash-contact-physics.yml',
 '.github/workflows/crown-and-ash-role-readability.yml',
 '.github/workflows/crown-and-ash-material-language.yml',
 '.github/workflows/crown-and-ash-board-motion.yml',
 '.github/workflows/crown-and-ash-camera.yml',
 '.github/workflows/crown-and-ash-performance.yml',
 '.github/workflows/crown-and-ash-state-recovery.yml'
];

for(const file of [...requiredTests,...requiredWorkflows])assert(exists(file),`Required release gate missing: ${file}`);
assert(exists('products/crown-and-ash-desktop/RELEASE-CHECKLIST.md'),'Release checklist must exist');

const pkg=JSON.parse(read('products/crown-and-ash-desktop/package.json'));
assert.equal(pkg.build.productName,'Crown & Ash');
assert.equal(pkg.build.asar,true);
assert.equal(pkg.build.win.executableName,'Crown-and-Ash');
assert.equal(pkg.build.nsis.runAfterFinish,false);
assert.equal(pkg.build.nsis.createDesktopShortcut,true);
assert.equal(pkg.build.nsis.createStartMenuShortcut,true);

const edition=read('games/3d-battle-chess/edition.js');
assert.match(edition,/basic/i,'Edition runtime must define Basic Edition behavior');
assert.match(edition,/full/i,'Edition runtime must define Full Edition behavior');

const release=read('.github/workflows/crown-and-ash-release.yml');
for(const phrase of [
 'Verify chess rules',
 'Verify productization contract',
 'Verify 30-character roster integrity',
 'Verify faction audio behavior',
 'Verify Xbox and PlayStation-compatible controller behavior',
 'Verify complete browser gameplay',
 'Build Windows installer',
 'Smoke-test packaged Windows runtime',
 'Verify installed Windows lifecycle',
 'Upload unsigned Windows test build'
])assert(release.includes(phrase),`Release workflow is missing required gate: ${phrase}`);

const checklist=read('products/crown-and-ash-desktop/RELEASE-CHECKLIST.md');
for(const heading of [
 'Product boundary','Core game state','Premium presentation','Input and accessibility',
 'Performance and offline operation','Windows packaging','Final human-only acceptance',
 'Non-destructive release boundary'
])assert(checklist.includes(heading),`Release checklist missing section: ${heading}`);

console.log('PASS Crown & Ash final audit contract: required gates, packaging policy, edition split, and release checklist are present.');
