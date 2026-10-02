// Tiny spreadsheet evaluator for unit-economics-filled.csv (Excel/Sheets formula subset used by the file).
// Usage:  node eval_csv.js            -> runs checks and prints key outputs
//         node eval_csv.js --quiet    -> only checks
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const CSV = path.join(DIR, 'unit-economics-filled.csv');
const TEMPLATE = path.join(DIR, '..', 'laneM', 'unit-economics-inputs.csv');
const CATALOG = path.join(DIR, 'catalog_raw.json');
const QUIET = process.argv.includes('--quiet');

// ------------------------------------------------------------------ CSV
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ------------------------------------------------------------------ formula engine
class XlErr { constructor(code) { this.code = code; } toString() { return this.code; } }
const isErr = (v) => v instanceof XlErr;
const colIdx = (s) => s.split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
const colName = (i) => { let s = ''; i++; while (i > 0) { s = String.fromCharCode(65 + ((i - 1) % 26)) + s; i = Math.floor((i - 1) / 26); } return s; };

function tokenize(src) {
  const toks = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') { i++; continue; }
    if (c === '"') {
      let j = i + 1, s = '';
      while (j < src.length) {
        if (src[j] === '"') { if (src[j + 1] === '"') { s += '"'; j += 2; continue; } break; }
        s += src[j++];
      }
      toks.push({ t: 'str', v: s }); i = j + 1; continue;
    }
    let m;
    if ((m = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(src.slice(i)))) { toks.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue; }
    if ((m = /^\$?[A-Z]{1,2}\$?\d+/.exec(src.slice(i)))) { toks.push({ t: 'ref', v: m[0].replace(/\$/g, '') }); i += m[0].length; continue; }
    if ((m = /^[A-Z][A-Z0-9.]*(?=\()/.exec(src.slice(i)))) { toks.push({ t: 'fn', v: m[0] }); i += m[0].length; continue; }
    if ((m = /^(<=|>=|<>|[=<>+\-*\/^&,():])/.exec(src.slice(i)))) { toks.push({ t: 'op', v: m[0] }); i += m[0].length; continue; }
    throw new Error('tokenize error at ' + i + ' in ' + src);
  }
  return toks;
}
function parse(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v) => { const t = toks[p]; if (!t || (v && t.v !== v)) throw new Error('parse: expected ' + v + ' got ' + JSON.stringify(t) + ' in ' + src); p++; return t; };
  const isOp = (...vs) => peek() && peek().t === 'op' && vs.includes(peek().v);
  function expr() { return cmp(); }
  function cmp() {
    let l = cat();
    while (isOp('=', '<>', '<', '>', '<=', '>=')) { const op = eat().v; l = { t: 'bin', op, l, r: cat() }; }
    return l;
  }
  function cat() { let l = add(); while (isOp('&')) { eat(); l = { t: 'bin', op: '&', l, r: add() }; } return l; }
  function add() { let l = mul(); while (isOp('+', '-')) { const op = eat().v; l = { t: 'bin', op, l, r: mul() }; } return l; }
  function mul() { let l = pow(); while (isOp('*', '/')) { const op = eat().v; l = { t: 'bin', op, l, r: pow() }; } return l; }
  function pow() { let l = unary(); while (isOp('^')) { eat(); l = { t: 'bin', op: '^', l, r: unary() }; } return l; }
  function unary() { if (isOp('-')) { eat(); return { t: 'neg', e: unary() }; } if (isOp('+')) { eat(); return unary(); } return prim(); }
  function prim() {
    const t = peek();
    if (!t) throw new Error('unexpected end in ' + src);
    if (t.t === 'num') { p++; return { t: 'num', v: t.v }; }
    if (t.t === 'str') { p++; return { t: 'str', v: t.v }; }
    if (t.t === 'ref') {
      p++;
      if (isOp(':')) { eat(':'); const b = eat(); if (b.t !== 'ref') throw new Error('bad range'); return { t: 'range', a: t.v, b: b.v }; }
      return { t: 'ref', v: t.v };
    }
    if (t.t === 'fn') {
      p++; eat('(');
      const args = [];
      if (!isOp(')')) { args.push(expr()); while (isOp(',')) { eat(','); args.push(expr()); } }
      eat(')');
      return { t: 'fn', name: t.v, args };
    }
    if (isOp('(')) { eat('('); const e = expr(); eat(')'); return e; }
    throw new Error('unexpected token ' + JSON.stringify(t) + ' in ' + src);
  }
  const ast = expr();
  if (p !== toks.length) throw new Error('trailing tokens in ' + src);
  return ast;
}

