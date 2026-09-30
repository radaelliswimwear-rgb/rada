// Auditor de límites server-side de Shopify para el theme (03A). Solo lectura: nunca escribe en el theme.
// Uso: node shopify-migration/scripts/audit-theme-limits.mjs shopify-migration/theme-src
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) { console.error('usage: node audit-theme.mjs <themeDir>'); process.exit(2); }

const violations = [];   // hard or likely-rejected
const near = [];         // >= 90% of a limit
const notes = [];        // other risks / info
const stats = { settingsChecked: 0, schemasParsed: 0, filesChecked: 0 };

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const len = (s) => [...String(s)].length; // code points (Ruby String#length semantics)
function V(file, p, field, actual, limit, confidence = 'CONFIRMED') { violations.push({ file, path: p, field, actual: String(actual), limit: String(limit), confidence }); }
function N(file, p, field, actual, limit, confidence) { near.push({ file, path: p, field, actual: String(actual), limit: String(limit), confidence }); }
function NOTE(msg) { notes.push(msg); }

// ---------- helpers ----------
function readText(p) {
  const buf = fs.readFileSync(p);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) V(rel(p), '(file)', 'UTF-8 BOM', 'BOM present', 'no BOM (can break JSON parsing on upload)', 'LIKELY');
  return buf.toString('utf8').replace(/^﻿/, '');
}
function stripLeadingComment(s) { return s.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''); }

// Duplicate-key detector (JSON.parse silently keeps the last one)
function findDuplicateKeys(src) {
  const dups = []; let i = 0; const stack = [];
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  function str() { let s = ''; i++; while (src[i] !== '"') { if (src[i] === '\\') { s += src[i] + src[i + 1]; i += 2; } else s += src[i++]; } i++; return s; }
  function val(p) {
    ws(); const c = src[i];
    if (c === '{') { i++; const keys = new Set(); ws(); if (src[i] === '}') { i++; return; }
      for (;;) { ws(); const k = str(); if (keys.has(k)) dups.push(p + '.' + k); keys.add(k); ws(); i++; val(p + '.' + k); ws(); if (src[i] === ',') { i++; continue; } i++; return; } }
    if (c === '[') { i++; ws(); if (src[i] === ']') { i++; return; } let n = 0; for (;;) { val(p + '[' + n++ + ']'); ws(); if (src[i] === ',') { i++; continue; } i++; return; } }
    if (c === '"') { str(); return; }
    while (i < src.length && !/[,\]\}\s]/.test(src[i])) i++;
  }
  try { val('$'); } catch { /* parse errors reported elsewhere */ }
  return dups;
}

function parseJSON(file, src, label) {
  try { const d = findDuplicateKeys(src); d.forEach((k) => V(file, k, 'duplicate JSON key', 'duplicate', 'unique keys', 'LIKELY')); return JSON.parse(src); }
  catch (e) { V(file, label || '(json)', 'JSON syntax', e.message, 'valid JSON'); return null; }
}

function checkLen(file, p, field, value, max, confidence, { nearOnly = false } = {}) {
  if (value == null) return;
  const L = len(value);
  if (L > max) (nearOnly ? N : V)(file, p, field, `${L} chars: "${value}"`, `${max} chars`, confidence);
  else if (L >= Math.ceil(max * 0.9)) N(file, p, field, `${L} chars: "${value}"`, `${max} chars`, confidence);
}

// ---------- schema locale (t: keys) ----------
const localeDir = path.join(ROOT, 'locales');
const localeFiles = fs.existsSync(localeDir) ? fs.readdirSync(localeDir).filter((f) => f.endsWith('.json')) : [];
let schemaDefaultLocale = null;
const sdl = localeFiles.find((f) => f.endsWith('.default.schema.json'));
if (sdl) schemaDefaultLocale = JSON.parse(readText(path.join(localeDir, sdl)));
function resolveT(v) {
  if (typeof v !== 'string' || !v.startsWith('t:')) return { text: v, key: null };
  const key = v.slice(2); if (!schemaDefaultLocale) return { text: null, key, missing: true };
  const t = key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), schemaDefaultLocale);
  return { text: t, key, missing: t === undefined };
}
function checkTextField(file, p, field, raw, max, confidence, opts) {
  if (raw == null) return;
  const r = resolveT(raw);
  if (r.key) {
    checkLen(file, p, field + ' (literal t: key)', raw, max, confidence, opts);
    if (r.missing) V(file, p, field, `t:${r.key} not found in *.default.schema.json`, 'translation key must exist', 'CONFIRMED');
    else checkLen(file, p, field + ` (resolved t:${r.key})`, r.text, max, confidence, opts);
  } else checkLen(file, p, field, raw, max, confidence, opts);
}

