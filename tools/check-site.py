#!/usr/bin/env python3
"""Entry point; implementation is kept importable for fixture-based tests."""
import sys
sys.dont_write_bytecode = True
from site_check.cli import main

if __name__ == '__main__':
    raise SystemExit(main())
