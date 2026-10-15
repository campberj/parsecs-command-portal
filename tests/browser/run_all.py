"""Runs every tests/browser/test_*.py suite and reports a summary."""
import subprocess, sys, time
from pathlib import Path

here = Path(__file__).resolve().parent
suites = sorted(here.glob('test_*.py'))
failed = []
for s in suites:
    t0 = time.time()
    r = subprocess.run([sys.executable, str(s)], capture_output=True, text=True)
    lines = (r.stdout + r.stderr).strip().splitlines()
    ok = r.returncode == 0
    print(f"{'PASS' if ok else 'FAIL'}  {s.name}  ({time.time() - t0:.1f}s)  {lines[-1] if lines else ''}")
    if not ok:
        failed.append(s.name)
        print('\n'.join('      ' + l for l in lines[-30:]))
print(f'\n{len(suites) - len(failed)}/{len(suites)} browser suites passed')
sys.exit(1 if failed else 0)