// ---------- setting-level checks ----------
const KNOWN_TYPES = new Set(['article','article_list','blog','checkbox','collection','collection_list','color','color_background','color_scheme','color_scheme_group','color_palette','font_picker','header','html','image_picker','inline_richtext','link_list','liquid','metaobject','metaobject_list','number','page','paragraph','product','product_list','radio','range','richtext','select','text','text_alignment','textarea','url','video','video_url']);
const SIDEBAR = new Set(['header', 'paragraph']);
const NO_DEFAULT = new Set(['image_picker', 'video', 'collection', 'product', 'page', 'blog', 'article', 'collection_list', 'product_list', 'article_list', 'metaobject', 'metaobject_list']);
const RICH_TOP = new Set(['p', 'ul']);
const RICH_NESTED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'a', 'ul', 'li', 'ol']);
const INLINE_OK = new Set(['b', 'strong', 'i', 'em', 'a']);

function topLevelTags(html) {
  const tops = []; let depth = 0; const re = /<\/?([a-zA-Z0-9]+)[^>]*?(\/?)>|([^<]+)/g; let m;
  while ((m = re.exec(html))) {
    if (m[3] !== undefined) { if (depth === 0 && m[3].trim()) tops.push('#text'); continue; }
    const tag = m[1].toLowerCase(); const closing = m[0].startsWith('</'); const self = m[2] === '/' || tag === 'br';
    if (closing) depth--; else { if (depth === 0) tops.push(tag); if (!self) depth++; }
  }
  return tops;
}
function allTags(html) { return [...html.matchAll(/<\/?\s*([a-zA-Z0-9]+)/g)].map((m) => m[1].toLowerCase()); }