class Sheet {
  // grid: array of arrays of raw strings; row 1 = header (index 0)
  constructor(grid, overrides = {}) {
    this.grid = grid;
    this.memo = new Map();
    this.busy = new Set();
    this.astCache = new Map();
    this.overrides = overrides; // addr -> raw value (number|string|null)
  }
  raw(addr) {
    if (Object.prototype.hasOwnProperty.call(this.overrides, addr)) return this.overrides[addr];
    const m = /^([A-Z]+)(\d+)$/.exec(addr);
    const r = parseInt(m[2], 10) - 1, c = colIdx(m[1]);
    const row = this.grid[r];
    if (!row || row[c] === undefined || row[c] === '') return null;
    return row[c];
  }
  cell(addr) {
    if (this.memo.has(addr)) return this.memo.get(addr);
    if (this.busy.has(addr)) return new XlErr('#CIRC!');
    this.busy.add(addr);
    let val;
    const rv = this.raw(addr);
    try {
      if (rv === null) val = null;
      else if (typeof rv === 'number') val = rv;
      else if (rv[0] === '=') {
        let ast = this.astCache.get(rv);
        if (!ast) { ast = parse(rv.slice(1)); this.astCache.set(rv, ast); }
        val = this.ev(ast);
      } else if (/^-?\d+(\.\d+)?$/.test(rv)) val = parseFloat(rv);
      else val = rv;
    } catch (e) {
      if (e instanceof XlErr) val = e; else throw e;
    }
    this.busy.delete(addr);
    this.memo.set(addr, val);
    return val;
  }
  rangeCells(a, b) {
    const ma = /^([A-Z]+)(\d+)$/.exec(a), mb = /^([A-Z]+)(\d+)$/.exec(b);
    const c1 = colIdx(ma[1]), c2 = colIdx(mb[1]), r1 = +ma[2], r2 = +mb[2];
    const out = [];
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) out.push(this.cell(colName(c) + r));
    return out;
  }
  num(v) {
    if (isErr(v)) throw v;
    if (v === null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) return parseFloat(v);
    throw new XlErr('#VALUE!');
  }
  cmpVals(a, b) {
    if (isErr(a)) throw a; if (isErr(b)) throw b;
    const norm = (v) => (v === null ? { k: 'blank' } : typeof v === 'number' ? { k: 'n', v } : typeof v === 'boolean' ? { k: 'b', v } : { k: 's', v: String(v).toLowerCase() });
    let x = norm(a), y = norm(b);
    if (x.k === 'blank') x = y.k === 's' ? { k: 's', v: '' } : { k: 'n', v: 0 };
    if (y.k === 'blank') y = x.k === 's' ? { k: 's', v: '' } : { k: 'n', v: 0 };
    const rank = { n: 0, s: 1, b: 2 };
    if (x.k !== y.k) return rank[x.k] < rank[y.k] ? -1 : 1;
    return x.v < y.v ? -1 : x.v > y.v ? 1 : 0;
  }
  flat(args, directRefTextCounts) {
    // returns list of values from args, expanding ranges
    const out = [];
    for (const a of args) {
      if (a.t === 'range') out.push(...this.rangeCells(a.a, a.b).map((v) => ({ v, ref: true })));
      else if (a.t === 'ref') out.push({ v: this.cell(a.v), ref: true });
      else out.push({ v: this.ev(a), ref: false });
    }
    return out;
  }
  ev(n) {
    switch (n.t) {
      case 'num': return n.v;
      case 'str': return n.v;
      case 'ref': return this.cell(n.v);
      case 'range': throw new XlErr('#VALUE!');
      case 'neg': return -this.num(this.ev(n.e));
      case 'bin': {
        const l = this.ev(n.l); const r = this.ev(n.r);
        if (n.op === '&') { if (isErr(l)) throw l; if (isErr(r)) throw r; return String(l === null ? '' : l) + String(r === null ? '' : r); }
        if (['=', '<>', '<', '>', '<=', '>='].includes(n.op)) {
          const c = this.cmpVals(l, r);
          return n.op === '=' ? c === 0 : n.op === '<>' ? c !== 0 : n.op === '<' ? c < 0 : n.op === '>' ? c > 0 : n.op === '<=' ? c <= 0 : c >= 0;
        }
        const a = this.num(l), b = this.num(r);
        if (n.op === '+') return a + b;
        if (n.op === '-') return a - b;
        if (n.op === '*') return a * b;
        if (n.op === '/') { if (b === 0) throw new XlErr('#DIV/0!'); return a / b; }
        if (n.op === '^') return Math.pow(a, b);
        throw new Error('op ' + n.op);
      }
      case 'fn': return this.fn(n);
      default: throw new Error('node ' + n.t);
    }
  }
  truthy(v) {
    if (isErr(v)) throw v;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (v === null) return false;
    throw new XlErr('#VALUE!');
  }
  fn(n) {
    const name = n.name, args = n.args;
    switch (name) {
      case 'IF': {
        const c = this.truthy(this.ev(args[0]));
        if (c) return args[1] ? this.ev(args[1]) : true;
        return args[2] ? this.ev(args[2]) : false;
      }
      case 'AND': case 'OR': {
        let acc = name === 'AND';
        for (const { v } of this.flat(args)) {
          if (isErr(v)) throw v;
          if (v === null || typeof v === 'string') continue;
          const b = typeof v === 'boolean' ? v : v !== 0;
          acc = name === 'AND' ? acc && b : acc || b;
        }
        return acc;
      }
      case 'COUNT': {
        let k = 0;
        for (const { v } of this.flat(args)) if (typeof v === 'number') k++;
        return k;
      }
      case 'ISNUMBER': { const v = this.ev(args[0]); return typeof v === 'number'; }
      case 'SUM': {
        let s = 0;
        for (const { v, ref } of this.flat(args)) { if (isErr(v)) throw v; if (typeof v === 'number') s += v; else if (!ref && v !== null) s += this.num(v); }
        return s;
      }
      case 'SUMPRODUCT': {
        const arrs = args.map((a) => (a.t === 'range' ? this.rangeCells(a.a, a.b) : [this.ev(a)]));
        const len = arrs[0].length;
        if (arrs.some((x) => x.length !== len)) throw new XlErr('#VALUE!');
        let s = 0;
        for (let i = 0; i < len; i++) {
          let p = 1;
          for (const arr of arrs) { const v = arr[i]; if (isErr(v)) throw v; p *= typeof v === 'number' ? v : 0; }
          s += p;
        }
        return s;
      }
      case 'ROUNDUP': {
        const x = this.num(this.ev(args[0])), d = args[1] ? this.num(this.ev(args[1])) : 0;
        const f = Math.pow(10, d);
        return (x < 0 ? -1 : 1) * Math.ceil(Math.abs(x) * f - 1e-9) / f;
      }
      default: throw new Error('unsupported function ' + name);
    }
  }
}

