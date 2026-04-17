'use strict';

/**
 * Unit tests for the cookie reading/parsing logic used by
 * `sync-96dArz243hG.html` (the cross-domain "hub" that exposes the
 * `last_drenaud_visit` cookie to other origins via `postMessage`).
 *
 * The tests exercise two layers:
 *   1. The pure parsing expression as a standalone helper (fast, isolated).
 *   2. The real HTML file loaded into jsdom (validates the wiring between
 *      the `message` listener, `document.cookie`, and `postMessage`).
 *
 * "Different browsers" is simulated by feeding the parser the various
 * shapes of `document.cookie` that real browsers produce: single cookie,
 * multiple cookies joined with `"; "`, empty string when no cookies exist,
 * URL-encoded values, values containing `=`, etc.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const HTML_PATH = path.join(__dirname, '..', 'sync-96dArz243hG.html');
const HTML_SOURCE = fs.readFileSync(HTML_PATH, 'utf8');

/**
 * The exact cookie-parsing expression used inside
 * `sync-96dArz243hG.html`, wrapped as a pure function so it can be
 * exercised in isolation. Keep this in sync with the HTML file.
 */
function parseLastVisit(cookieString) {
  return cookieString
    .split('; ')
    .find((row) => row.startsWith('last_drenaud_visit='))
    ?.split('=')[1];
}

// ---------------------------------------------------------------------------
// Pure parser tests
// ---------------------------------------------------------------------------

test('parseLastVisit: returns undefined for an empty cookie string', () => {
  assert.equal(parseLastVisit(''), undefined);
});

test('parseLastVisit: returns value when cookie is the only one set', () => {
  assert.equal(parseLastVisit('last_drenaud_visit=2026-04-17'), '2026-04-17');
});

test('parseLastVisit: returns value when cookie appears first among many', () => {
  const cookies = 'last_drenaud_visit=2026-04-17; session_id=abc; theme=dark';
  assert.equal(parseLastVisit(cookies), '2026-04-17');
});

test('parseLastVisit: returns value when cookie appears in the middle', () => {
  const cookies = 'session_id=abc; last_drenaud_visit=2026-04-17; theme=dark';
  assert.equal(parseLastVisit(cookies), '2026-04-17');
});

test('parseLastVisit: returns value when cookie appears last', () => {
  const cookies = 'session_id=abc; theme=dark; last_drenaud_visit=2026-04-17';
  assert.equal(parseLastVisit(cookies), '2026-04-17');
});

test('parseLastVisit: returns undefined when cookie is absent', () => {
  assert.equal(parseLastVisit('session_id=abc; theme=dark'), undefined);
});

test('parseLastVisit: does not match cookies that merely share a prefix', () => {
  // Without the trailing `=`, `startsWith('last_drenaud_visit')` would
  // falsely match `last_drenaud_visit_old` and `last_drenaud_visitor`.
  // The production code appends `=` to guard against this — verify it.
  const cookies =
    'last_drenaud_visit_old=legacy; last_drenaud_visitor=bot; other=1';
  assert.equal(parseLastVisit(cookies), undefined);
});

test('parseLastVisit: prefix-like and real cookie can coexist', () => {
  const cookies =
    'last_drenaud_visit_old=legacy; last_drenaud_visit=2026-04-17';
  assert.equal(parseLastVisit(cookies), '2026-04-17');
});

test('parseLastVisit: returns empty string when cookie value is empty', () => {
  assert.equal(parseLastVisit('last_drenaud_visit='), '');
  assert.equal(parseLastVisit('foo=bar; last_drenaud_visit=; baz=qux'), '');
});

test('parseLastVisit: returns first match when the cookie appears twice', () => {
  // A single `document.cookie` string should not contain duplicates in
  // practice, but browsers can return both if cookies were set for
  // different paths/domains. `Array.prototype.find` returns the first.
  const cookies =
    'last_drenaud_visit=first-value; last_drenaud_visit=second-value';
  assert.equal(parseLastVisit(cookies), 'first-value');
});

test('parseLastVisit: truncates values that contain an "=" character', () => {
  // Known limitation of the current `split('=')[1]` implementation: any
  // value containing `=` (e.g. base64 padding) is truncated at the first
  // `=`. This test documents and pins the current behaviour so the
  // caller never stores a value containing `=` without noticing.
  assert.equal(
    parseLastVisit('last_drenaud_visit=YWJj=='),
    'YWJj',
    'value is truncated at the first "=" — store URL-encoded values to avoid this',
  );
});

test('parseLastVisit: preserves URL-encoded characters in the value', () => {
  // URL-encoded ISO datetime: "2026-04-17T12%3A34%3A56Z"
  const encoded = '2026-04-17T12%3A34%3A56Z';
  assert.equal(
    parseLastVisit(`last_drenaud_visit=${encoded}`),
    encoded,
  );
});

test('parseLastVisit: is case sensitive on the cookie name', () => {
  // Cookie names are case sensitive per RFC 6265. A differently-cased
  // name should not be picked up.
  assert.equal(
    parseLastVisit('Last_Drenaud_Visit=2026-04-17'),
    undefined,
  );
});

