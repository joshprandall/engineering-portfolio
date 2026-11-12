'use strict';
// Synthetic, offline teaching model for conditional HTTP request decisions.
// Run: node --test tests/software-api-conditional-precedence-20261112.test.cjs
// References: RFC 9110 sections 8.8.3.2, 13.1.1-13.1.4, 13.2.1-13.2.2, 14.2.
// https://www.rfc-editor.org/rfc/rfc9110.html#section-13.2.2
// Not an HTTP parser, origin implementation, network test, or conformance suite.
const test = require('node:test');
const assert = require('node:assert/strict');

// Only one current selected representation and one satisfiable byte-range
// request are modeled. PUT accepts a replacement and DELETE removes the target;
// this fixture elects a 412 response for a failed If-Match or If-Unmodified-Since
// rather than the standards-permitted already-applied 2xx exception.
const LAST_MODIFIED = 1700000000; // synthetic epoch seconds
const tag = v => {
  const m = /^(W\/)?"([^"]*)"$/.exec(v);
  if (!m) throw new TypeError('Expected a single quoted HTTP entity-tag: ' + v);
  return { weak: Boolean(m[1]), opaque: m[2] };
};
const strongMatch = (a, b) => {
  const x = tag(a), y = tag(b);
  return !x.weak && !y.weak && x.opaque === y.opaque;
};
const weakMatch = (a, b) => tag(a).opaque === tag(b).opaque;
const matches = (field, current, exists, compare) =>
  field === '*' ? exists : Boolean(exists && field.some(v => compare(v, current)));

function decide(r = {}) {
  const method = r.method || 'GET';
  const exists = r.exists !== false;
  const etag = r.etag || '"v1"';
  const modified = r.modified === undefined ? LAST_MODIFIED : r.modified;
  const preliminary = r.preliminary === undefined
    ? ({ GET: exists ? 200 : 404, HEAD: exists ? 200 : 404,
         PUT: exists ? 204 : 201, DELETE: exists ? 204 : 404 })[method]
    : r.preliminary;
  assert.ok([200, 201, 204, 401, 404].includes(preliminary), 'Fixture needs known prior status');
  // RFC 9110 13.2.1: authorization and other prior failures beat preconditions.
  if (![200, 201, 204, 412].includes(preliminary)) return preliminary;
  if (r.ifMatch !== undefined) {
    if (!matches(r.ifMatch, etag, exists, strongMatch)) return 412;
  } else if (r.ifUnmodifiedSince !== undefined && modified !== null) {
    if (modified > r.ifUnmodifiedSince) return 412;
  }
  if (r.ifNoneMatch !== undefined) {
    if (matches(r.ifNoneMatch, etag, exists, weakMatch)) {
      return method === 'GET' || method === 'HEAD' ? 304 : 412;
    }
  } else if ((method === 'GET' || method === 'HEAD') &&
             r.ifModifiedSince !== undefined && modified !== null) {
    if (modified <= r.ifModifiedSince) return 304;
  }
  // RFC 9110 14.2: Range evaluation follows preconditions and applies to GET.
  // Every modeled range is satisfiable; this origin elects to support it.
  if (method === 'GET' && r.range && r.rangeSupported !== false) {
    if (r.ifRange === undefined || strongMatch(r.ifRange, etag)) return 206;
  }
  return preliminary;
}