// ------------------------------------------------------------------ load
const grid = parseCSV(fs.readFileSync(CSV, 'utf8'));
while (grid.length && grid[grid.length - 1].every((c) => c === '')) grid.pop();
const header = grid[0];
const COLS = { G: 'GLOBAL', H: 'FAM_PRECIO_159920', I: 'FAM_PRECIO_167920', J: 'FAM_PRECIO_183920', K: 'FAM_PRECIO_199920', L: 'EXAMPLE_ONLY' };
const idRow = {};
grid.forEach((r, i) => { if (r[1]) idRow[r[1]] = i + 1; });

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); return cond; };

function fmt(v) {
  if (isErr(v)) return String(v);
  if (v === null) return '(blank)';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : (Math.abs(v) < 10 ? v.toFixed(4) : v.toFixed(2));
  return String(v);
}
function table(sheet, ids, cols = ['G', 'H', 'I', 'J', 'K']) {
  const w0 = Math.max(...ids.map((s) => s.length)) + 1;
  console.log('id'.padEnd(w0) + cols.map((c) => (c === 'L' ? 'EXAMPLE' : c === 'G' ? 'GLOBAL' : c === 'H' ? '159.920' : c === 'I' ? '167.920' : c === 'J' ? '183.920' : '199.920').padStart(14)).join(''));
  for (const id of ids) {
    if (!idRow[id]) { console.log(id.padEnd(w0) + ' <missing id>'); continue; }
    console.log(id.padEnd(w0) + cols.map((c) => fmt(sheet.cell(c + idRow[id])).padStart(14)).join(''));
  }
}

