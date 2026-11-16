"""Static verification for the character reference site."""
from .config import SiteConfig
from .rules import Failure, run_checks

__all__ = ['SiteConfig', 'Failure', 'run_checks']