function checkSettingValue(file, p, s, value, source) {
  // value from default / template / settings_data
  const t = s.type;
  if (value === undefined) return;
  if (t === 'range' || t === 'number') {
    if (typeof value !== 'number') V(file, p, `${source} (${t})`, JSON.stringify(value), 'must be a number, not a string', 'CONFIRMED');
    if (t === 'range' && typeof value === 'number') {
      if (value < s.min || value > s.max) V(file, p, `${source} (range)`, value, `between ${s.min} and ${s.max}`, 'CONFIRMED');
      const k = (value - s.min) / (s.step ?? 1); if (Math.abs(k - Math.round(k)) > 1e-9) V(file, p, `${source} (range)`, `${value} (not on a step from ${s.min} by ${s.step ?? 1})`, 'must land on a step', 'LIKELY');
    }
  }
  if (t === 'checkbox' && typeof value !== 'boolean') V(file, p, `${source} (checkbox)`, JSON.stringify(value), 'boolean', 'CONFIRMED');
  if ((t === 'select' || t === 'radio') && Array.isArray(s.options) && !s.options.some((o) => o.value === value)) V(file, p, `${source} (${t})`, JSON.stringify(value), `one of ${JSON.stringify(s.options.map((o) => o.value))}`, 'CONFIRMED');
  if (t === 'color' && typeof value === 'string' && value !== '' && !/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) && !/^rgba?\(/.test(value) && !value.includes('{{')) V(file, p, `${source} (color)`, value, 'valid hex color', 'LIKELY');
  if (t === 'richtext' && typeof value === 'string' && value.trim()) {
    const tops = topLevelTags(value); const bad = tops.filter((x) => !RICH_TOP.has(x));
    if (bad.length) V(file, p, `${source} (richtext)`, `top-level: ${bad.join(',')} in "${value.slice(0, 80)}"`, 'only <p> or <ul> at top level', 'CONFIRMED');
    const badN = allTags(value).filter((x) => !RICH_NESTED.has(x)); if (badN.length) V(file, p, `${source} (richtext)`, `tags ${[...new Set(badN)]}`, 'p, br, strong, b, em, i, u, span, a, ul/li', 'LIKELY');
  }
  if (t === 'inline_richtext' && typeof value === 'string') {
    const bad = allTags(value).filter((x) => !INLINE_OK.has(x)); if (bad.length) V(file, p, `${source} (inline_richtext)`, `tags ${[...new Set(bad)]}`, 'only b/strong, i/em, a (no <p>, <br>, block tags)', 'CONFIRMED');
    if (/\n/.test(value)) V(file, p, `${source} (inline_richtext)`, 'contains line break', 'no line breaks', 'LIKELY');
  }
  if (t === 'url' && typeof value === 'string' && value !== '') {
    if (source === 'default') { if (!['/collections', '/collections/all'].includes(value)) V(file, p, 'default (url)', value, 'docs: only /collections or /collections/all', 'CONFIRMED (docs)'); }
    else if (!/^(https?:\/\/|\/|mailto:|tel:|#|shopify:\/\/)/.test(value)) V(file, p, `${source} (url)`, value, 'absolute URL or /path', 'LIKELY');
  }
  if ((t === 'text' || t === 'textarea' || t === 'html' || t === 'liquid') && value != null && typeof value !== 'string') V(file, p, `${source} (${t})`, JSON.stringify(value), 'string', 'CONFIRMED');
  if (t === 'liquid' && typeof value === 'string' && Buffer.byteLength(value) > 50 * 1024) V(file, p, `${source} (liquid)`, `${Buffer.byteLength(value)} bytes`, '50 KB', 'CONFIRMED');
  if (t === 'text_alignment' && !['left', 'center', 'right'].includes(value)) V(file, p, `${source} (text_alignment)`, value, 'left|center|right', 'CONFIRMED');
}

function checkSettingsArray(file, basePath, settings, scopeIds, scopeLabel) {
  if (!Array.isArray(settings)) { V(file, basePath, 'settings', typeof settings, 'array'); return; }
  const linkLists = [];
  let idCount = 0;
  settings.forEach((s, i) => {
    stats.settingsChecked++;
    const p = `${basePath}[${i}]` + (s.id ? `(id=${s.id})` : `(${s.type})`);
    if (!KNOWN_TYPES.has(s.type)) V(file, p, 'type', s.type, 'known setting type', 'CONFIRMED');
    if (SIDEBAR.has(s.type)) {
      if (s.content == null) V(file, p, 'content', 'missing', 'required', 'CONFIRMED');
      if (s.type === 'header') checkTextField(file, p, 'header content', s.content, 50, 'CONFIRMED (server error seen in this project)');
      if (s.type === 'paragraph') {
        const L = len(s.content || '');
        if (L > 1000) V(file, p, 'paragraph content', `${L} chars`, '1000 (translation cap)', 'UNCERTAIN');
        else if (L > 200) N(file, p, 'paragraph content', `${L} chars`, '~200 proven safe by Dawn (no hard cap known)', 'UNCERTAIN');
      }
      if (s.id) NOTE(`${file} ${p}: ${s.type} setting has an id (ignored, not needed)`);
      if (s.type === 'header' && s.info) checkLen(file, p, 'header info', s.info, 200, 'UNCERTAIN', { nearOnly: true });
      return;
    }
    idCount++;
    if (!s.id) V(file, p, 'id', 'missing', 'required', 'CONFIRMED');
    else {
      if (!/^[a-zA-Z0-9_-]+$/.test(s.id)) V(file, p, 'id', s.id, 'alphanumeric/underscore', 'LIKELY');
      if (scopeIds.has(s.id)) V(file, p, 'id', `duplicate "${s.id}" (also at ${scopeIds.get(s.id)})`, `unique within ${scopeLabel}`, 'CONFIRMED');
      else scopeIds.set(s.id, p);
    }
    if (s.label == null) V(file, p, 'label', 'missing', 'required', 'CONFIRMED');
    else checkTextField(file, p, 'label', s.label, 50, 'UNCERTAIN (conservative cap, no documented limit)');
    if (s.info != null) {
      const r = resolveT(s.info); const L = len(r.text ?? s.info);
      if (L > 1000) V(file, p, 'info', `${L} chars`, '1000', 'UNCERTAIN');
      else if (L >= 180) N(file, p, 'info', `${L} chars`, '~200 proven safe by Dawn/Horizon (no hard cap known)', 'UNCERTAIN');
    }
    if (s.placeholder != null) checkLen(file, p, 'placeholder', s.placeholder, 1000, 'UNCERTAIN');
    // default rules
    if ('default' in s) {
      if (NO_DEFAULT.has(s.type)) V(file, p, `default (${s.type})`, JSON.stringify(s.default), `${s.type} does not support default`, 'CONFIRMED (docs)');
      if (s.type === 'link_list' && !['main-menu', 'footer'].includes(s.default)) {
        if (s.default === 'customer-account-main-menu') NOTE(`${file} ${p}: link_list default "customer-account-main-menu" is NOT in the documented accepted values (main-menu, footer), but Shopify's own Horizon theme ships exactly this default in sections/header.liquid, so the server accepts it.`);
        else V(file, p, 'default (link_list)', s.default, 'main-menu or footer', 'CONFIRMED (docs)');
      }
      if (s.type === 'html') NOTE(`${file} ${p}: html setting has a default -- check it is well-formed HTML without <script>/<html>/<head>/<body>`);
      checkSettingValue(file, p, s, s.default, 'default');
      if (typeof s.default === 'string') { const L = len(s.default); if (L > 1000) N(file, p, 'default length', `${L} chars`, 'no documented cap', 'UNCERTAIN'); }
    } else {
      if (s.type === 'range') V(file, p, 'default (range)', 'missing', 'required', 'CONFIRMED (docs)');
      if (s.type === 'font_picker') V(file, p, 'default (font_picker)', 'missing', 'required', 'CONFIRMED (docs)');
    }
    if (s.type === 'range') {
      for (const k of ['min', 'max', 'step', 'default']) if (k in s && typeof s[k] !== 'number') V(file, p, `range ${k}`, JSON.stringify(s[k]), 'number, not string', 'CONFIRMED (docs)');
      const step = s.step ?? 1; const intervals = (s.max - s.min) / step;
      if (!(s.max > s.min)) V(file, p, 'range min/max', `${s.min}..${s.max}`, 'max > min', 'CONFIRMED');
      if (Math.abs(intervals - Math.round(intervals)) > 1e-9) V(file, p, 'range (max-min)/step', intervals, 'integer (max must land on a step)', 'LIKELY');
      if (intervals + 1 > 101) V(file, p, 'range steps', `${intervals + 1} values (${s.min}..${s.max} step ${step})`, '101 values (100 intervals)', 'WELL-ESTABLISHED');
      else if (intervals + 1 >= 91) N(file, p, 'range steps', `${intervals + 1} values`, '101', 'WELL-ESTABLISHED');
      if (s.unit != null) checkLen(file, p, 'range unit', s.unit, 3, 'UNCERTAIN (Dawn units are <= 3 chars)', { nearOnly: true });
    }
    if (s.type === 'select' || s.type === 'radio') {
      if (!Array.isArray(s.options) || !s.options.length) V(file, p, 'options', 'missing/empty', 'required, non-empty', 'CONFIRMED');
      else {
        const vals = new Set();
        s.options.forEach((o, j) => {
          const op = `${p}.options[${j}]`;
          if (typeof o.value !== 'string') V(file, op, 'option value', JSON.stringify(o.value), 'string', 'CONFIRMED');
          if (vals.has(o.value)) V(file, op, 'option value', `duplicate ${o.value}`, 'unique', 'LIKELY'); vals.add(o.value);
          if (o.label == null) V(file, op, 'option label', 'missing', 'required', 'CONFIRMED');
          else checkTextField(file, op, 'option label', o.label, 50, 'WELL-ESTABLISHED');
        });
        if (s.options.length > 44) N(file, p, 'options count', s.options.length, '44+ proven safe (no documented max)', 'UNCERTAIN');
      }
    }
    if (['product_list', 'collection_list', 'article_list', 'metaobject_list'].includes(s.type) && s.limit != null && s.limit > 50) V(file, p, 'limit', s.limit, 50, 'CONFIRMED (docs)');
    if (s.type === 'color_palette' && Array.isArray(s.colors) && (s.colors.length < 2 || s.colors.length > 20)) V(file, p, 'color_palette entries', s.colors.length, '2..20', 'CONFIRMED (docs)');
    if (s.type === 'link_list') linkLists.push(s.id);
  });
  if (linkLists.length > 1) NOTE(`${file} ${basePath}: ${linkLists.length} link_list settings in ONE settings array (${linkLists.join(', ')}). Old CLI 2.x report (shopify-cli#2388) rejected this with "setting link_list type can only be inserted once in the settings"; reporter said the online editor accepted it. UNCERTAIN risk.`);
  if (idCount > 40) N(file, basePath, 'settings with id', idCount, '40 (Theme Check warning only)', 'UNCERTAIN');
  return idCount;
}

// ---------- settings_schema.json ----------
const globalSettings = new Map();
{
  const f = path.join(ROOT, 'config/settings_schema.json');
  const file = rel(f); const src = readText(f); stats.filesChecked++;
  const size = Buffer.byteLength(src); if (size > 512 * 1024) V(file, '(file)', 'size', size, '512 KB');
  const data = parseJSON(file, src);
  if (data) {
    const info = data.find((g) => g.name === 'theme_info');
    if (!info) V(file, '[theme_info]', 'theme_info', 'missing', 'required', 'CONFIRMED');
    else {
      const p = '[0](theme_info)';
      for (const k of ['theme_name', 'theme_author', 'theme_version', 'theme_documentation_url']) if (!info[k]) V(file, p, k, 'missing/empty', 'required', 'CONFIRMED (docs)');
      checkLen(file, p, 'theme_author', info.theme_author, 25, 'CONFIRMED (server error seen in this project)');
      checkLen(file, p, 'theme_name', info.theme_name, 25, 'UNCERTAIN but likely');
      checkLen(file, p, 'theme_version', info.theme_version, 25, 'UNCERTAIN');
      if (info.theme_version && !/^\d+\.\d+\.\d+$/.test(info.theme_version)) NOTE(`${file} ${p}: theme_version "${info.theme_version}" is not plain MAJOR.MINOR.PATCH. No documented format (and not a length problem), but the brief recommends a short semver such as 1.0.0.`);
      const hasE = !!info.theme_support_email, hasU = !!info.theme_support_url;
      if (hasE && hasU) V(file, p, 'theme_support_email + theme_support_url', 'both present', 'exactly one', 'CONFIRMED (docs)');
      if (!hasE && !hasU) V(file, p, 'theme_support_email/url', 'neither', 'exactly one', 'CONFIRMED (docs)');
      if (hasE && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.theme_support_email)) V(file, p, 'theme_support_email', info.theme_support_email, 'valid email', 'CONFIRMED');
      if (hasE && /example\.(com|org|net)$|placeholder/i.test(info.theme_support_email)) NOTE(`${file} ${p}: theme_support_email "${info.theme_support_email}" is a placeholder (format valid, so not an upload blocker; it shows in the theme editor as the support contact).`);
      for (const k of ['theme_documentation_url', 'theme_support_url']) if (info[k] && !/^https?:\/\/[^\s]+\.[^\s]+/.test(info[k])) V(file, p, k, info[k], 'valid uri', 'CONFIRMED');
      for (const k of ['theme_documentation_url', 'theme_support_url', 'theme_support_email']) if (info[k]) checkLen(file, p, k, info[k], 255, 'UNCERTAIN', { nearOnly: true });
      const known = new Set(['name', 'theme_name', 'theme_author', 'theme_version', 'theme_documentation_url', 'theme_support_url', 'theme_support_email']);
      Object.keys(info).filter((k) => !known.has(k)).forEach((k) => V(file, p, k, 'unknown key', 'not allowed in theme_info', 'LIKELY'));
    }
    data.forEach((g, gi) => {
      if (g.name === 'theme_info') return;
      checkLen(file, `[${gi}]`, 'settings category name', g.name, 25, 'UNCERTAIN (no documented limit)', { nearOnly: true });
      checkSettingsArray(file, `[${gi}](${g.name}).settings`, g.settings || [], globalSettings, 'settings_schema.json (global scope)');
    });
  }
}
const globalSettingDefs = new Map();
{
  const data = JSON.parse(readText(path.join(ROOT, 'config/settings_schema.json')));
  data.forEach((g) => (g.settings || []).forEach((s) => s.id && globalSettingDefs.set(s.id, s)));
}

// ---------- settings_data.json ----------
{
  const f = path.join(ROOT, 'config/settings_data.json'); const file = rel(f); const src = readText(f); stats.filesChecked++;
  const size = Buffer.byteLength(src); if (size > 1.5 * 1024 * 1024) V(file, '(file)', 'size', size, '1.5 MB');
  const d = parseJSON(file, src);
  if (d) {
    const blocks = [];
    if (typeof d.current === 'object') blocks.push(['current', d.current]);
    else if (typeof d.current === 'string' && !(d.presets && d.presets[d.current])) V(file, 'current', 'current', d.current, 'must name an existing preset', 'CONFIRMED');
    for (const [k, v] of Object.entries(d.presets || {})) blocks.push([`presets.${k}`, v]);
    for (const [bp, obj] of blocks) for (const [k, v] of Object.entries(obj)) {
      if (k === 'sections' || k === 'content_for_index' || k === 'blocks') continue;
      const s = globalSettingDefs.get(k);
      if (!s) { V(file, `${bp}.${k}`, 'setting id', k, 'must exist in settings_schema.json', 'LIKELY'); continue; }
      checkSettingValue(file, `${bp}.${k}`, s, v, 'settings_data value');
      if (NO_DEFAULT.has(s.type) && v === '') NOTE(`${file} ${bp}.${k}: ${s.type} value is "" (empty string). Usually treated as blank; Dawn simply omits unset resource settings. Low risk.`);
    }
  }
}

// ---------- sections ----------
const sectionSchemas = new Map();
const secDir = path.join(ROOT, 'sections');
for (const fn of fs.readdirSync(secDir).filter((f) => f.endsWith('.liquid'))) {
  const f = path.join(secDir, fn); const file = rel(f); const src = readText(f); stats.filesChecked++;
  const size = Buffer.byteLength(src); if (size > 256 * 1024) V(file, '(file)', 'size', size, '256 KB'); else if (size > 0.9 * 256 * 1024) N(file, '(file)', 'size', size, '256 KB');
  const re = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/g; const ms = [...src.matchAll(re)];
  if (ms.length > 1) V(file, '(file)', '{% schema %} count', ms.length, '1');
  for (const tag of ['stylesheet', 'javascript']) { const c = (src.match(new RegExp(`\\{%-?\\s*${tag}\\s*-?%\\}`, 'g')) || []).length; if (c > 1) V(file, '(file)', `{% ${tag} %} count`, c, '1'); }
  if (!ms.length) { NOTE(`${file}: no {% schema %}`); continue; }
  const sch = parseJSON(file, ms[0][1], '{% schema %}'); if (!sch) continue; stats.schemasParsed++;
  const name = fn.replace(/\.liquid$/, ''); sectionSchemas.set(name, sch);
  if (sch.name == null) V(file, 'schema.name', 'section name', 'missing', 'required');
  else checkTextField(file, 'schema.name', 'section name', sch.name, 25, 'CONFIRMED (docs)');
  if (sch.limit != null && ![1, 2].includes(sch.limit)) V(file, 'schema.limit', 'section limit', sch.limit, '1 or 2', 'CONFIRMED (docs)');
  if (sch.tag != null && !['article', 'aside', 'div', 'footer', 'header', 'section'].includes(sch.tag)) V(file, 'schema.tag', 'section tag', sch.tag, 'article|aside|div|footer|header|section', 'CONFIRMED (docs)');
  if (sch.enabled_on && sch.disabled_on) V(file, 'schema', 'enabled_on + disabled_on', 'both', 'only one', 'CONFIRMED (docs)');
  if (sch.max_blocks != null && (sch.max_blocks < 1 || sch.max_blocks > 50)) V(file, 'schema.max_blocks', 'max_blocks', sch.max_blocks, '1..50', 'CONFIRMED (docs)');
  else if (sch.max_blocks >= 45) N(file, 'schema.max_blocks', 'max_blocks', sch.max_blocks, 50, 'CONFIRMED');
  const allowed = new Set(['name', 'tag', 'class', 'limit', 'settings', 'blocks', 'max_blocks', 'presets', 'default', 'locales', 'enabled_on', 'disabled_on']);
  Object.keys(sch).filter((k) => !allowed.has(k)).forEach((k) => V(file, `schema.${k}`, 'schema attribute', k, 'known section schema attribute', 'LIKELY'));
  checkSettingsArray(file, 'schema.settings', sch.settings || [], new Map(), 'section');
  const btypes = new Set(), bnames = new Set();
  (sch.blocks || []).forEach((b, bi) => {
    const bp = `schema.blocks[${bi}](type=${b.type})`;
    if (!b.type) V(file, bp, 'block type', 'missing', 'required');
    if (btypes.has(b.type)) V(file, bp, 'block type', `duplicate ${b.type}`, 'unique within section', 'CONFIRMED (docs)'); btypes.add(b.type);
    if (b.type === '@app' || b.type === '@theme') return;
    if (b.name == null) V(file, bp, 'block name', 'missing', 'required');
    else { checkTextField(file, bp, 'block name', b.name, 25, 'CONFIRMED (docs)'); if (bnames.has(b.name)) V(file, bp, 'block name', `duplicate "${b.name}"`, 'unique within section', 'CONFIRMED (docs)'); bnames.add(b.name); }
    if (b.limit != null && !(Number.isInteger(b.limit) && b.limit >= 1)) V(file, bp, 'block limit', b.limit, 'positive integer', 'LIKELY');
    checkSettingsArray(file, `${bp}.settings`, b.settings || [], new Map(), `block ${b.type}`);
  });
  (sch.presets || []).forEach((pr, pi) => {
    const pp = `schema.presets[${pi}]`;
    if (pr.name == null) V(file, pp, 'preset name', 'missing', 'required'); else checkTextField(file, pp, 'preset name', pr.name, 25, 'WELL-ESTABLISHED');
    const pblocks = Array.isArray(pr.blocks) ? pr.blocks : Object.values(pr.blocks || {});
    if (pblocks.length > 50) V(file, pp, 'preset blocks', pblocks.length, 50);
    pblocks.forEach((b, j) => { if (!btypes.has(b.type) && !btypes.has('@theme')) V(file, `${pp}.blocks[${j}]`, 'preset block type', b.type, `one of ${[...btypes]}`, 'CONFIRMED'); });
    const counts = {}; pblocks.forEach((b) => { counts[b.type] = (counts[b.type] || 0) + 1; });
    (sch.blocks || []).forEach((b) => { if (b.limit && counts[b.type] > b.limit) V(file, pp, `preset blocks of type ${b.type}`, counts[b.type], `block limit ${b.limit}`); });
    if (sch.max_blocks && pblocks.length > sch.max_blocks) V(file, pp, 'preset blocks', pblocks.length, `max_blocks ${sch.max_blocks}`);
    // preset settings values
    const byId = new Map((sch.settings || []).filter((s) => s.id).map((s) => [s.id, s]));
    for (const [k, v] of Object.entries(pr.settings || {})) { const s = byId.get(k); if (!s) V(file, `${pp}.settings.${k}`, 'preset setting', k, 'must exist in schema', 'LIKELY'); else checkSettingValue(file, `${pp}.settings.${k}`, s, v, 'preset value'); }
  });
  if (sch.default) NOTE(`${file}: legacy "default" attribute present`);
}

// ---------- JSON templates & section groups ----------
function checkSectionInstances(file, data, kind) {
  const secs = data.sections || {}; const order = data.order || [];
  const ids = Object.keys(secs);
  if (ids.length > 25) V(file, 'sections', `sections per ${kind}`, ids.length, 25, 'CONFIRMED (docs)'); else if (ids.length >= 23) N(file, 'sections', `sections per ${kind}`, ids.length, 25, 'CONFIRMED');
  ids.filter((id) => !order.includes(id)).forEach((id) => V(file, `sections.${id}`, 'order', `"${id}" missing from order`, 'every section id must be listed in order', 'LIKELY'));
  order.filter((id) => !secs[id]).forEach((id) => V(file, 'order', 'order', `"${id}" not in sections`, 'order must reference existing section ids', 'CONFIRMED'));
  let totalBlocks = 0;
  for (const [id, inst] of Object.entries(secs)) {
    const sp = `sections.${id}`;
    const sch = sectionSchemas.get(inst.type);
    if (!sch) { V(file, sp, 'section type', inst.type, 'existing sections/*.liquid with schema', 'CONFIRMED'); continue; }
    if (kind === 'template' && sch.enabled_on && sch.enabled_on.templates && !sch.enabled_on.templates.includes('*')) {
      const tname = path.basename(file, '.json').split('.')[0];
      if (!sch.enabled_on.templates.includes(tname)) V(file, sp, 'enabled_on', `${inst.type} used in ${tname}`, `enabled_on.templates ${JSON.stringify(sch.enabled_on.templates)}`, 'CONFIRMED');
    }
    if (kind === 'section group' && sch.enabled_on && !sch.enabled_on.groups) V(file, sp, 'enabled_on', `${inst.type} restricted to templates`, 'must allow groups', 'LIKELY');
    const byId = new Map((sch.settings || []).filter((s) => s.id).map((s) => [s.id, s]));
    for (const [k, v] of Object.entries(inst.settings || {})) { const s = byId.get(k); if (!s) V(file, `${sp}.settings.${k}`, 'setting id', k, `must exist in ${inst.type} schema`, 'LIKELY'); else checkSettingValue(file, `${sp}.settings.${k}`, s, v, 'template value'); }
    const blocks = inst.blocks || {}; const bo = inst.block_order || [];
    const bids = Object.keys(blocks); totalBlocks += bids.length;
    if (bids.length > 50) V(file, sp, 'blocks per section', bids.length, 50, 'CONFIRMED (docs)');
    if (sch.max_blocks && bids.length > sch.max_blocks) V(file, sp, 'blocks', bids.length, `max_blocks ${sch.max_blocks}`, 'CONFIRMED');
    bids.filter((b) => !bo.includes(b)).forEach((b) => V(file, `${sp}.blocks.${b}`, 'block_order', `"${b}" missing from block_order`, 'listed in block_order', 'LIKELY'));
    bo.filter((b) => !blocks[b]).forEach((b) => V(file, `${sp}.block_order`, 'block_order', `"${b}" not in blocks`, 'existing block id', 'CONFIRMED'));
    const counts = {};
    for (const [bid, b] of Object.entries(blocks)) {
      const bp = `${sp}.blocks.${bid}`; const bs = (sch.blocks || []).find((x) => x.type === b.type);
      counts[b.type] = (counts[b.type] || 0) + 1;
      if (!bs) { V(file, bp, 'block type', b.type, `one of ${(sch.blocks || []).map((x) => x.type)}`, 'CONFIRMED'); continue; }
      const bById = new Map((bs.settings || []).filter((s) => s.id).map((s) => [s.id, s]));
      for (const [k, v] of Object.entries(b.settings || {})) { const s = bById.get(k); if (!s) V(file, `${bp}.settings.${k}`, 'setting id', k, `must exist in block ${b.type}`, 'LIKELY'); else checkSettingValue(file, `${bp}.settings.${k}`, s, v, 'template value'); }
    }
    (sch.blocks || []).forEach((b) => { if (b.limit && counts[b.type] > b.limit) V(file, sp, `blocks of type ${b.type}`, counts[b.type], `block limit ${b.limit}`, 'CONFIRMED'); });
  }
  if (totalBlocks > 1250) V(file, '(file)', `blocks per ${kind}`, totalBlocks, 1250, 'CONFIRMED (docs)');
}
const tplDir = path.join(ROOT, 'templates');
const tplFiles = fs.readdirSync(tplDir);
if (tplFiles.filter((f) => f.endsWith('.json')).length > 1000) V('templates', '(dir)', 'JSON templates', tplFiles.length, 1000);
for (const fn of tplFiles) {
  const f = path.join(tplDir, fn); const file = rel(f); stats.filesChecked++;
  const src = readText(f); const size = Buffer.byteLength(src);
  if (fn.endsWith('.json')) {
    if (size > 512 * 1024) V(file, '(file)', 'size', size, '512 KB');
    const d = parseJSON(file, stripLeadingComment(src)); if (d) checkSectionInstances(file, d, 'template');
    if (fs.existsSync(path.join(tplDir, fn.replace(/\.json$/, '.liquid')))) V(file, '(file)', 'template', 'both .json and .liquid', 'only one', 'CONFIRMED');
  }
}
const groups = fs.readdirSync(secDir).filter((f) => f.endsWith('.json'));
if (groups.length > 20) V('sections', '(dir)', 'section groups', groups.length, 20);
for (const fn of groups) {
  const f = path.join(secDir, fn); const file = rel(f); stats.filesChecked++;
  const src = readText(f); if (Buffer.byteLength(src) > 512 * 1024) V(file, '(file)', 'size', Buffer.byteLength(src), '512 KB');
  const d = parseJSON(file, stripLeadingComment(src)); if (!d) continue;
  if (!d.type || !(['header', 'footer', 'aside'].includes(d.type) || /^custom\.[a-z0-9_-]+$/.test(d.type))) V(file, 'type', 'group type', d.type, 'header|footer|aside|custom.<name>', 'CONFIRMED');
  if (!d.name) V(file, 'name', 'group name', 'missing', 'required', 'CONFIRMED'); else checkLen(file, 'name', 'group name', d.name, 25, 'UNCERTAIN (no documented limit)', { nearOnly: true });
  checkSectionInstances(file, d, 'section group');
}

// ---------- locales ----------
{
  const defaults = localeFiles.filter((f) => /\.default\.json$/.test(f));
  const sdefaults = localeFiles.filter((f) => /\.default\.schema\.json$/.test(f));
  if (defaults.length !== 1) V('locales', '(dir)', '*.default.json count', defaults.length, 'exactly 1', 'CONFIRMED (docs)');
  if (sdefaults.length > 1) V('locales', '(dir)', '*.default.schema.json count', sdefaults.length, 'at most 1', 'CONFIRMED (docs)');
  for (const fn of localeFiles) {
    const f = path.join(localeDir, fn); const file = rel(f); stats.filesChecked++;
    if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*(\.default)?(\.schema)?\.json$/.test(fn)) V(file, '(file)', 'locale file name', fn, 'IETF tag (e.g. es.json, en-GB.schema.json)', 'CONFIRMED (docs)');
    const src = readText(f); const size = Buffer.byteLength(src);
    if (size > 1.5 * 1024 * 1024) V(file, '(file)', 'size', size, '1.5 MB');
    const d = parseJSON(file, src); if (!d) continue;
    let count = 0; let maxLen = 0; let maxKey = '';
    (function walk(o, p) {
      for (const [k, v] of Object.entries(o)) {
        const kp = p ? `${p}.${k}` : k;
        if (k.includes('.')) V(file, kp, 'locale key', k, 'no dots inside a key segment', 'LIKELY');
        if (v && typeof v === 'object') walk(v, kp);
        else { count++; if (typeof v !== 'string') V(file, kp, 'locale value', typeof v, 'string', 'LIKELY'); const L = len(v); if (L > maxLen) { maxLen = L; maxKey = kp; }
          if (L > 1000) V(file, kp, 'translation length', L, 1000, 'CONFIRMED (docs)'); else if (L >= 900) N(file, kp, 'translation length', L, 1000, 'CONFIRMED'); }
      }
    })(d, '');
    if (count > 3400) V(file, '(file)', 'translations', count, 3400, 'CONFIRMED (docs)'); else if (count >= 3060) N(file, '(file)', 'translations', count, 3400, 'CONFIRMED');
    NOTE(`${file}: ${count} translations, longest value ${maxLen} chars (${maxKey}), ${size} bytes -- all well under 3,400 / 1,000 / 1.5 MB.`);
  }
}