// ------------------------------------------------------------------ 1. structure checks
const TEMPLATE_HEADER = parseCSV(fs.readFileSync(TEMPLATE, 'utf8'))[0];
check(JSON.stringify(header) === JSON.stringify(TEMPLATE_HEADER), 'header differs from template');
check(grid.every((r) => r.length === 13), 'some rows do not have 13 columns: ' + grid.map((r, i) => (r.length !== 13 ? i + 1 : null)).filter(Boolean).join(','));
const ids = grid.map((r) => r[1]).filter(Boolean);
check(new Set(ids).size === ids.length, 'duplicate ids');

const sheet = new Sheet(grid);

// lint: a text cell must not start with + - @ (spreadsheets would try to read it as a formula), and '=' only for real formulas
const lint = [];
grid.slice(1).forEach((r, i) => r.forEach((v, c) => {
  if (typeof v === 'string' && /^[+\-@]/.test(v) && !/^-?\d+(\.\d+)?$/.test(v)) lint.push(colName(c) + (i + 2) + ' starts with ' + v[0]);
  if (typeof v === 'string' && v[0] === '=' && c < 6) lint.push(colName(c) + (i + 2) + ' formula in a descriptive column');
  if (typeof v === 'string' && v[0] === '=' && c === 12) lint.push(colName(c) + (i + 2) + ' note starts with =');
}));
check(lint.length === 0, 'lint: ' + lint.join('; '));

// every formula cell must evaluate without error
let nFormulas = 0; const errCells = [];
grid.forEach((r, i) => r.forEach((v, c) => {
  if (typeof v === 'string' && v[0] === '=' && c >= 6 && c <= 11) {
    nFormulas++;
    const val = sheet.cell(colName(c) + (i + 1));
    if (isErr(val)) errCells.push(colName(c) + (i + 1) + ' ' + r[1] + ' ' + val);
  }
}));
check(errCells.length === 0, 'formula cells with errors: ' + errCells.join('; '));

// ------------------------------------------------------------------ 2. core formulas vs template (by id, normalised)
const tgrid = parseCSV(fs.readFileSync(TEMPLATE, 'utf8'));
const tIdRow = {}; tgrid.forEach((r, i) => { if (r[1]) tIdRow[r[1]] = i + 1; });
const tRowId = Object.fromEntries(Object.entries(tIdRow).map(([k, v]) => [v, k]));
const myRowId = Object.fromEntries(Object.entries(idRow).map(([k, v]) => [v, k]));
const norm = (formula, rowId) => formula.replace(/\$?([A-Z])\$?(\d+)/g, (m, col, row) => (rowId[+row] ? rowId[+row] + '@' + col + (m.startsWith('$') ? '(abs)' : '') : m)).replace(/\s+/g, '');
const coreDiffs = []; let coreSame = 0;
for (const [id, trow] of Object.entries(tIdRow)) {
  if (!idRow[id]) { coreDiffs.push('template id missing in filled: ' + id); continue; }
  for (const c of ['G', 'H', 'I', 'J', 'K', 'L']) {
    const tv = tgrid[trow - 1][colIdx(c) ];
    if (typeof tv === 'string' && tv[0] === '=') {
      const mv = grid[idRow[id] - 1][colIdx(c)];
      if (typeof mv === 'string' && mv[0] === '=' && norm(tv, tRowId) === norm(mv, myRowId)) coreSame++;
      else coreDiffs.push(`${id}@${c}`);
    }
  }
}

