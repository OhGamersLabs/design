"""Command-line interface with stable rule-prefixed diagnostics."""
import argparse
from pathlib import Path
from .config import SiteConfig
from .rules import UsageError, expand_rules, run_checks

def main(argv=None,*,config=None):
    parser=argparse.ArgumentParser(description='Check the built Bunny reference site')
    parser.add_argument('--dist',type=Path)
    parser.add_argument('--rules',help='comma-separated rule ids (R12 expands to R12a,R12b)')
    parser.add_argument('--pages',nargs='+',help='only scan these clean URL paths')
    parser.add_argument('--pending',nargs='+',default=[],help='existing targets whose anchors are not checked yet')
    args=parser.parse_args(argv)
    cfg=config or SiteConfig()
    if args.dist is not None:cfg.dist=args.dist.resolve()
    try:rules=expand_rules(args.rules.split(',') if args.rules else None)
    except ValueError as exc:parser.error(str(exc))
    try:errors=run_checks(cfg,rules=rules,pages=args.pages,pending=args.pending)
    except UsageError as exc:
        print('usage: '+str(exc))
        return 2
    for error in errors:print(error)
    if errors:return 1
    print(f'site check: OK ({len(rules)} rules)')
    return 0
