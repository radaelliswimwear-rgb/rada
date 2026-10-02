// Minimal offline DOM shim (no jsdom available). Supports exactly what the in-page scripts use.
// Selectors: comma lists, descendant chains, tag, #id, .class, [attr], [attr=v], [attr="v"], [attr*=v], [attr^=v], [attr$=v].
const VOID = new Set(['meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'base', 'area', 'col', 'embed', 'param', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);

export class El {
  constructor(tag, attrs, parent, doc) {
    this.localName = tag; this.tagName = tag.toUpperCase(); this.attrs = attrs || {}; this.parentElement = parent || null;
    this.children = []; this.texts = []; this._doc = doc || null; this.style = { cssText: '' };
    this._value = undefined; this._checked = undefined; this._open = undefined; this._loading = undefined; this._src = undefined;
    this.onclick = null; this.mock = {};
  }
  get ownerDocument() { return this._doc; }
  getAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n) ? this.attrs[n] : null; }
  setAttribute(n, v) { this.attrs[n] = String(v); }
  hasAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n); }
  get id() { return this.attrs.id || ''; }
  set id(v) { this.attrs.id = v; }
  get className() { return this.attrs.class || ''; }
  get href() { const h = this.attrs.href; if (h == null) return ''; try { return new URL(h, this._doc ? this._doc.url : 'http://x/').href; } catch (e) { return h; } }
  get value() { return this._value !== undefined ? this._value : (this.attrs.value || ''); }
  set value(v) { this._value = String(v); }
  get checked() { return this._checked !== undefined ? this._checked : this.hasAttribute('checked'); }
  set checked(v) { this._checked = !!v; }
  get open() { return this._open !== undefined ? this._open : this.hasAttribute('open'); }
  set open(v) { this._open = !!v; }
  get disabled() { return this.mock.disabled !== undefined ? this.mock.disabled : this.hasAttribute('disabled'); }
  get loading() { return this._loading; }
  set loading(v) { this._loading = v; }
  get complete() { return this.mock.complete !== undefined ? this.mock.complete : !this.hasAttribute('data-pending'); }
  get naturalWidth() { return this.hasAttribute('data-broken') ? 0 : 100; }
  get src() { return this.attrs.src || ''; }
  get textContent() { let s = ''; let ti = 0; this._walkText((t) => { s += t; }); return s; }
  _walkText(f) {
    // texts[i] precedes children[i]; trailing text at texts[children.length]
    for (let i = 0; i < this.children.length; i++) { f(this.texts[i] || ''); this.children[i]._walkText(f); }
    f(this.texts[this.children.length] || '');
  }
  get innerText() {
    const BLOCK = new Set(['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol', 'section', 'main', 'header', 'footer', 'details', 'summary', 'form', 'tr', 'table', 'article', 'nav', 'button']);
    const hidden = new Set(['script', 'style', 'noscript', 'template', 'head']);
    const rec = (e) => {
      if (hidden.has(e.localName)) return '';
      let s = '';
      for (let i = 0; i < e.children.length; i++) { s += (e.texts[i] || ''); s += rec(e.children[i]); }
      s += (e.texts[e.children.length] || '');
      return BLOCK.has(e.localName) ? '\n' + s + '\n' : s;
    };
    return rec(this).replace(/[ \t]+/g, ' ');
  }
  set innerHTML(v) { this.children = []; this.texts = []; }
  get innerHTML() {
    const esc = (s) => s;
    const ser = (e) => {
      let s = '';
      for (let i = 0; i < e.children.length; i++) { s += esc(e.texts[i] || ''); s += one(e.children[i]); }
      return s + esc(e.texts[e.children.length] || '');
    };
    const one = (e) => '<' + e.localName + Object.entries(e.attrs).map(([k, v]) => ' ' + k + '="' + v + '"').join('') + '>' + (VOID.has(e.localName) ? '' : ser(e) + '</' + e.localName + '>');
    return ser(this);
  }
  get parentNode() { return this.parentElement; }
  appendChild(c) { c.parentElement = this; c._doc = this._doc; this.children.push(c); return c; }
  remove() { const p = this.parentElement; if (!p) return; const i = p.children.indexOf(this); if (i >= 0) { p.children.splice(i, 1); const t = p.texts[i] || '' ; const t2 = p.texts[i + 1] || ''; p.texts.splice(i, 2, t + t2); } this.parentElement = null; }
  cloneNode(deep) { const c = new El(this.localName, { ...this.attrs }, null, this._doc); if (deep) { c.texts = this.texts.slice(); this.children.forEach((k) => { const kc = k.cloneNode(true); kc.parentElement = c; c.children.push(kc); }); } return c; }
  click() { if (this.onclick) this.onclick(this); else if (this._doc && this._doc.onclick) this._doc.onclick(this); }
  scrollIntoView() {}
  querySelectorAll(sel) { const out = []; const groups = parseSel(sel); const walk = (e) => { for (const c of e.children) { if (groups.some((g) => matchChain(c, g, this))) out.push(c); walk(c); } }; walk(this); return out; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  closest(sel) { const groups = parseSel(sel); let e = this; while (e) { if (groups.some((g) => matchChain(e, g, null))) return e; e = e.parentElement; } return null; }
  get scrollWidth() { return this.mock.scrollWidth !== undefined ? this.mock.scrollWidth : (this._doc && this._doc.defaultScrollWidth) || 0; }
}