// ------------------------------------------------------------------ 3. catalog cross-check (independent recomputation from raw JSON)
const cat = JSON.parse(fs.readFileSync(CATALOG, 'utf8')).products.nodes;
const tierStats = {};
for (const p of cat) {
  if (p.status !== 'ACTIVE') continue;
  tierStats[p.variants.nodes[0].price] ??= { variants: 0, units: 0, products: new Set(), compare: new Set() };
  for (const v of p.variants.nodes) {
    const t = (tierStats[v.price] ??= { variants: 0, units: 0, products: new Set(), compare: new Set() });
    t.variants++; t.units += v.inventoryQuantity; t.products.add(p.handle); t.compare.add(v.compareAtPrice);
  }
}
const tierMap = { H: '159920.00', I: '167920.00', J: '183920.00', K: '199920.00' };
let totU = 0, wsum = 0, csum = 0;
for (const [c, k] of Object.entries(tierMap)) {
  const t = tierStats[k];
  check(!!t, 'tier missing in catalog ' + k);
  check(sheet.cell(c + idRow.price) === parseFloat(k), 'price mismatch ' + c);
  check(t.compare.size === 1 && sheet.cell(c + idRow.compare_at) === parseFloat([...t.compare][0]), 'compare_at mismatch ' + c);
  check(sheet.cell(c + idRow.inv_variants) === t.variants, 'variants mismatch ' + c + ' ' + t.variants);
  check(sheet.cell(c + idRow.inv_units) === t.units, 'units mismatch ' + c + ' ' + t.units);
  check(sheet.cell(c + idRow.inv_products) === t.products.size, 'products mismatch ' + c);
  totU += t.units; wsum += parseFloat(k) * t.units; csum += parseFloat([...t.compare][0]) * t.units;
}
check(Math.abs(sheet.cell('G' + idRow.price) - wsum / totU) < 1e-6, 'GLOBAL weighted price mismatch');
check(Math.abs(sheet.cell('G' + idRow.compare_at) - csum / totU) < 1e-6, 'GLOBAL weighted compare mismatch');
check(Math.abs(sheet.cell('G' + idRow.builtin_disc) - 0.2) < 1e-9, 'GLOBAL builtin discount != 0.20');
check(sheet.cell('G' + idRow.inv_units) === totU && sheet.cell('G' + idRow.inv_variants) === 98, 'G totals');

