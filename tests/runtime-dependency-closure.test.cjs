'use strict';
// The verified runtime package is built from manifests/site-routes.json. These checks re-derive
// local references with an independent parser and require every file that a packaged page,
// script, stylesheet or data file loads to be part of that page's dependency closure, so that
// files added later (or injected by scripts at run time) cannot silently drop out of the package.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'manifests/site-routes.json'), 'utf8')).routes;
const manifest = new Set(JSON.parse(fs.readFileSync(path.join(root, 'manifests/runtime-files.json'), 'utf8')).files.map(f => f.path));
const largeAssets = new Set(JSON.parse(fs.readFileSync(path.join(root, 'manifests/large-assets.json'), 'utf8')).assets.map(a => a.canonicalPath));
const NON_RUNTIME = new Set(['.github', 'docs', 'preservation', 'tests', 'tools', 'project-sources', 'manifests', 'release-upload', 'site-repair', 'examples', 'staging', '.asset-cache', 'node_modules', 'visual-qa']);

const closureOf = new Map(routes.map(r => [r.path, new Set([r.path, ...r.runtimeDependencies])]));
const packaged = new Set([...closureOf.values()].flatMap(s => [...s]));

const eligible = (p) => {
  const [top, ...rest] = p.split('/');
  return rest.length ? !NON_RUNTIME.has(top) : !p.startsWith('.') && p !== 'package.json' && p !== 'package-lock.json';
};
const exists = (p) => largeAssets.has(p) || fs.existsSync(path.join(root, p)) && fs.statSync(path.join(root, p)).isFile();

function resolve(source, value) {
  value = value.trim();
  if (!value || value.startsWith('#') || value.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.includes('${')) return null;
  const clean = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!clean) return null;
  const target = clean.startsWith('/') ? clean.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(source), clean));
  if (target.startsWith('..')) return null;
  return exists(target) ? target : exists(target.replace(/\/?$/, '/index.html')) ? target.replace(/\/?$/, '/index.html') : null;
}

// Independent extraction: HTML loading attributes, quoted file names in code or data, CSS url().
function references(source, text) {
  const out = [];
  if (source.endsWith('.html')) {
    for (const m of text.matchAll(/<([a-z]+)\b[^>]*?\s(src|href|poster|data-src)\s*=\s*(["'])(.*?)\3/gis)) {
      out.push({ value: m[4], navigation: m[1].toLowerCase() === 'a' });
    }
  }
  for (const m of text.matchAll(/["']([^"'\r\n]+\.(?:js|css|json|html|svg|png|jpg|jpeg|webp|mp3|wav|ogg|mp4|wasm|pck|md|txt|pdf|docx|zip)(?:\?[^"'\r\n]*)?)["']/g)) {
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 32).trimStart();
    if (!after.startsWith(':')) out.push({ value: m[1], navigation: false });
  }
  for (const m of text.matchAll(/url\(\s*["']?([^)"']+)/g)) out.push({ value: m[1], navigation: false });
  return out;
}

test('files that site scripts inject or fetch at run time are packaged with the pages that load them', () => {
  const needs = {
    'site-navigation.js': ['learning-academy.js', 'ai-mastery.js', 'security-toolkit.js', 'security-toolkit.css', 'project-mastery.js'],
    'learning-academy.js': ['learning-academy.css', 'assets/learning-academy.json'],
    'ai-mastery.js': ['ai-mastery.css', 'assets/ai-build-mastery.json'],
    'security-toolkit.js': ['assets/security-toolkit.json'],
    'project-mastery.js': ['project-mastery.css', 'assets/project-evaluation.json', 'project-showcase.js', 'software-showcase.js'],
    'site-audio.js': ['assets/audio/dark-theme-user-v32.wav', 'assets/audio/dark-theme-user-v32.mp3']
  };
  for (const [loader, deps] of Object.entries(needs)) {
    const pages = routes.filter(r => closureOf.get(r.path).has(loader));
    assert.ok(pages.length > 0, loader + ' is loaded by at least one page');
    for (const page of pages) for (const dep of deps) assert.ok(closureOf.get(page.path).has(dep), page.path + ' (via ' + loader + ') packages ' + dep);
  }
});

test('every route closure is complete: each local file it loads is in the same closure', () => {
  const problems = [];
  for (const route of routes) {
    const closure = closureOf.get(route.path);
    for (const file of closure) {
      if (!/\.(html|css|js|json)$/.test(file) || file.startsWith('deep-learning/') || !fs.existsSync(path.join(root, file))) continue;
      const text = fs.readFileSync(path.join(root, file), 'utf8');
      for (const ref of references(file, text)) {
        const target = resolve(file, ref.value);
        if (!target || !eligible(target)) continue;
        if (ref.navigation && target.endsWith('.html')) { if (!packaged.has(target)) problems.push(file + ' links to unpackaged page ' + target); continue; }
        if (!closure.has(target)) problems.push(route.path + ': ' + file + ' -> ' + target);
      }
    }
  }
  assert.deepEqual([...new Set(problems)].slice(0, 25), []);
});

test('every packaged file is listed in the runtime manifest and exists', () => {
  for (const file of packaged) {
    assert.ok(manifest.has(file), file + ' is in manifests/runtime-files.json');
    assert.ok(exists(file), file + ' exists in the repository or the verified large-asset manifest');
  }
});