test('parseLastVisit: tolerates a single trailing cookie with no value', () => {
  // Some older browsers omit the trailing `=` on empty cookies.
  const cookies = 'session_id=abc; last_drenaud_visit';
  assert.equal(parseLastVisit(cookies), undefined);
});

// ---------------------------------------------------------------------------
// Integration tests: load the actual HTML file with jsdom and exercise the
// `message` listener end-to-end.
// ---------------------------------------------------------------------------

/**
 * Build a fresh jsdom environment from the real HTML file and seed
 * `document.cookie` with the provided cookies.
 *
 * Cookies must be set one-at-a-time — the `document.cookie` setter in
 * both browsers and jsdom only accepts a single `name=value` pair plus
 * optional attributes, mirroring real browser behaviour.
 */
function createHub(cookies = []) {
  const dom = new JSDOM(HTML_SOURCE, {
    runScripts: 'dangerously',
    url: 'https://drenaud.example/sync-96dArz243hG.html',
    pretendToBeVisual: true,
  });

  for (const pair of cookies) {
    dom.window.document.cookie = pair;
  }

  // Silence the `console.log` calls in the hub so the test output stays
  // readable.
  dom.window.console.log = () => {};

  return dom;
}

/**
 * Dispatch a `message` event at the hub's window and collect any
 * `postMessage` calls made against the mocked event source.
 */
function sendMessage(dom, data, { origin = 'https://caller.example' } = {}) {
  const calls = [];
  const source = {
    postMessage(message, targetOrigin) {
      calls.push({ message, targetOrigin });
    },
  };

  // jsdom's MessageEvent constructor ignores `source` when it is a plain
  // object, so dispatch a generic Event and attach the expected fields
  // directly — this mirrors what a real `window.postMessage` delivers.
  const event = new dom.window.Event('message');
  Object.defineProperty(event, 'data', { value: data });
  Object.defineProperty(event, 'origin', { value: origin });
  Object.defineProperty(event, 'source', { value: source });

  dom.window.dispatchEvent(event);
  return calls;
}

test('hub: replies with the cookie value when it exists', () => {
  const dom = createHub(['last_drenaud_visit=2026-04-17']);
  const calls = sendMessage(dom, 'get_last_visit');

  assert.equal(calls.length, 1);
  // Compare fields individually: the object posted back originates from
  // the jsdom realm, so its prototype chain differs from Node's and
  // `assert.deepEqual` (which uses strict equality) would reject it.
  assert.equal(calls[0].message.type, 'set_last_visit');
  assert.equal(calls[0].message.last_visit, '2026-04-17');
  assert.equal(calls[0].targetOrigin, '*');
});

test('hub: picks the right cookie when several are set', () => {
  const dom = createHub([
    'session_id=abc',
    'theme=dark',
    'last_drenaud_visit=2026-04-17',
    'consent=yes',
  ]);
  const calls = sendMessage(dom, 'get_last_visit');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].message.last_visit, '2026-04-17');
});

test('hub: does not reply when the cookie is absent', () => {
  const dom = createHub(['session_id=abc', 'theme=dark']);
  const calls = sendMessage(dom, 'get_last_visit');

  assert.deepEqual(calls, []);
});

test('hub: does not reply when the cookie value is empty', () => {
  // `if (match)` in the production code treats the empty string as
  // "nothing to send", so no message should be posted.
  const dom = createHub(['last_drenaud_visit=']);
  const calls = sendMessage(dom, 'get_last_visit');

  assert.deepEqual(calls, []);
});

test('hub: ignores messages that are not "get_last_visit"', () => {
  const dom = createHub(['last_drenaud_visit=2026-04-17']);

  const ignored = [
    sendMessage(dom, 'ping'),
    sendMessage(dom, 'set_last_visit'),
    sendMessage(dom, { type: 'get_last_visit' }), // object, not the string
    sendMessage(dom, null),
    sendMessage(dom, undefined),
  ];

  for (const calls of ignored) {
    assert.deepEqual(calls, []);
  }
});

test('hub: ignores look-alike cookies set alongside the real one being absent', () => {
  const dom = createHub([
    'last_drenaud_visit_old=legacy',
    'last_drenaud_visitor=bot',
  ]);
  const calls = sendMessage(dom, 'get_last_visit');

  assert.deepEqual(calls, []);
});

test('hub: preserves URL-encoded cookie values in the reply', () => {
  const encoded = '2026-04-17T12%3A34%3A56Z';
  const dom = createHub([`last_drenaud_visit=${encoded}`]);
  const calls = sendMessage(dom, 'get_last_visit');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].message.last_visit, encoded);
});

test('hub: responds to every matching message independently', () => {
  const dom = createHub(['last_drenaud_visit=2026-04-17']);

  const first = sendMessage(dom, 'get_last_visit');
  const second = sendMessage(dom, 'get_last_visit');

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(first[0].message.last_visit, '2026-04-17');
  assert.equal(second[0].message.last_visit, '2026-04-17');
});
