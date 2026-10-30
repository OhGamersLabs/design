"""Catalog provenance contracts; importing the builder must never build assets."""
from contextlib import ExitStack
import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


TOOL = Path(__file__).resolve().parents[1] / 'tools/build-local-catalog.py'


def load_builder():
    spec = importlib.util.spec_from_file_location('build_local_catalog', TOOL)
    module = importlib.util.module_from_spec(spec)
    # Keep the red test safe even with the original import-time build. Block
    # asset enumeration before it can reach image processing or ZIP creation.
    with ExitStack() as stack:
        stack.enter_context(patch.object(sys, 'dont_write_bytecode', True))
        for method in ('glob', 'mkdir', 'write_text', 'write_bytes'):
            stack.enter_context(patch.object(
                Path, method, side_effect=AssertionError(
                    f'import must not build: Path.{method} called')))
        stack.enter_context(patch(
            'zipfile.ZipFile', side_effect=AssertionError('import must not create a ZIP')))
        spec.loader.exec_module(module)
    return module


class SourceForTest(unittest.TestCase):
    def setUp(self):
        self.builder = load_builder()

    def test_import_does_not_build(self):
        self.assertTrue(callable(self.builder.main))

    def test_matching_baseline_is_recovered_with_original_field_order(self):
        entry = {'baseline_sha256': 'x', 'review_status': 'current-a'}
        source = self.builder.source_for('bunny/a.png', entry, 'x')
        self.assertEqual(source, {
            'kind': 'recovered-reference',
            'baseline_sha256': 'x', 'review_status': 'current-a'})
        self.assertEqual(list(source), ['kind', 'baseline_sha256', 'review_status'])
        self.assertEqual(entry, {'baseline_sha256': 'x', 'review_status': 'current-a'})

    def test_different_baseline_is_revised(self):
        source = self.builder.source_for(
            'bunny/a.png', {'baseline_sha256': 'x', 'review_status': 'current-a'}, 'y')
        self.assertEqual(source, {
            'kind': 'revised-reference',
            'baseline_sha256': 'x', 'review_status': 'current-a'})

    def test_explicit_no_baseline_is_local_without_control_field(self):
        entry = {'no_baseline': True, 'review_status': 'current-a'}
        source = self.builder.source_for('bunny/a.png', entry, 'y')
        self.assertEqual(source, {
            'kind': 'local-design-revision', 'review_status': 'current-a'})
        self.assertEqual(list(source), ['kind', 'review_status'])
        self.assertEqual(entry, {'no_baseline': True, 'review_status': 'current-a'})

    def test_invalid_entries_identify_the_asset(self):
        for entry in (None, {}, {'review_status': 'current-a'},
                      {'baseline_sha256': 'x', 'kind': 'anything'},
                      {'no_baseline': True, 'kind': 'anything'},
                      {'no_baseline': True, 'baseline_sha256': 'x'},
                      {'no_baseline': False, 'baseline_sha256': 'x'},
                      {'no_baseline': False}, {'no_baseline': 1}):
            with self.subTest(entry=entry):
                with self.assertRaisesRegex(ValueError, 'bunny/a[.]png'):
                    self.builder.source_for('bunny/a.png', entry, 'y')


if __name__ == '__main__':
    unittest.main()
