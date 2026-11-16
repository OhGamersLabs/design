"""Build a data-only second character in an isolated, never hard-linked copy."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT/'test/fixtures/fixture-character'
sys.path.insert(0,str(ROOT/'tools'))
from site_check.htmlscan import parse_html


class FixtureCharacterTest(unittest.TestCase):
    def clone(self,source,target):
        """APFS copy-on-write where supported, ordinary independent copies otherwise."""
        result=subprocess.run(['cp','-cR',str(source),str(target)],capture_output=True,text=True)
        if result.returncode:
            # cp may have made a partial destination before rejecting clonefile.
            if target.is_dir():shutil.rmtree(target)
            elif target.exists():target.unlink()
            if source.is_dir():shutil.copytree(source,target)
            else:shutil.copy2(source,target)
        if source.is_file() and not source.is_symlink():
            self.assertNotEqual((source.stat().st_dev,source.stat().st_ino),(target.stat().st_dev,target.stat().st_ino),'copies must never be hard links')

    def copy_repository(self,destination):
        destination.mkdir()
        for source in ROOT.iterdir():
            if source.name in ('.git','.DS_Store'):continue
            self.clone(source,destination/source.name)
        # Dependencies and originals are independent copies, including on filesystems
        # without APFS support; building can never write through to the real repo.
        for directory in ('node_modules','.release','docs/public'):
            source=ROOT/directory;target=destination/directory
            if not source.exists():continue
            for file in source.rglob('*'):
                if file.is_file() and not file.is_symlink():
                    other=target/file.relative_to(source)
                    self.assertNotEqual((file.stat().st_dev,file.stat().st_ino),(other.stat().st_dev,other.stat().st_ino),str(file))

    def run_flow(self,root,*args):
        result=subprocess.run(args,cwd=root,capture_output=True,text=True,timeout=240)
        self.assertEqual(result.returncode,0,' '.join(map(str,args))+'\n'+result.stdout+'\n'+result.stderr)
        return result.stdout

    def allowed_overlay(self,path):
        prefixes=('docs/.vitepress/data/fixture/','docs/characters/fixture/',
                  'docs/public/characters/fixture/','.release/fixture/')
        exact=('docs/public/characters/origins/fixture-original-latest.webp',
               '.release/origins/fixture-original-latest.png')
        return path.startswith(prefixes) or path in exact

    def overlay(self,root):
        overlaid=[]
        for source in sorted(FIXTURE.rglob('*')):
            if not source.is_file():continue
            relative=source.relative_to(FIXTURE).as_posix()
            self.assertTrue(self.allowed_overlay(relative),relative)
            target=root/relative;target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(source,target);overlaid.append(relative)
        names=json.loads((root/'docs/.vitepress/data/fixture/asset-names.json').read_text())
        for aid in names:
            collection='origins' if aid=='fixture-original-latest' else 'fixture'
            color=tuple(hashlib.sha256(('fixture:'+aid).encode()).digest()[:3])
            for base,suffix,format in (('docs/public/characters','.webp','WEBP'),('.release','.png','PNG')):
                relative=f'{base}/{collection}/{aid}{suffix}'
                self.assertTrue(self.allowed_overlay(relative),relative)
                path=root/relative;path.parent.mkdir(parents=True,exist_ok=True)
                with Image.new('RGB',(24,32),color) as image:
                    image.save(path,format=format,**({'lossless':True,'exact':True} if format=='WEBP' else {}))
                overlaid.append(relative)
        self.assertEqual(len(overlaid),len(set(overlaid)))
        return overlaid

    def fixture_only_catalog(self,root,stage):
        """No native originals in a fresh clone: generate only the fixture's catalog.

        The real builder still validates every original it sees. Its generated
        entries are merged with the checkout's unchanged tracked manifests; no
        missing-original assertion or real-character metadata is bypassed.
        """
        for directory in ('docs/.vitepress/data/fixture','docs/public/characters/fixture','.release/fixture'):
            target=stage/directory;target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copytree(root/directory,target)
        for relative in ('docs/public/characters/origins/fixture-original-latest.webp','.release/origins/fixture-original-latest.png'):
            target=stage/relative;target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(root/relative,target)
        self.run_flow(root,'python3','tools/build-local-catalog.py','--root',str(stage))
        for base in ('catalog','docs/public/catalog'):
            target=root/base/'fixture';target.mkdir(parents=True,exist_ok=True)
            shutil.copy2(stage/base/'fixture/manifest.json',target/'manifest.json')
            origin=root/base/'origins/manifest.json'
            document=json.loads(origin.read_text())
            document['assets']+=json.loads((stage/base/'origins/manifest.json').read_text())['assets']
            document['assets'].sort(key=lambda asset:asset['id'])
            document['asset_count']=len(document['assets'])
            origin.write_text(json.dumps(document,ensure_ascii=False,indent=2)+'\n')
        release=root/'catalog/releases.json'
        document=json.loads(release.read_text())
        document['assets']+=json.loads((stage/'catalog/releases.json').read_text())['assets']
        document['assets'].sort(key=lambda asset:(asset['character'],asset['path']))
        release.write_text(json.dumps(document,ensure_ascii=False,indent=2)+'\n')

    def main_markup(self,dist):
        result={}
        for file in sorted((dist/'characters/bunny').glob('*.html')):
            html=file.read_text()
            main=re.search(r'<main\b[^>]*\bclass="[^"]*\bbunny-page\b[^"]*"[^>]*>.*?</main>',html,re.S)
            self.assertIsNotNone(main,str(file))
            value=re.sub(r'data-v-[0-9a-f]{8}','data-v-X',main[0])
            value=re.sub(r'(/assets/(?:chunks/)?[^"\'\s>()]+?)\.[A-Za-z0-9_-]{8}\.((?:lean\.)?js|css|woff2)',r'\1.H.\2',value)
            result[file.name]=value
        self.assertEqual(len(result),30,'every Bunny character page must be compared')
        return result

    def parsed(self,root,path):
        file=root/'docs/.vitepress/dist'/path
        return parse_html(file.read_text())

    def test_fixture_character_needs_only_data_pages_and_images(self):
        self.assertFalse((ROOT/'docs/characters/fixture').exists(),'fixture must stay outside real docs')
        with tempfile.TemporaryDirectory(prefix='design-fixture-character-') as temporary:
            root=Path(temporary)/'repo'
            self.copy_repository(root)
            has_originals=(root/'.release/bunny').is_dir()
            self.run_flow(root,'npm','run','build')
            dist=root/'docs/.vitepress/dist'
            baseline=self.main_markup(dist)
            before={file.relative_to(root).as_posix():hashlib.sha256(file.read_bytes()).hexdigest()
                    for base in ('docs/public','.release') if (root/base).exists()
                    for file in (root/base).rglob('*') if file.is_file()}
            overlaid=self.overlay(root)
            self.assertTrue(overlaid)
            for relative,digest in before.items():
                self.assertEqual(hashlib.sha256((root/relative).read_bytes()).hexdigest(),digest,'overlay changed '+relative)
            if has_originals:
                self.run_flow(root,'python3','tools/build-local-catalog.py')
            else:
                self.fixture_only_catalog(root,Path(temporary)/'generated-fixture')
                print('Fixture character: .release/bunny is absent; generated fixture catalogs separately; skipped check:local and check:site (native originals required).',flush=True)
            self.run_flow(root,'python3','tools/build-thumbs.py')
            self.run_flow(root,'npm','run','build')
            if has_originals:
                self.run_flow(root,'npm','run','check:local')
                self.run_flow(root,'npm','run','check:site')
            home=self.parsed(root,'characters/fixture/index.html')
            text=home.visible_text()
            for expected in ('Fixture','守卫','修长','装配资料','身份与画风','部件装配','参考资料'):
                self.assertIn(expected,text)
            nav=[node for node in home.root.walk() if node.has_class('VPNavBarMenu')]
            self.assertEqual(len(nav),1)
            links=[a for a in nav[0].find('a') if a.attrs.get('href','').startswith('/characters/')]
            self.assertEqual([(a.attrs['href'],a.text().strip()) for a in links],[('/characters/bunny/','Bunny'),('/characters/fixture/','Fixture')])
            chips=[node for node in home.body.walk() if node.has_class('bunny-chips__swatch')]
            custom=[chip for chip in chips if 'style' in chip.attrs]
            self.assertEqual(len(custom),1)
            self.assertEqual(custom[0].attrs['class'],'bunny-chips__swatch')
            self.assertEqual(custom[0].attrs['style'],'background-color:#12ab89;')
            swatch=[chip for chip in chips if chip.has_class('bunny-chips__swatch--orange')]
            self.assertEqual(len(swatch),1)
            self.assertNotIn('style',swatch[0].attrs)
            latest=home.body.find('ol','data-latest')
            self.assertEqual(len(latest),1)
            self.assertEqual([time.text() for time in latest[0].find('time')],['2026-11-16'])
            chapters=[node for node in home.body.walk() if node.has_class('bunny-chapters')]
            self.assertEqual([a.text() for a in chapters[0].find('a')],['身份与画风','部件装配','参考资料'])
            panels=home.body.find(attr='data-hero-panel')
            self.assertEqual([p.attrs['data-hero-panel'] for p in panels if 'hidden' not in p.attrs],['line'])
            layer=self.parsed(root,'characters/fixture/part-1.html')
            self.assertIn('第 1 层，共 0 到 2 层',layer.visible_text())
            self.assertEqual(len([n for n in layer.body.walk() if n.attrs.get('aria-label')=='部件资料']),1)
            maps=[n for n in layer.body.walk() if n.attrs.get('aria-label')=='第 0 到 2 层装配']
            self.assertEqual(len(maps),1)
            self.assertEqual(len(maps[0].find('a')),3)
            pager=[node for node in layer.body.walk() if node.has_class('bunny-pager')]
            self.assertEqual([a.attrs['href'] for a in pager[0].find('a')],['/characters/fixture/part-0','/characters/fixture/part-2'])
            reference=self.parsed(root,'characters/fixture/reference.html')
            cards=[node for node in reference.body.walk() if node.has_class('bunny-reference-card')]
            self.assertEqual([(a.attrs['href'],a.text()) for a in cards[0].find('a') if a.attrs['href'].endswith('/')],[('/characters/fixture/','Fixture')])
            reference_pager=[node for node in reference.body.walk() if node.has_class('bunny-pager')]
            self.assertEqual([a.attrs['href'] for a in reference_pager[0].find('a')],['/characters/fixture/part-2'])
            stub=self.parsed(root,'characters/fixture/legacy.html')
            self.assertEqual([n.attrs['content'] for n in stub.root.find('meta') if n.attrs.get('http-equiv')=='refresh'],['3; url=/characters/fixture/#parts'])
            self.assertEqual(self.main_markup(dist),baseline,'Bunny main markup must remain byte-identical after normalising build noise')