// ------------------------------------------------------------------ 4. independent arithmetic (no spreadsheet) for partial lines & example
function indepPartial(price, S = 0) {
  const base = price + S;
  const shop = base * 0.02;
  const wcomm = base * 0.0265 + 700;
  const wiva = wcomm * 0.19;
  const wtot = wcomm + wiva;
  const fees = shop + wtot;
  const contribPre = price - fees;
  return { base, shop, wcomm, wiva, wtot, fees, contribPre, feesPct: fees / base, roasFloor: base / contribPre };
}
const near = (a, b, tol = 1e-6) => typeof a === 'number' && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
for (const c of ['G', 'H', 'I', 'J', 'K', 'L']) {
  const price = sheet.cell(c + idRow.price);
  const e = indepPartial(price, 0);
  check(near(sheet.cell(c + idRow.pp_base), e.base), 'pp_base ' + c);
  check(near(sheet.cell(c + idRow.pp_shop), e.shop), 'pp_shop ' + c);
  check(near(sheet.cell(c + idRow.pp_wcomm), e.wcomm), 'pp_wcomm ' + c);
  check(near(sheet.cell(c + idRow.pp_wiva), e.wiva), 'pp_wiva ' + c);
  check(near(sheet.cell(c + idRow.pp_wtot), e.wtot), 'pp_wtot ' + c);
  check(near(sheet.cell(c + idRow.pp_fees), e.fees), 'pp_fees ' + c);
  check(near(sheet.cell(c + idRow.pp_contrib_pre), e.contribPre), 'pp_contrib_pre ' + c);
  check(near(sheet.cell(c + idRow.pp_roas_floor), e.roasFloor), 'pp_roas_floor ' + c);
  check(near(sheet.cell(c + idRow.pp_ret_comm), e.wcomm * 0.11), 'pp_ret_comm ' + c);
  check(near(sheet.cell(c + idRow.pp_ret_cash), e.base * 0.017), 'pp_ret_cash ' + c);
  [2, 3, 4, 5].forEach((x, i) => check(near(sheet.cell(c + idRow['sens_' + (i + 1)]), e.contribPre - e.base / x), `sens_${i + 1} ${c}`));
  [10000, 20000, 30000, 40000].forEach((cpa, i) => check(near(sheet.cell(c + idRow['roas_imp_' + (i + 1)]), e.base / cpa), `roas_imp_${i + 1} ${c}`));
}
// real columns: core must be FALTA_DATO, partial must be numbers
for (const c of ['G', 'H', 'I', 'J', 'K']) {
  for (const id of ['ok_core', 'A_prod', 'C_total', 'contrib', 'be_cpa', 'be_roas', 'fixed_order', 'contrib_full', 'be_cpa_full', 'be_roas_full', 'target_cpa', 'target_roas', 'after_ads_1', 'after_ads_4', 'net_extra', 'subsidy', 'plan_cop']) {
    check(sheet.cell(c + idRow[id]) === 'FALTA_DATO', `${id}@${c} should be FALTA_DATO, is ${fmt(sheet.cell(c + idRow[id]))}`);
  }
  check(typeof sheet.cell(c + idRow.pp_contrib_pre) === 'number', 'partial must compute @' + c);
}
// EXAMPLE column: independent core arithmetic
{
  const v = (id) => sheet.cell('L' + idRow[id]);
  const A = v('price') * v('units') * (1 - v('extra'));
  const C = A + v('ship');
  const cogsO = v('cogs') * v('units');
  const pay = (C * v('wpct') + v('wfix')) * (1 + v('wiva'));
  const shop = C * v('sfee');
  const refunds = v('rrate') * v('rshare') * A;
  const recov = v('rrate') * v('rresale') * cogsO;
  const retlog = v('rrate') * v('rship');
  const contrib = C - cogsO - v('pack') - v('label') - pay - shop - v('othervar') - refunds + recov - retlog;
  check(near(v('C_total'), C), 'EXAMPLE C_total'); check(near(v('contrib'), contrib), 'EXAMPLE contrib');
  check(near(v('be_roas'), C / contrib), 'EXAMPLE be_roas');
  const fixed = (v('plan') * v('fx') + v('apps') + v('otherfixed')) / v('orders_m');
  check(near(v('fixed_order'), fixed), 'EXAMPLE fixed_order');
  check(near(v('target_cpa'), contrib - fixed - v('target_profit')), 'EXAMPLE target_cpa');
  check(near(v('after_ads_2'), contrib - 20000), 'EXAMPLE after_ads_2');
  check(near(v('be_roas_meta'), v('mratio') * C / contrib), 'EXAMPLE be_roas_meta');
}
// FALTA_DATO propagation test: copy EXAMPLE inputs into the real columns one by one (in memory only)
const inputIds = ['price', 'extra', 'units', 'cogs', 'pack', 'ship', 'label', 'wpct', 'wfix', 'wiva', 'sfee', 'othervar', 'rrate', 'rshare', 'rresale', 'rship'];
let propagation = [];
{
  const base = {};
  const exVal = (id) => { const r = grid[idRow[id] - 1][colIdx('L')]; return /^-?\d+(\.\d+)?$/.test(r) ? parseFloat(r) : r; };
  // fill GLOBAL column G progressively
  const ov = {};
  const gInputs = inputIds.filter((id) => !['sfee'].includes(id)); // sfee already verified in G
  const steps = [];
  for (let k = 0; k < gInputs.length; k++) {
    const id = gInputs[k];
    ov['G' + idRow[id]] = exVal(id);
    const s = new Sheet(grid, { ...ov });
    steps.push({ filled: k + 1 + '/' + gInputs.length, last: id, ok_core: s.cell('G' + idRow.ok_core), contrib: fmt(s.cell('G' + idRow.contrib)) });
  }
  propagation = steps;
  // after filling all, compare G outputs vs L outputs (same inputs => same contribution), also fill fixed-cost inputs
  const ov2 = { ...ov };
  for (const id of ['fx', 'apps', 'otherfixed', 'orders_m', 'mratio', 'target_profit']) ov2['G' + idRow[id]] = exVal(id);
  const s2 = new Sheet(grid, ov2);
  for (const id of ['ok_core', 'ok_fixed', 'ok_meta', 'ok_target', 'A_prod', 'C_total', 'pay_fee', 'shop_fee', 'contrib', 'be_cpa', 'be_roas', 'be_roas_meta', 'fixed_order', 'contrib_full', 'be_cpa_full', 'be_roas_full', 'target_cpa', 'target_roas', 'after_ads_1', 'after_ads_2', 'after_ads_3', 'after_ads_4']) {
    const a = s2.cell('G' + idRow[id]), b = sheet.cell('L' + idRow[id]);
    // G price is the same as L only if we also override price (done in loop: price=100000), so outputs should match L
    check((typeof a === 'number' && typeof b === 'number' && near(a, b)) || a === b, `propagation G vs L mismatch on ${id}: ${fmt(a)} vs ${fmt(b)}`);
  }
  // tier columns inherit D/F/G rows from G: fill H with example inputs and check inheritance
  const ov3 = { ...ov2 };
  for (const id of ['price', 'extra', 'units', 'cogs', 'pack', 'ship', 'label', 'rrate', 'rshare', 'rresale', 'rship']) ov3['H' + idRow[id]] = exVal(id);
  const s3 = new Sheet(grid, ov3);
  check(s3.cell('H' + idRow.ok_core) === 'OK', 'tier H should be OK after filling its inputs (inherits D rows from G)');
  check(near(s3.cell('H' + idRow.contrib), sheet.cell('L' + idRow.contrib)), 'tier H contrib should match example');
}

