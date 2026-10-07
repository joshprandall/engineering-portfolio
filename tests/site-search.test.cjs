/* Exercise the real search controller against deterministic requests and DOM events. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../site-search.js'), 'utf8');
const flush = async () => { for (let i = 0; i < 3; i++) await new Promise(setImmediate); };

function harness() {
  const document = new EventTarget();
  class Node extends EventTarget {
    constructor(tag = 'div') { super(); this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.value = ''; this._text = ''; }
    set textContent(value) { this._text = value; this.children = []; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    replaceChildren(...children) { this._text = ''; this.children = children; }
    append(...children) { this.children.push(...children); }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key]; }
    focus() { document.activeElement = this; }
    click() { this.dispatchEvent(new Event('click')); }
    showModal() { this.open = true; }
    close() { this.open = false; this.dispatchEvent(new Event('close')); }
  }
  const dialog = new Node('dialog'), input = new Node('input'), results = new Node(), open = new Node('button'), close = new Node('button');
  dialog.querySelector = () => close;
  const nodes = { '#search-dialog': dialog, '#search-input': input, '#search-results': results, '#search-open': open };
  document.querySelector = selector => nodes[selector];
  document.createElement = tag => new Node(tag);
  document.currentScript = { src: 'https://portfolio.test/~josh/site-search.js' };
  document.activeElement = open;
  const pending = [];
  vm.runInNewContext(code, { document, URL, fetch: url => new Promise((resolve, reject) => pending.push({ url, resolve, reject })), console });
  return { dialog, input, results, open, close, pending, document,
    type(value) { input.value = value; input.dispatchEvent(new Event('input')); },
    succeed(index, entries) { pending[index].resolve({ ok: true, json: async () => ({ entries }) }); }
  };
}

test('failed search stays actionable while editing and retries the current query', async () => {
  const h = harness();
  h.open.click(); h.type('quantum');
  h.pending[0].reject(new Error('connection interrupted'));
  await flush();
  assert.match(h.results.textContent, /unavailable/i);
  h.type('systems');
  assert.match(h.results.textContent, /unavailable/i, 'typing must not replace a failed request with a permanent Loading message');
  const retry = h.results.children.find(child => child.tagName === 'BUTTON');
  assert(retry, 'a failed request must offer a retry without closing the dialog');
  retry.click();
  assert.equal(h.pending.length, 2);
  assert.equal(h.results.getAttribute('aria-busy'), 'true');
  h.succeed(1, [{ path: 'projects.html', title: 'Systems engineering', text: 'Projects and tools' }, { path: 'learn.html', title: 'Quantum', text: 'Learning library' }]);
  await flush();
  assert.equal(h.results.getAttribute('aria-busy'), 'false');
  assert.match(h.results.textContent, /Systems engineering/);
  assert.doesNotMatch(h.results.textContent, /Quantum/);
  h.close.click();
  assert.equal(h.document.activeElement, h.open, 'closing search restores keyboard focus');
});

test('reopening pending search does not duplicate its request and uses the latest input', async () => {
  const h = harness();
  h.open.click(); h.type('quantum'); h.close.click(); h.open.click(); h.type('systems');
  assert.equal(h.pending.length, 1);
  h.succeed(0, [{ path: 'projects.html', title: 'Systems', text: 'Infrastructure' }, { path: 'learn.html', title: 'Quantum', text: 'Physics' }]);
  await flush();
  assert.match(h.results.textContent, /Systems/);
  assert.doesNotMatch(h.results.textContent, /Quantum/);
  h.type('unmatched topic');
  assert.match(h.results.textContent, /No matches/);
  h.close.click(); h.open.click();
  assert.equal(h.pending.length, 1, 'a loaded index is reused');
});
