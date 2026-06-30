#!/usr/bin/env python3
from pathlib import Path
import runpy
import sys


def main():
    script = Path(__file__).parent / "arquitectura" / "md_to_docx.py"
    if not script.exists():
        print(f"Missing target script: {script}", file=sys.stderr)
        raise SystemExit(1)
    runpy.run_path(str(script), run_name="__main__")


if __name__ == "__main__":
    main()
