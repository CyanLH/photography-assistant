"""Portable entry point for the current browser suite (no Python Playwright needed)."""
from pathlib import Path
import subprocess
raise SystemExit(subprocess.call(['node', 'qa/browser.mjs', '--ui'], cwd=Path(__file__).resolve().parents[1]))