// ---------- other file sizes ----------
for (const dir of ['snippets', 'layout', 'sections', 'blocks']) {
  const d = path.join(ROOT, dir); if (!fs.existsSync(d)) continue;
  for (const fn of fs.readdirSync(d).filter((x) => x.endsWith('.liquid'))) {
    const f = path.join(d, fn); const size = fs.statSync(f).size; stats.filesChecked++;
    if (size > 256 * 1024) V(rel(f), '(file)', 'size', size, '256 KB'); else if (size >= 0.9 * 256 * 1024) N(rel(f), '(file)', 'size', size, '256 KB');
    const src = fs.readFileSync(f, 'utf8');
    if ((dir === 'snippets' || dir === 'layout') && /\{%-?\s*schema\s*-?%\}/.test(src)) V(rel(f), '(file)', '{% schema %}', 'present', `not allowed in ${dir}`, 'CONFIRMED');
  }
}
{
  const lay = fs.readFileSync(path.join(ROOT, 'layout/theme.liquid'), 'utf8');
  if (!/\{\{-?\s*content_for_header\s*-?\}\}/.test(lay)) V('layout/theme.liquid', '(file)', 'content_for_header', 'missing', 'required', 'CONFIRMED');
  if (!/\{\{-?\s*content_for_layout\s*-?\}\}/.test(lay)) V('layout/theme.liquid', '(file)', 'content_for_layout', 'missing', 'required', 'CONFIRMED');
  for (const m of lay.matchAll(/\{%-?\s*sections\s+'([^']+)'/g)) if (!fs.existsSync(path.join(secDir, m[1] + '.json'))) V('layout/theme.liquid', m[0], 'sections group', m[1], 'existing group file', 'CONFIRMED');
  for (const m of lay.matchAll(/\{%-?\s*section\s+'([^']+)'/g)) if (!fs.existsSync(path.join(secDir, m[1] + '.liquid'))) V('layout/theme.liquid', m[0], 'section', m[1], 'existing section file', 'CONFIRMED');
}
// whole theme size / count / stray files
{
  let total = 0, files = 0, code = 0; const stray = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { files++; const s = fs.statSync(p).size; total += s; if (!rel(p).startsWith('assets/')) code += s; const top = rel(p).split('/')[0]; if (!['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates', 'blocks'].includes(top)) stray.push(rel(p)); else if (top === 'assets' && s > 20 * 1024 * 1024) V(rel(p), '(file)', 'asset size', s, '20 MB', 'UNCERTAIN'); } } })(ROOT);
  NOTE(`Theme totals: ${files} files, ${total} bytes (${code} bytes excluding assets) -- far under 100,000 files / 250 MB / 50 MB zip.`);
  if (stray.length) NOTE(`Files outside theme directories: ${stray.join(', ')} (the RC build excludes README.md from the ZIP).`);
}

console.log(JSON.stringify({ stats, violations, near, notes }, null, 2));