// Expected results are literal external oracles, not calculated by decide().
// Fields represent parsed header values, not raw HTTP header syntax.
const examples = [
  ['plain GET', {}, 200],
  ['plain HEAD', {method:'HEAD'}, 200],
  ['replace existing', {method:'PUT'}, 204],
  ['create missing with PUT', {method:'PUT', exists:false}, 201],
  ['GET missing yields 404 before precondition', {exists:false, ifNoneMatch:'*'}, 404],
  ['GET strong If-None-Match hit', {ifNoneMatch:['"v1"']}, 304],
  ['GET weak If-None-Match hit', {ifNoneMatch:['W/"v1"']}, 304],
  ['HEAD weak If-None-Match hit', {method:'HEAD',ifNoneMatch:['W/"v1"']}, 304],
  ['GET validator miss', {ifNoneMatch:['"v2"']}, 200],
  ['GET mixed validator list hit', {ifNoneMatch:['"v2"','W/"v1"']}, 304],
  ['PUT If-None-Match strong hit', {method:'PUT',ifNoneMatch:['"v1"']}, 412],
  ['PUT If-None-Match weak hit', {method:'PUT',ifNoneMatch:['W/"v1"']}, 412],
  ['PUT If-None-Match miss', {method:'PUT',ifNoneMatch:['"v2"']}, 204],
  ['GET If-None-Match star on existing', {ifNoneMatch:'*'}, 304],
  ['PUT If-None-Match star existing', {method:'PUT',ifNoneMatch:'*'}, 412],
  ['PUT If-None-Match star missing', {method:'PUT',exists:false,ifNoneMatch:'*'}, 201],
  ['PUT strong If-Match hit', {method:'PUT',ifMatch:['"v1"']}, 204],
  ['PUT weak If-Match fails', {method:'PUT',ifMatch:['W/"v1"']}, 412],
  ['PUT mismatched If-Match fails', {method:'PUT',ifMatch:['"v2"']}, 412],
  ['PUT If-Match star existing', {method:'PUT',ifMatch:'*'}, 204],
  ['PUT If-Match star missing', {method:'PUT',exists:false,ifMatch:'*'}, 412],
  ['strong If-Match list succeeds', {method:'PUT',ifMatch:['"v2"','"v1"']}, 204],
  ['GET unmodified date exact succeeds', {ifUnmodifiedSince:LAST_MODIFIED}, 200],
  ['GET unmodified date older fails', {ifUnmodifiedSince:LAST_MODIFIED-1}, 412],
  ['PUT If-Match overrides stale unmodified date', {method:'PUT',ifMatch:['"v1"'],ifUnmodifiedSince:LAST_MODIFIED-1}, 204],
  ['PUT failed If-Match overrides future unmodified date', {method:'PUT',ifMatch:['"v2"'],ifUnmodifiedSince:LAST_MODIFIED+1}, 412],
  ['GET If-None-Match overrides modified-since', {ifNoneMatch:['"v2"'],ifModifiedSince:LAST_MODIFIED+10}, 200],
  ['GET matching If-None-Match overrides older modified-since', {ifNoneMatch:['"v1"'],ifModifiedSince:LAST_MODIFIED-10}, 304],
  ['GET modified-since exact returns 304', {ifModifiedSince:LAST_MODIFIED}, 304],
  ['GET modified-since older returns 200', {ifModifiedSince:LAST_MODIFIED-1}, 200],
  ['PUT ignores If-Modified-Since', {method:'PUT',ifModifiedSince:LAST_MODIFIED+10}, 204],
  ['GET If-Match failure precedes If-None-Match 304', {ifMatch:['"v2"'],ifNoneMatch:['"v1"']}, 412],
  ['GET If-Match success then If-None-Match 304', {ifMatch:['"v1"'],ifNoneMatch:['"v1"']}, 304],
  ['PUT If-Match success then If-None-Match 412', {method:'PUT',ifMatch:['"v1"'],ifNoneMatch:['"v1"']}, 412],
  ['GET range selected, honors range', {range:true}, 206],
  ['GET range with matching strong If-Range', {range:true,ifRange:'"v1"'}, 206],
  ['GET range with stale If-Range falls back full', {range:true,ifRange:'"v2"'}, 200],
  ['GET range with weak If-Range does not match', {range:true,ifRange:'W/"v1"'}, 200],
  ['GET range skipped when origin declines ranges', {range:true,rangeSupported:false}, 200],
  ['GET range loses to conditional 304', {range:true,ifNoneMatch:['"v1"']}, 304],
  ['GET range runs after failed validator check', {range:true,ifMatch:['"v2"']}, 412],
  ['HEAD ignores Range', {method:'HEAD',range:true}, 200],
  ['authorization failure before conditional 304', {preliminary:401,ifNoneMatch:['"v1"']}, 401],
  ['authorization failure before range', {preliminary:401,range:true}, 401],
  ['resource failure before conditional 412', {preliminary:404,ifMatch:['"v2"']}, 404],
  ['DELETE If-None-Match matches is 412', {method:'DELETE',ifNoneMatch:['"v1"']}, 412],
  ['DELETE no condition returns 204', {method:'DELETE'}, 204],
];

for (const [name, input, expected] of examples) {
  test('RFC decision: ' + name, () => assert.equal(decide(input), expected));
}

test('Independent negative checks detect eight common precedence/comparison defects', () => {
  const checks = [
    [weakMatch('W/"v1"','"v1"'), true, 'weak matching is used for If-None-Match'],
    [strongMatch('W/"v1"','"v1"'), false, 'strong matching rejects weak tags for If-Match'],
    [decide({ifNoneMatch:['"v2"'],ifModifiedSince:LAST_MODIFIED+1}),200,'If-None-Match overrides date'],
    [decide({method:'PUT',ifMatch:['"v1"'],ifUnmodifiedSince:LAST_MODIFIED-1}),204,'If-Match overrides unmodified date'],
    [decide({range:true,ifNoneMatch:['"v1"']}),304,'validator precedes Range'],
    [decide({preliminary:401,ifNoneMatch:['"v1"']}),401,'prior authorization failure precedes validator'],
    [decide({method:'PUT',ifNoneMatch:['"v1"']}),412,'unsafe method never receives 304'],
    [decide({ifMatch:['"v2"'],ifNoneMatch:['"v1"']}),412,'If-Match failure precedes If-None-Match'],
  ];
  assert.equal(checks.length,8);
  for (const [observed,expected,context] of checks) assert.equal(observed,expected,context);
  assert.notEqual(strongMatch('W/"v1"','"v1"'),weakMatch('W/"v1"','"v1"'));
  assert.throws(()=>tag('v1'),TypeError);
});

test('Case IDs and assumptions remain explicit, unique, and non-networked', () => {
  assert.equal(examples.length,47);
  assert.equal(new Set(examples.map(c=>c[0])).size,examples.length);
  assert.ok(examples.every(c=>Number.isInteger(c[2]) && c[2]>=200 && c[2]<=499));
});
