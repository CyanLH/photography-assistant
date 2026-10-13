"""Mock integration only: this does not validate Google tiles, credentials or billing."""
from pathlib import Path
import subprocess
raise SystemExit(subprocess.call(['node', 'qa/browser.mjs', '--maps'], cwd=Path(__file__).resolve().parents[1]))