function splitTop(s, sep) { // split on sep outside [] and quotes
  const out = []; let cur = ''; let br = 0; let q = '';
  for (const ch of s) {
    if (q) { cur += ch; if (ch === q) q = ''; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '[') br++; if (ch === ']') br--;
    if (br === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const selCache = new Map();
function parseSel(sel) {
  if (selCache.has(sel)) return selCache.get(sel);
  const groups = splitTop(sel, ',').map((g) => splitTop(g, ' ').map(parseCompound));
  selCache.set(sel, groups); return groups;
}
function parseCompound(c) {
  const o = { tag: null, id: null, cls: [], attrs: [] };
  let i = 0; const m = c.match(/^[a-zA-Z][\w-]*/); if (m) { o.tag = m[0].toLowerCase(); i = m[0].length; }
  while (i < c.length) {
    const ch = c[i];
    if (ch === '#') { const mm = c.slice(i + 1).match(/^[\w-]+/); o.id = mm[0]; i += 1 + mm[0].length; }
    else if (ch === '.') { const mm = c.slice(i + 1).match(/^[\w-]+/); o.cls.push(mm[0]); i += 1 + mm[0].length; }
    else if (ch === '[') {
      const j = c.indexOf(']', i); const body = c.slice(i + 1, j);
      const mm = body.match(/^([\w:-]+)(?:([*^$]?=)(?:"([^"]*)"|'([^']*)'|(.*)))?$/);
      o.attrs.push({ name: mm[1], op: mm[2] || null, val: mm[3] !== undefined ? mm[3] : mm[4] !== undefined ? mm[4] : mm[5] });
      i = j + 1;
    } else throw new Error('shim: unsupported selector part ' + c.slice(i));
  }
  return o;
}
function matchCompound(e, o) {
  if (o.tag && e.localName !== o.tag) return false;
  if (o.id && e.id !== o.id) return false;
  for (const k of o.cls) if (!(' ' + e.className + ' ').includes(' ' + k + ' ')) return false;
  for (const a of o.attrs) {
    const v = e.getAttribute(a.name); if (v === null) return false;
    if (a.op === '=' && v !== a.val) return false;
    if (a.op === '*=' && !v.includes(a.val)) return false;
    if (a.op === '^=' && !v.startsWith(a.val)) return false;
    if (a.op === '$=' && !v.endsWith(a.val)) return false;
  }
  return true;
}
function matchChain(e, chain, scope) {
  if (!matchCompound(e, chain[chain.length - 1])) return false;
  let k = chain.length - 2; let p = e.parentElement;
  while (k >= 0 && p) { if (matchCompound(p, chain[k])) k--; p = p.parentElement; }
  return k < 0;
}

export class Doc {
  constructor(url) { this.url = url || 'https://radaelliswimwear.com/'; this.documentElement = null; this.body = null; this.head = null; this.defaultScrollWidth = 0; this.onclick = null; }
  querySelectorAll(s) { return this.documentElement ? [...(matchChain0(this.documentElement, s) ? [this.documentElement] : []), ...this.documentElement.querySelectorAll(s)] : []; }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  getElementById(id) { return this.documentElement ? this.documentElement.querySelector('#' + id) : null; }
  createElement(tag) { const e = new El(tag, {}, null, this); if (tag === 'iframe') makeIframe(e, this); return e; }
}
function matchChain0(e, s) { return parseSel(s).some((g) => matchChain(e, g, null)); }

let iframeHook = null;
export function setIframeHook(f) { iframeHook = f; }
function makeIframe(e, doc) {
  Object.defineProperty(e, 'srcdoc', {
    set(html) {
      const d = parseHTML(html, doc.url);
      const wm = /width:(\d+)px/.exec(e.style.cssText);
      const width = wm ? +wm[1] : 0;
      d.defaultScrollWidth = width;
      e.contentDocument = d;
      e.contentWindow = { innerWidth: width, __errs: [], __res: [] };
      if (iframeHook) iframeHook(e, d, html, width);
    },
    get() { return ''; }
  });
}

export function parseHTML(html, url) {
  const doc = new Doc(url);
  const root = new El('#root', {}, null, doc);
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/gi;
  let pos = 0; let m;
  const addText = (t) => { const cur = stack[stack.length - 1]; if (!t) return; cur.texts[cur.children.length] = (cur.texts[cur.children.length] || '') + t; };
  const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  while ((m = re.exec(html))) {
    addText(dec(html.slice(pos, m.index)));
    pos = re.lastIndex;
    if (m[1]) { // close
      const t = m[1].toLowerCase(); for (let i = stack.length - 1; i > 0; i--) { if (stack[i].localName === t) { stack.length = i; break; } }
    } else if (m[2]) {
      const t = m[2].toLowerCase(); const attrs = {};
      const ar = /([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g; let am;
      while ((am = ar.exec(m[3] || ''))) attrs[am[1].toLowerCase()] = dec(am[2] !== undefined ? am[2] : am[3] !== undefined ? am[3] : am[4] !== undefined ? am[4] : '');
      const cur = stack[stack.length - 1]; const el = new El(t, attrs, cur, doc); cur.children.push(el);
      if (RAW.has(t) && !m[4]) { const endRe = new RegExp('</' + t + '\\s*>', 'i'); const rest = html.slice(pos); const em = endRe.exec(rest); const body = em ? rest.slice(0, em.index) : rest; el.texts[0] = body; pos += em ? em.index + em[0].length : rest.length; re.lastIndex = pos; }
      else if (!VOID.has(t) && !m[4]) stack.push(el);
    }
  }
  addText(dec(html.slice(pos)));
  const find = (e, t) => e.children.find((c) => c.localName === t);
  let htmlEl = find(root, 'html');
  if (!htmlEl) { htmlEl = new El('html', {}, null, doc); const body = new El('body', {}, htmlEl, doc); body.children = root.children; body.texts = root.texts; body.children.forEach((c) => { c.parentElement = body; }); htmlEl.children = [body]; }
  htmlEl.parentElement = null;
  doc.documentElement = htmlEl; doc.head = find(htmlEl, 'head') || null; doc.body = find(htmlEl, 'body') || null;
  return doc;
}

export class DOMParserShim { parseFromString(h) { return parseHTML(h, globalThis.location ? globalThis.location.href : undefined); } }
