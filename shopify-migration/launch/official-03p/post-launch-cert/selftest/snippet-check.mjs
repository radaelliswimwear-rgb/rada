// Parses every JS snippet quoted in README.md (inline code that starts with "(async()=>" or "window.__") with an async wrapper.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const md = fs.readFileSync(path.join(here, '..', 'README.md'), 'utf8');
const snips = [...md.matchAll(/`((?:\(async\(\)=>|await window\.__|window\.__)[^`]*)`/g)].map((m) => m[1]);
let bad = 0;
for (const s of snips) {
  const code = s.replace(/\s*\/\/.*$/, '');
  try { new vm.Script('(async()=>{\n' + code + '\n})'); } catch (e) { bad++; console.log('FAIL: ' + code + ' -> ' + e.message); }
}
console.log('README snippets parsed: ' + (snips.length - bad) + '/' + snips.length);
process.exit(bad ? 1 : 0);