// ------------------------------------------------------------------ report
if (!QUIET) {
  console.log('=== FILE: ' + CSV);
  console.log(`rows=${grid.length} (header incl.), ids=${ids.length}, formula cells=${nFormulas}, formula errors=${errCells.length}`);
  console.log(`core formulas identical to template (by id): ${coreSame}; differing/missing: ${coreDiffs.length} -> ${coreDiffs.join(', ') || 'none'}`);
  console.log('\n--- A. Verified catalog inputs (real columns) ---');
  table(sheet, ['price', 'compare_at', 'builtin_disc', 'inv_variants', 'inv_units', 'inv_products', 'w_inv', 'free_thr', 'free_min_units']);
  console.log('\n--- Shipping zones (GLOBAL) ---');
  table(sheet, ['ship_z1', 'ship_z2', 'ship_z3', 'ship_z4', 'ship_z5', 'label_z1', 'sub_z1', 'sub_z3', 'sub_z5'], ['G', 'L']);
  console.log('\n--- Platform inputs (GLOBAL real vs EXAMPLE) ---');
  table(sheet, ['sfee', 'wpct', 'wfix', 'wiva', 'wpct_pub', 'wfix_pub', 'wiva_pub', 'cust_iva', 'plan', 'plan_promo', 'fx', 'plan_cop', 'plan_promo_cop'], ['G', 'L']);
  console.log('\n--- REAL columns: CORE formulas (must show FALTA_DATO) ---');
  table(sheet, ['ok_core', 'ok_fixed', 'ok_meta', 'ok_target', 'ok_pub', 'A_prod', 'C_total', 'contrib', 'be_cpa', 'be_roas', 'contrib_full', 'be_cpa_full', 'be_roas_full', 'target_cpa', 'target_roas', 'subsidy', 'after_ads_1', 'after_ads_2', 'after_ads_3', 'after_ads_4']);
  console.log('\n--- REAL columns: PARTIAL lines (public Wompi-rate SCENARIO; per order of 1 unit, no shipping) ---');
  table(sheet, ['net_builtin', 'net_extra', 'pp_base', 'pp_shop', 'pp_wcomm', 'pp_wiva', 'pp_wtot', 'pp_fees', 'pp_fees_pct', 'pp_contrib_pre', 'pp_contrib_pre_pct', 'pp_cpa_ceiling', 'pp_roas_floor', 'pp_ret_cash', 'pp_ret_comm', 'roas_imp_1', 'roas_imp_2', 'roas_imp_3', 'roas_imp_4']);
  console.log('\n--- SENSITIVITY (illustrative, NOT thresholds): max budget for product+pack+net shipping+returns+other at ROAS X ---');
  table(sheet, ['sens_1', 'sens_2', 'sens_3', 'sens_4', 'sens_pct_1', 'sens_pct_2', 'sens_pct_3', 'sens_pct_4']);
  console.log('(ROAS of illustration: ' + [1, 2, 3, 4].map((k) => fmt(sheet.cell('G' + idRow['roas_x' + k]))).join(', ') + ')');
  console.log('\n--- EXAMPLE_ONLY column (FAKE inputs): core outputs ---');
  table(sheet, ['ok_core', 'ok_fixed', 'ok_meta', 'ok_target', 'A_prod', 'C_total', 'pay_fee', 'shop_fee', 'contrib', 'contrib_pct', 'be_cpa', 'be_roas', 'be_roas_meta', 'fixed_order', 'contrib_full', 'be_cpa_full', 'be_roas_full', 'target_cpa', 'target_roas', 'after_ads_1', 'after_ads_2', 'after_ads_3', 'after_ads_4', 'pp_fees', 'pp_contrib_pre', 'sens_2'], ['L']);
  console.log('\n--- Shipping effect on fees (partial lines recomputed with pub_s = zone rate; tier 159.920 / 199.920) ---');
  for (const [z, rate] of [['z1', 9900], ['z2', 12900], ['z3', 17900], ['z4', 21900], ['z5', 44900]]) {
    const s = new Sheet(grid, { ['G' + idRow.pub_s]: rate, ['H' + idRow.pub_s]: rate, ['K' + idRow.pub_s]: rate });
    console.log(`S=${String(rate).padStart(6)} (${z}): H pp_fees=${fmt(s.cell('H' + idRow.pp_fees))} (${fmt(s.cell('H' + idRow.pp_fees_pct))})  pp_contrib_pre=${fmt(s.cell('H' + idRow.pp_contrib_pre))}  | K pp_fees=${fmt(s.cell('K' + idRow.pp_fees))} pp_contrib_pre=${fmt(s.cell('K' + idRow.pp_contrib_pre))}`);
  }
  console.log('\n--- FALTA_DATO propagation: filling GLOBAL inputs one by one with EXAMPLE values (in memory) ---');
  for (const st of propagation) console.log(`  ${st.filled} filled (+${st.last}) -> ok_core=${st.ok_core}, contrib=${st.contrib}`);
}
console.log('\nCHECKS: ' + (failures.length === 0 ? 'ALL PASSED' : failures.length + ' FAILED'));
failures.forEach((f) => console.log('  FAIL: ' + f));
if (!QUIET && coreDiffs.length) console.log('Template-vs-filled formula differences (expected: builtin_disc ISNUMBER guard only): ' + coreDiffs.join(', '));
process.exit(failures.length ? 1 : 0);
