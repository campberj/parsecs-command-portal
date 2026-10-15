// Runs every tests/node/*.test.cjs against dist/portal.cjs (build first: npm test does).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'node');
const files = readdirSync(dir).filter(f => f.endsWith('.test.cjs')).sort();
let failed = 0;
for (const f of files){
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(dir, f)], { encoding: 'utf8', env: { ...process.env, N: process.env.N || '120' } });
  const out = (r.stdout + r.stderr).trim().split('\n');
  const pass = r.status === 0;
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${f}  (${((Date.now() - t0) / 1000).toFixed(1)}s)  ${out[out.length - 1] || ''}`);
  if (!pass) console.log(out.slice(-25).map(l => '      ' + l).join('\n'));
}
console.log(`\n${files.length - failed}/${files.length} suites passed`);
process.exit(failed ? 1 : 0);
