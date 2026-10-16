import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('deployment', Path(__file__).parents[1] / 'tools/cloudflare-local.py')
deployment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployment)


class RouteConflictTest(unittest.TestCase):
    def test_all_target_paths_and_wildcard_hosts_are_conflicts(self):
        for pattern in ['design.ohgamers.org/media/*', 'https://design.ohgamers.org/characters/*',
                        '*.ohgamers.org/*', '*ohgamers.org/specific/path', 'design.ohgamers.org/*']:
            with self.subTest(pattern=pattern):
                self.assertTrue(deployment.route_targets_host(pattern, 'design.ohgamers.org'))

    def test_unrelated_hosts_do_not_conflict(self):
        for pattern in ['ohgamers.org/*', 'other.ohgamers.org/*', '*.example.org/*']:
            with self.subTest(pattern=pattern):
                self.assertFalse(deployment.route_targets_host(pattern, 'design.ohgamers.org'))
