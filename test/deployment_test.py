from contextlib import redirect_stdout
import importlib.util
import inspect
import io
from pathlib import Path
import unittest
from unittest.mock import Mock, patch

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


class DeploymentCompatibilityTest(unittest.TestCase):
    def test_external_wrapper_imports_and_call_signatures_stay_compatible(self):
        for name in ['Client', 'credential', 'preflight', 'wrangler', 'publish']:
            self.assertTrue(callable(getattr(deployment, name)))
        self.assertEqual(list(inspect.signature(deployment.Client).parameters), ['key', 'email'])
        self.assertEqual(list(inspect.signature(deployment.credential).parameters), ['path'])
        self.assertEqual(list(inspect.signature(deployment.preflight).parameters), ['client'])
        self.assertEqual(list(inspect.signature(deployment.wrangler).parameters), ['key', 'email', 'args'])

    def test_help_lists_publish_without_loading_credentials_or_constructing_client(self):
        output = io.StringIO()
        with patch('sys.argv', ['cloudflare-local.py', '--help']), patch.object(deployment, 'credential') as credentials, \
                patch.object(deployment, 'Client') as client, redirect_stdout(output):
            with self.assertRaises(SystemExit) as result:
                deployment.main()
        self.assertEqual(result.exception.code, 0)
        self.assertIn('publish', output.getvalue())
        self.assertIn('--dry-run', output.getvalue())
        self.assertIn('--apply', output.getvalue())
        self.assertNotIn('upload,', output.getvalue())
        credentials.assert_not_called()
        client.assert_not_called()

    def test_publish_cli_defaults_to_plan_and_only_apply_enables_writes(self):
        for flag, apply in [([], False), (['--dry-run'], False), (['--apply'], True)]:
            with self.subTest(flag=flag):
                fake = Mock()
                argv = ['cloudflare-local.py', 'publish', '--credentials', '/unused/fake.env',
                        '--email', 'fake@example.invalid', *flag]
                with patch('sys.argv', argv), patch.object(deployment, 'credential', return_value='fake'), \
                        patch.object(deployment, 'Client', return_value=fake), \
                        patch.object(deployment, 'preflight') as preflight, \
                        patch.object(deployment, 'publish') as publish:
                    deployment.main()
                preflight.assert_called_once_with(fake)
                publish.assert_called_once_with(fake, apply=apply)

    def test_wrangler_output_redacts_key_and_removes_competing_authentication(self):
        completed = Mock(returncode=0, stdout='key: fake-secret\n', stderr='error fake-secret\n')
        output = io.StringIO()
        with patch.dict(deployment.os.environ, {'CLOUDFLARE_API_TOKEN': 'other-token', 'CF_API_TOKEN': 'other',
                                                'CF_API_BASE_URL': 'https://untrusted.invalid'}), \
                patch.object(deployment.subprocess, 'run', return_value=completed) as run, redirect_stdout(output):
            deployment.wrangler('fake-secret', 'fake@example.invalid', ['deploy', '--dry-run'])
        self.assertNotIn('fake-secret', output.getvalue())
        self.assertIn('[REDACTED]', output.getvalue())
        env = run.call_args.kwargs['env']
        for name in ['CLOUDFLARE_API_TOKEN', 'CF_API_TOKEN', 'CF_API_BASE_URL']:
            self.assertNotIn(name, env)
        self.assertEqual(env['WRANGLER_WRITE_LOGS'], 'false')
        self.assertEqual(env['WRANGLER_LOG_SANITIZE'], 'true')
