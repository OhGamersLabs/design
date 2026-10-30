"""Task 0 contract tests: every broken sample starts from a passing small site."""
import base64
import contextlib
import hashlib
import io
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from site_check import SiteConfig, run_checks
from site_check.cli import main
from site_check.htmlscan import parse_html, clean_text


class SiteCheckTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.dist = self.root / 'dist'
        self.home = '/characters/bunny/'
        self.layer = '/characters/bunny/body-base'
        self.archive = '/characters/bunny/archive'
        self.downloads = '/characters/bunny/downloads'
        self.stub = '/characters/bunny/face'
        self.cfg = SiteConfig(root=self.root, dist=self.dist,
            page_titles={self.home: 'Bunny', self.layer: '身体', self.archive: '历史档案', self.downloads: '下载'},
            stubs=(self.stub,), latest=(('2026-10-29','场景图定稿','scene'),('2026-10-28','线稿通过','line'),('2026-10-28','姿势选定','pose'),('2026-10-27','携行三视','carry')),
            new_assets={'scene': ('current-scene', 2, 1, hashlib.md5(b'scene-original').hexdigest())},
            home_groups=(('dl-main','场景与线稿'),), page_groups=(('dl-main','场景与线稿'),('dl-measurement-data','尺寸数据')),
            home_download_count=3, measurement_anchors=('body-measurements','garment-dimensions'),
            frozen_file=self.root/'frozen.json', baseline_file=self.root/'baseline.json', ruler_paths=())
        self.assets=[]
        for aid in ['scene','line','pose','carry','old']:
            data=(aid+'-web').encode(); original=(aid+'-original').encode()
            asset={'id':aid,'source':{'review_status':('historical-' if aid=='old' else 'current-')+aid},
                   'web':{'path':f'/characters/bunny/3.1.0/{aid}.webp','sha256':hashlib.sha256(data).hexdigest(),'width':2,'height':1},
                   'original':{'path':f'/media/bunny/3.1.0/{aid}.png','width':2,'height':1,'sha256':hashlib.sha256(original).hexdigest()}}
            self.assets.append(asset)
            self.write('docs/public'+asset['web']['path'],data)
            self.write('.release/bunny/3.1.0/'+aid+'.png',original)
        self.origin={'id':'bunny-original','web':{'path':'/characters/origins/1.0.0/bunny-original.webp','sha256':'origin'},'original':{'path':'/media/origins/1.0.0/bunny-original.png'}}
        self.manifest={'assets':self.assets,'downloads':[{'path':'/media/bunny/3.1.0/bunny-3.1.0-design-reference.zip'}]}
        self.save_manifests()
        self.json('catalog/releases.json',{'assets':[{'path':a['original']['path']} for a in self.assets+[self.origin]]+[{'path':self.manifest['downloads'][0]['path']}]})
        self.json('docs/public/catalog/bunny/3.1.0/data.json',{})
        self.json('docs/.vitepress/data/bunny/asset-names.json',{a['id']:'中文名称' for a in self.assets+[self.origin]})
        self.json('docs/.vitepress/data/bunny/anchor-map.json',{'anchors':{},'stubs':{self.stub:{'target':self.home+'#identity','title':'身份与画风'}}})
        self.json('docs/.vitepress/data/bunny/display-text.json',{'catalog/bunny/3.1.0/data.json':{'原文':'新文字'},'@labels':{'body.front':'正面'}})
        self.json('catalog/bunny/3.1.0/data.json',{'a':['原文']})
        self.json('baseline.json',{self.home:['identity'],self.layer:['body']})
        self.write('frozen.bin',b'frozen')
        self.json('frozen.json',{'frozen.bin':hashlib.sha256(b'frozen').hexdigest()})
        self.write('docs/characters/bunny/index.md','---\nreleaseReady: false\n---\n# Bunny\n')
        thumbs={}
        for a in self.assets+[self.origin]:
            key=('origins/1.0.0/' if a is self.origin else 'bunny/3.1.0/')+a['id']
            thumbs[key]={'path':'/site/thumbs/'+key+'.webp','sourcePath':a['web']['path'],'sourceSha256':a['web']['sha256'],'sha256':'thumb','width':2,'height':1}
        self.json('docs/public/site/thumbs/index.json',thumbs)
        latest='<ol data-latest>'+''.join(f'<li data-asset-id="{a}"><time datetime="{d}">{d}</time><span data-latest-title>{t}</span>{self.figure(a)}</li>' for d,t,a in self.cfg.latest)+'</ol>'
        groups=self.groups(self.cfg.home_groups,['scene','line','pose'],home=True)
        self.page(self.home,'<h1>Bunny</h1><h2 id="identity">身份与画风</h2><div data-hero><span data-hero-status>本地审阅版，不是生产发布</span></div>'+latest+self.figure('bunny-original')+groups)
        self.page(self.layer,'<h1>身体</h1><h2 id="body">身体基准</h2>'+self.figure('scene'))
        self.page(self.archive,'<h1>历史档案</h1><p>3.1.0</p><h2>变更记录</h2><div data-changelog></div><ul data-archive-grid="old"><li data-archive-item="old"><span class="archive-stamp">历史</span>'+self.figure('old')+'</li></ul><div data-archive-measurements>'+self.figure('scene','现行：场景图')+'</div>')
        self.page(self.downloads,'<h1>下载</h1>'+self.groups(self.cfg.page_groups,['scene','line','pose','carry']))
        self.page(self.stub,'<p data-redirect-stub>本页已迁移，前往：<a href="'+self.home+'#identity">身份与画风</a></p>',head='<meta http-equiv="refresh" content="3; url='+self.home+'#identity">')
        self.write('dist/assets/site.css','body {color:#222}')

    def write(self,path,text):
        p=self.root/path; p.parent.mkdir(parents=True,exist_ok=True)
        p.write_bytes(text) if isinstance(text,bytes) else p.write_text(text,encoding='utf-8')
        return p
    def json(self,path,value): return self.write(path,json.dumps(value,ensure_ascii=False))
    def read_json(self,path): return json.loads((self.root/path).read_text())
    def save_manifests(self):
        self.json('catalog/bunny/3.1.0/manifest.json',self.manifest)
        self.json('catalog/origins/1.0.0/manifest.json',{'assets':[self.origin]})
        self.json('docs/public/catalog/bunny/3.1.0/manifest.json',self.manifest)
        self.json('docs/public/catalog/origins/1.0.0/manifest.json',{'assets':[self.origin]})
    def page(self,path,body,head=''):
        rel=path.lstrip('/')+('index.html' if path.endswith('/') else '.html')
        return self.write('dist/'+rel,'<!doctype html><html><head>'+head+'</head><body><div class="vp-doc">'+body+'</div></body></html>')
    def append(self,path,html):
        p=self.dist/(path.lstrip('/')+('index.html' if path.endswith('/') else '.html'))
        p.write_text(p.read_text().replace('</body>',html+'</body>'))
    def replace(self,path,old,new):
        p=self.dist/(path.lstrip('/')+('index.html' if path.endswith('/') else '.html'));p.write_text(p.read_text().replace(old,new))
    def figure(self,aid,caption='图像',group=''):
        collection='origins/1.0.0' if aid=='bunny-original' else 'bunny/3.1.0'
        return f'<figure class="release-image" data-asset-id="{aid}"><button {group}><img src="/characters/{collection}/{aid}.webp" alt="{caption}"></button><figcaption><strong>{caption}</strong></figcaption></figure>'
    def groups(self,groups,assets,home=False):
        out=''
        for i,(gid,label) in enumerate(groups):
            if not home:out+=f'<h2 id="{gid}">{label}</h2>'
            out+=f'<div data-download-group="{gid}"'+(f' id="{gid}"' if home else '')+'>'
            if home:out+=f'<h3>{label}</h3>'
            if i==0:out+='<ul>'+''.join(f'<li data-download-asset="{a}">名称</li>' for a in assets)+'</ul>'
            if gid=='dl-measurement-data':out+=''.join(f'<span id="{x}"></span>' for x in self.cfg.measurement_anchors)
            out+='</div>'
        return out
    def check(self,rule,**kw):return run_checks(self.cfg,rules=[rule],**kw)
    def good(self,rule,**kw):self.assertEqual([],self.check(rule,**kw))
    def bad(self,rule,**kw):self.assertIn(rule,[x.rule for x in self.check(rule,**kw)])
    def mutate_text(self,rule,text):self.good(rule);self.append(self.layer,'<p>'+text+'</p>');self.bad(rule)
    def search_index(self,docs):
        script=self.root/'make-index.mjs'
        module=(ROOT/'node_modules/minisearch/dist/es/index.js').as_uri()
        script.write_text('import MiniSearch from '+json.dumps(module)+';import {writeFileSync} from "node:fs";const m=new MiniSearch({fields:["title","titles","text"],storeFields:["title","titles"]});m.addAll('+json.dumps(docs,ensure_ascii=False)+');writeFileSync(process.argv[2],"export default "+JSON.stringify(JSON.stringify(m))+";");')
        p=self.dist/'assets/chunks/@localSearchIndexroot.test.js';p.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run(['node',str(script),str(p)],check=True,capture_output=True,text=True)
    def search_docs(self):return [{'id':self.archive+'#staff','title':'双手棍','titles':['历史档案'],'text':'双手棍 设计'}]

    def test_r1_dead_link(self):self.good('R1');self.append(self.layer,'<a href="/gone">失效</a>');self.bad('R1')
    def test_r1_stub_link(self):self.good('R1');self.append(self.layer,f'<a href="{self.stub}">链接</a>');self.bad('R1')
    def test_r1_missing_anchor(self):self.good('R1');self.append(self.layer,f'<a href="{self.home}#gone">链接</a>');self.bad('R1')
    def test_r1_pending_anchor(self):
        self.good('R1');self.append(self.layer,f'<a href="{self.home}#gone">链接</a>');self.good('R1',pending=[self.home]);self.bad('R1')
    def test_r1_selected_page_resolves_unselected_target(self):
        self.append(self.layer,f'<a href="{self.home}#identity">链接</a>');self.good('R1',pages=[self.layer]);self.replace(self.home,'id="identity"','id="gone"');self.bad('R1',pages=[self.layer])
    def test_r1_media_catalog(self):self.append(self.layer,'<a href="/media/bunny/3.1.0/scene.png">图</a>');self.good('R1');self.append(self.layer,'<a href="/media/bunny/3.1.0/missing.png">图</a>');self.bad('R1')
    def test_r2_missing_mapping(self):self.good('R2');self.replace(self.layer,'id="body"','id="other"');self.bad('R2')
    def test_r2_missing_target(self):
        self.good('R2');self.replace(self.layer,'id="body"','id="other"');d=self.read_json('docs/.vitepress/data/bunny/anchor-map.json');d['anchors'][self.layer+'#body']='/gone#x';self.json('docs/.vitepress/data/bunny/anchor-map.json',d);self.bad('R2')
    def test_r2_stub_target(self):
        self.good('R2');self.replace(self.layer,'id="body"','id="other"');d=self.read_json('docs/.vitepress/data/bunny/anchor-map.json');d['anchors'][self.layer+'#body']=self.stub;self.json('docs/.vitepress/data/bunny/anchor-map.json',d);self.bad('R2')
    def test_r2_refresh_mismatch(self):self.good('R2');self.replace(self.stub,'3; url='+self.home+'#identity','3; url='+self.layer+'#body');self.bad('R2')
    def test_r2_percent_encoded_html_target(self):
        self.replace(self.layer,'id="body"','id="身体"');self.json('baseline.json',{self.layer:['body']});d=self.read_json('docs/.vitepress/data/bunny/anchor-map.json');d['anchors'][self.layer+'#body']=self.layer+'.html#%E8%BA%AB%E4%BD%93';self.json('docs/.vitepress/data/bunny/anchor-map.json',d);self.good('R2');d['anchors']['/unknown#x']=self.home;self.json('docs/.vitepress/data/bunny/anchor-map.json',d);self.bad('R2')
    def test_r3_current_page_history(self):self.good('R3');self.append(self.layer,self.figure('old'));self.bad('R3')
    def test_r3_archive_current_grid(self):
        self.good('R3');self.append(self.archive,'<ul data-archive-grid="extra"><li data-archive-item="scene">'+self.figure('scene','现行：场景图')+'</li></ul>');self.bad('R3')
    def test_r3_history_duplicate(self):self.good('R3');self.append(self.archive,'<ul data-archive-grid="two"><li data-archive-item="old">'+self.figure('old')+'</li></ul>');self.bad('R3')
    def test_r3_history_missing(self):self.good('R3');self.replace(self.archive,'data-archive-item="old"','data-no-item="old"');self.bad('R3')
    def test_r3_current_archive_caption(self):self.good('R3');self.replace(self.archive,'现行：场景图','场景图');self.bad('R3')
    def test_r3_pages_scope(self):self.good('R3',pages=[self.layer]);self.replace(self.archive,'data-archive-item="old"','data-no-item="old"');self.good('R3',pages=[self.layer]);self.bad('R3')
    def test_r4_process_this_round(self):self.mutate_text('R4','本轮')
    def test_r4_process_keep(self):self.mutate_text('R4','保留')
    def test_r4_cancelled_scabbard(self):self.mutate_text('R4','刀鞘')
    def test_r4_details(self):self.good('R4');self.append(self.layer,'<details>说明</details>');self.bad('R4')
    def test_r4_archive_exception(self):self.append(self.layer,'<a href="/characters/bunny/archive">历史档案</a>');self.good('R4');self.append(self.layer,'<p>历史</p>');self.bad('R4')
    def test_r4_antialias_exception(self):self.append(self.layer,'<p>抗锯齿</p>');self.good('R4');self.append(self.layer,'<p>锯</p>');self.bad('R4')
    def test_r4_editorial_claim(self):self.mutate_text('R4','一眼就能认出')
    def test_r5_two_versions(self):self.good('R5');self.append(self.layer,'<p>3.1.0 3.1.0</p>');self.bad('R5')
    def test_r5_filename_excluded(self):self.append(self.layer,'<p>3.1.0 bunny-3.1.0-design-reference.zip</p>');self.good('R5');self.append(self.layer,'<p>3.1.0</p>');self.bad('R5')
    def test_r5_archive_changelog_version(self):self.good('R5');self.replace(self.archive,'<div data-changelog>','<div data-changelog>3.1.0');self.bad('R5')
    def test_r6_zero_gate(self):self.good('R6');self.write('docs/characters/bunny/index.md','---\ntitle: Bunny\n---');self.bad('R6')
    def test_r6_duplicate_gate(self):self.good('R6');self.write('docs/characters/bunny/index.md','---\nreleaseReady: false\nreleaseReady: false\n---');self.bad('R6')
    def test_r7_unknown_image(self):self.good('R7');self.append(self.layer,'<img src="/no-image.webp">');self.bad('R7')
    def allowed_download(self,path):
        self.append(self.layer,f'<a href="{path}">下载</a>');self.good('R7');self.append(self.layer,'<a href="/catalog/no.json">下载</a>');self.bad('R7')
    def test_r7_zip_allowlist(self):self.allowed_download('/media/bunny/3.1.0/bunny-3.1.0-design-reference.zip')
    def test_r7_dimensions_json_allowlist(self):self.allowed_download('/catalog/bunny/3.1.0/data.json')
    def test_r7_bunny_manifest_allowlist(self):self.allowed_download('/catalog/bunny/3.1.0/manifest.json')
    def test_r7_origin_manifest_allowlist(self):self.allowed_download('/catalog/origins/1.0.0/manifest.json')
    def test_r7b_missing_asset_id(self):self.good('R7b');self.replace(self.layer,' data-asset-id="scene"','');self.bad('R7b')
    def test_r8_source_hash(self):
        self.good('R8');d=self.read_json('docs/public/site/thumbs/index.json');d['bunny/3.1.0/scene']['sourceSha256']='wrong';self.json('docs/public/site/thumbs/index.json',d);self.bad('R8')
    def test_r9_latest_order(self):
        self.good('R9')
        p=self.dist/'characters/bunny/index.html';source=p.read_text()
        items=re.findall(r'<li data-asset-id="[^"]+">.*?</li>',source)
        source=source.replace(items[1],'__SECOND__').replace(items[2],items[1]).replace('__SECOND__',items[2])
        p.write_text(source);self.bad('R9')
    def test_r9_duplicate_image(self):self.good('R9');self.replace(self.home,'data-asset-id="line"','data-asset-id="scene"');self.bad('R9')
    def test_r9_pages_scope(self):self.good('R9',pages=[self.layer]);self.replace(self.home,'data-latest','data-not-latest');self.good('R9',pages=[self.layer]);self.bad('R9')
    def test_r10_unqualified_left(self):self.mutate_text('R10','左腿')
    def test_r10_unqualified_right_view(self):self.mutate_text('R10','右侧视图')
    def test_r10_character_left(self):self.append(self.layer,'<p>角色左腿</p>');self.good('R10');self.append(self.layer,'<p>左腿</p>');self.bad('R10')
    def test_r10_screen_left(self):self.append(self.layer,'<p>画面左上方</p>');self.good('R10');self.append(self.layer,'<p>左上方</p>');self.bad('R10')
    def test_r10_exception(self):self.append(self.layer,'<p>左右识别</p>');self.good('R10');self.append(self.layer,'<p>左右</p>');self.bad('R10')
    def test_r11_sun_caption(self):
        self.append(self.layer,self.figure('sun05-pose-structure-v1','SUN-05 人体结构稿，手中为占位杆'));self.good('R11');self.replace(self.layer,'SUN-05 人体结构稿，手中为占位杆','人体稿');self.bad('R11')
    def test_r11_front_caption(self):self.append(self.layer,self.figure('person-front','正面'));self.good('R11');self.replace(self.layer,'正面','正面后腰');self.bad('R11')
    def test_r11_side_caption(self):self.append(self.layer,self.figure('scene','角色右侧面'));self.good('R11');self.replace(self.layer,'角色右侧面','侧面');self.bad('R11')
    def test_r11_body_side_thickness(self):self.append(self.layer,'<p>刀身侧面厚度</p>');self.good('R11');self.append(self.layer,'<button>侧面</button>');self.bad('R11')
    def test_visible_chinese_slash(self):self.assertEqual('正面/侧面',clean_text('正面/侧面'));self.good('R11');self.append(self.layer,'<h2>正面/侧面</h2>');self.bad('R11')
    def test_visible_numeric_slash(self):self.assertEqual('1.00 / 0.36',clean_text('1.00 / 0.36'));self.good('R12a');self.append(self.layer,'<p>1.00 / 0.36 cm</p>');self.bad('R12a')
    def test_r12a_color(self):self.mutate_text('R12a','#fd6702')
    def test_r12a_centimeters(self):self.mutate_text('R12a','165 cm')
    def test_r12a_emoji(self):self.mutate_text('R12a','🐰')
    def test_r12a_date(self):self.mutate_text('R12a','2026-10-30')
    def test_r12b_purple(self):self.good('R12b');self.write('dist/assets/site.css','body{color:#6551B9}');self.bad('R12b')
    def test_r13_duplicate_origin(self):self.good('R13');self.append(self.home,self.figure('bunny-original'));self.bad('R13')
    def test_r13_grouped_origin(self):self.good('R13');self.replace(self.home,'<button >','<button data-lightbox-group="origin">');self.bad('R13')
    def test_r13_layer_without_origin(self):self.good('R13',pages=[self.layer]);self.append(self.layer,self.figure('bunny-original'));self.bad('R13',pages=[self.layer])
    def test_r14_missing_status(self):self.good('R14');self.replace(self.home,'本地审阅版，不是生产发布','审阅版');self.bad('R14')
    def test_fix1_r3_history_in_moved_text(self):
        self.good('R3')
        self.append(self.archive,'<section><p>搬来的文字</p>'+self.figure('old')+'</section>')
        self.bad('R3')

    def test_fix1_r3_history_in_changelog(self):
        self.good('R3')
        self.replace(self.archive,'<div data-changelog></div>','<div data-changelog>'+self.figure('old')+'</div>')
        self.bad('R3')

    def test_fix1_r3_history_outside_grid_item(self):
        self.good('R3')
        self.append(self.archive,'<ul data-archive-grid="extra">'+self.figure('old')+'</ul>')
        self.bad('R3')

    def test_fix1_r3_bare_history_outside_grid(self):
        self.good('R3')
        self.append(self.archive,'<img src="/characters/bunny/3.1.0/old.webp">')
        self.bad('R3')

    def test_fix1_r3_history_measurements_exception(self):
        image='<img src="/characters/bunny/3.1.0/old.webp">'
        self.append(self.archive,'<section data-archive-measurements>'+image+'</section>')
        self.good('R3')
        self.replace(self.archive,'<section data-archive-measurements>','<section>')
        self.bad('R3')

    def test_fix1_r3_history_figure_id_without_asset_address(self):
        self.good('R3')
        self.append(self.archive,'<figure data-asset-id="old"><img src="data:image/png;base64,AA=="></figure>')
        self.bad('R3')

    def test_fix1_r3_history_picture_counts_one_rendering(self):
        old=self.figure('old')
        picture=old.replace('<img ', '<picture><source srcset="/site/thumbs/bunny/3.1.0/old.webp 1x, /characters/bunny/3.1.0/old.webp 2x"><img ').replace('</button>','</picture></button>')
        picture=picture.replace('alt="图像"','srcset="/characters/bunny/3.1.0/old.webp 1x, /media/bunny/3.1.0/old.png 2x" alt="图像"')
        self.replace(self.archive,old,picture)
        self.good('R3')
        self.replace(self.archive,'</picture>','<img src="/characters/bunny/3.1.0/old.webp"></picture>')
        self.bad('R3')

    def test_fix1_r3_history_grid_figure_marker(self):
        marked=self.figure('old').replace('/characters/bunny/3.1.0/old.webp','data:image/png;base64,AA==')
        self.replace(self.archive,self.figure('old'),marked)
        self.good('R3')
        self.replace(self.archive,marked,'<figure data-asset-id="old"></figure>')
        self.bad('R3')

    def test_fix1_r3_history_grid_bare_image_marker(self):
        image='<img data-asset-id="old" src="data:image/png;base64,AA==">'
        self.replace(self.archive,self.figure('old'),image)
        self.good('R3')
        self.replace(self.archive,'data-archive-item="old"','data-not-item="old"')
        self.bad('R3')

    def test_fix1_r3_history_source_fallback_counts_one_rendering(self):
        old=self.figure('old')
        fallback=old.replace('<img ','<source srcset="/site/thumbs/bunny/3.1.0/old.webp 1x"><img ')
        self.replace(self.archive,old,fallback)
        self.good('R3')
        self.replace(self.archive,'</button>','<img src="/characters/bunny/3.1.0/old.webp"></button>')
        self.bad('R3')

    def test_fix1_r7b_bare_current_asset(self):
        self.good('R7b')
        self.append(self.layer,'<img src="/characters/bunny/3.1.0/scene.webp">')
        self.bad('R7b')

    def test_fix1_r7b_plain_figure(self):
        self.good('R7b')
        self.replace(self.layer,'class="release-image"','class="plain-image"')
        self.bad('R7b')

    def test_fix1_r7b_stub_image_ownership(self):
        self.append(self.stub,self.figure('scene'))
        self.good('R7b',pages=[self.stub])
        self.replace(self.stub,self.figure('scene'),'<img src="/characters/bunny/3.1.0/scene.webp">')
        self.bad('R7b',pages=[self.stub])

    def test_fix1_r7b_all_image_reference_addresses(self):
        for attribute in ('src','srcset'):
            for address in ('/characters/bunny/3.1.0/scene.webp','/media/bunny/3.1.0/scene.png','/site/thumbs/bunny/3.1.0/scene.webp'):
                with self.subTest(attribute=attribute,address=address):
                    image=f'<img {attribute}="{address}">'
                    self.page(self.layer,'<figure class="release-image" data-asset-id="scene">'+image+'</figure>')
                    self.good('R7b')
                    self.page(self.layer,image)
                    self.bad('R7b')
        image='<picture><source srcset="/site/thumbs/bunny/3.1.0/scene.webp 1x, /media/bunny/3.1.0/scene.png 2x"><img src="data:image/png;base64,AA=="></picture>'
        self.page(self.layer,'<figure class="release-image" data-asset-id="scene">'+image+'</figure>')
        self.good('R7b')
        self.page(self.layer,image)
        self.bad('R7b')

    def test_fix1_r7b_measurements_exception(self):
        image='<figure><img src="/characters/bunny/3.1.0/scene.webp"><figcaption>现行：尺寸比较</figcaption></figure>'
        self.append(self.archive,'<section data-archive-measurements>'+image+'</section>')
        self.good('R7b')
        self.append(self.layer,'<section data-archive-measurements>'+image+'</section>')
        self.bad('R7b')

    def test_fix1_r7b_asset_links_are_not_images(self):
        self.append(self.layer,'<a href="/characters/bunny/3.1.0/scene.webp">下载</a>')
        self.good('R7b')
        self.append(self.layer,'<img src="/characters/bunny/3.1.0/scene.webp">')
        self.bad('R7b')

    def test_fix1_r8_swapped_sources(self):
        self.good('R8')
        thumbs=self.read_json('docs/public/site/thumbs/index.json')
        one,two=thumbs['bunny/3.1.0/scene'],thumbs['bunny/3.1.0/line']
        for field in ('sourcePath','sourceSha256'):
            one[field],two[field]=two[field],one[field]
        self.json('docs/public/site/thumbs/index.json',thumbs)
        self.bad('R8')

    def test_fix1_r8_thumbnail_path_identity(self):
        self.good('R8')
        thumbs=self.read_json('docs/public/site/thumbs/index.json')
        thumbs['bunny/3.1.0/scene']['path']='/site/thumbs/bunny/3.1.0/line.webp'
        self.json('docs/public/site/thumbs/index.json',thumbs)
        self.bad('R8')

    def test_fix1_r8_thumbnail_key_identity(self):
        self.good('R8')
        thumbs=self.read_json('docs/public/site/thumbs/index.json')
        thumbs['bunny/3.1.0/wrong']=thumbs.pop('bunny/3.1.0/scene')
        thumbs['bunny/3.1.0/wrong']['path']='/site/thumbs/bunny/3.1.0/wrong.webp'
        self.json('docs/public/site/thumbs/index.json',thumbs)
        self.bad('R8')

    def test_r15_external_script(self):self.good('R15');self.append(self.layer,'<script src="https://example.com/a.js"></script>');self.bad('R15')
    def test_r15_external_css_url(self):self.good('R15');self.write('dist/assets/site.css','body{background:url(https://example.com/a.png)}');self.bad('R15')
    def test_r15_external_js_import(self):self.good('R15');self.write('dist/assets/site.js','import x from "https://example.com/a.js";');self.bad('R15')
    def test_r16_current_search_result(self):self.search_index(self.search_docs());self.good('R16');self.search_index(self.search_docs()+[{'id':self.layer+'#x','title':'双手棍','titles':['身体'],'text':'双手棍'}]);self.bad('R16')
    def test_r16_stub_in_index(self):self.search_index(self.search_docs());self.good('R16');self.search_index(self.search_docs()+[{'id':self.stub+'#x','title':'入口','titles':['入口'],'text':'角色'}]);self.bad('R16')
    def test_r16_fuzzy_hands_allowed(self):
        self.search_index(self.search_docs()+[{'id':self.layer+'#x','title':'双手','titles':['身体'],'text':'双手'}])
        result=subprocess.run(['node',str(self.cfg.node_helper),'search',str(self.dist/'assets/chunks/@localSearchIndexroot.test.js'),'双手棍'],check=True,capture_output=True,text=True)
        self.assertTrue(any(r['id']==self.layer+'#x' and '双手' in r['match'] for r in json.loads(result.stdout)['results']))
        self.good('R16');self.search_index([{'id':self.layer+'#x','title':'双手棍','titles':['身体'],'text':'双手棍'}]);self.bad('R16')
    def fix1_js_load(self, source):
        self.write('dist/assets/site.js',source.replace('https://cdn.example.com','/local'))
        self.good('R15')
        self.write('dist/assets/site.js',source)
        self.bad('R15')

    def fix1_css_load(self, source):
        self.write('dist/assets/site.css',source.replace('https://cdn.example.com','/local'))
        self.good('R15')
        self.write('dist/assets/site.css',source)
        self.bad('R15')

    def test_fix1_r15_minified_static_import(self):
        self.fix1_js_load('import{x as o}from"https://cdn.example.com/a.js";o();')

    def test_fix1_r15_side_effect_import(self):
        self.fix1_js_load('import"https://cdn.example.com/a.js";')

    def test_fix1_r15_minified_static_export(self):
        for clause in ('*','{x as y}'):
            with self.subTest(clause=clause):
                self.fix1_js_load('export'+clause+'from"https://cdn.example.com/a.js";')

    def fix1_svg_load(self, tag, attribute):
        local=f'<svg><{tag} {attribute}="/local/a.svg#icon" /></svg>'
        remote=local.replace('/local/a.svg','https://cdn.example.com/a.svg')
        self.page(self.layer,local);self.good('R15')
        self.page(self.layer,remote);self.bad('R15')

    def test_fix1_r15_svg_image_href(self):self.fix1_svg_load('image','href')
    def test_fix1_r15_svg_image_xlink_href(self):self.fix1_svg_load('image','xlink:href')
    def test_fix1_r15_svg_use_href(self):self.fix1_svg_load('use','href')
    def test_fix1_r15_svg_use_xlink_href(self):self.fix1_svg_load('use','xlink:href')
    def test_fix1_r15_svg_feimage_href(self):self.fix1_svg_load('feImage','href')
    def test_fix1_r15_svg_feimage_xlink_href(self):self.fix1_svg_load('feImage','xlink:href')

    def test_fix1_r15_css_image_set_quoted(self):
        self.fix1_css_load('body{background:image-set(url("/local/a.png") 1x,"https://cdn.example.com/a.png" 2x)}')

    def test_fix1_r15_css_image_set_unquoted(self):
        self.fix1_css_load('body{background:image-set(https://cdn.example.com/a.png 1x)}')

    def test_fix1_r15_css_image_quoted(self):
        self.fix1_css_load('body{background:image("https://cdn.example.com/a.png",blue)}')

    def test_fix1_r15_css_image_unquoted(self):
        self.fix1_css_load('body{background:image(ltr https://cdn.example.com/a.png,blue)}')

    def test_fix1_r15_js_src_property(self):
        for key in ('src','"src"',"'src'"):
            for quote in ('"',"'",'`'):
                with self.subTest(key=key,quote=quote):
                    self.fix1_js_load('const props={'+key+':'+quote+'https://cdn.example.com/a.png'+quote+'};')

    def test_fix1_r15_js_srcset_property(self):
        for quote in ('"',"'",'`'):
            with self.subTest(quote=quote):
                self.fix1_js_load('const props={srcset:'+quote+'https://cdn.example.com/a.png 1x'+quote+'};')

    def test_fix1_r15_js_poster_property(self):
        for quote in ('"',"'",'`'):
            with self.subTest(quote=quote):
                self.fix1_js_load('const props={poster:'+quote+'https://cdn.example.com/a.png'+quote+'};')

    def test_fix1_r15_js_src_assignment(self):
        for target in ('image.src','image["src"]','src'):
            for quote in ('"',"'",'`'):
                with self.subTest(target=target,quote=quote):
                    self.fix1_js_load(target+'='+quote+'https://cdn.example.com/a.png'+quote+';')

    def test_fix1_r15_js_srcset_assignment(self):
        for quote in ('"',"'",'`'):
            with self.subTest(quote=quote):
                self.fix1_js_load('image.srcset='+quote+'https://cdn.example.com/a.png 1x'+quote+';')

    def test_fix1_r15_js_poster_assignment(self):
        for quote in ('"',"'",'`'):
            with self.subTest(quote=quote):
                self.fix1_js_load('video.poster='+quote+'https://cdn.example.com/a.png'+quote+';')

    def test_fix1_r15_js_dynamic_import(self):
        for quote in ('"',"'",'`'):
            with self.subTest(quote=quote):
                self.fix1_js_load('import('+quote+'https://cdn.example.com/a.js'+quote+');')

    def test_fix1_r15_js_fetch(self):
        for quote in ('"',"'",'`'):
            with self.subTest(quote=quote):
                self.fix1_js_load('fetch('+quote+'https://cdn.example.com/a.json'+quote+');')

    def test_fix1_r15_js_worker(self):
        for quote in ('"',"'",'`'):
            with self.subTest(quote=quote):
                self.fix1_js_load('new Worker('+quote+'https://cdn.example.com/a.js'+quote+');')

    def test_fix1_r15_js_importscripts(self):
        for quote in ('"',"'",'`'):
            for prefix in ('','"/local/first.js",'):
                with self.subTest(quote=quote,prefix=prefix):
                    self.fix1_js_load('importScripts('+prefix+quote+'https://cdn.example.com/a.js'+quote+');')

    def test_fix1_r15_stub_html(self):
        self.append(self.stub,'<script src="/local/a.js"></script>');self.good('R15')
        self.replace(self.stub,'/local/a.js','https://cdn.example.com/a.js');self.bad('R15')

    def test_fix1_r15_anchor_navigation(self):
        self.append(self.layer,'<a href="https://github.com/x">GitHub</a>');self.good('R15')
        self.append(self.layer,'<img src="https://cdn.example.com/a.png">');self.bad('R15')

    def test_fix1_r15_js_href_navigation(self):
        self.write('dist/assets/site.js','const links=[{href:"https://github.com/x"},{"href":`https://github.com/y`}];')
        self.good('R15')
        self.write('dist/assets/site.js','const props={src:"https://cdn.example.com/a.png"};');self.bad('R15')

    def test_fix1_r16_archive_h1_section_title(self):
        document={'id':self.archive+'#历史档案','title':'历史档案','titles':[],'text':'双手棍'}
        self.search_index([document]);self.good('R16')
        document['title']='身体';self.search_index([document]);self.bad('R16')

    def test_d3_missing_current_asset(self):self.good('D3');self.replace(self.downloads,'data-download-asset="carry"','data-no-asset="carry"');self.bad('D3')
    def test_d3_home_twenty_five(self):self.cfg.home_download_count=26;self.page(self.home,'<h1>Bunny</h1>'+self.groups(self.cfg.home_groups,['scene']*26,home=True));self.good('D3');self.page(self.home,'<h1>Bunny</h1>'+self.groups(self.cfg.home_groups,['scene']*25,home=True));self.bad('D3')
    def test_d3_pages_scope(self):self.good('D3',pages=[self.layer]);self.replace(self.downloads,'data-download-asset="carry"','data-no-asset="carry"');self.good('D3',pages=[self.layer]);self.bad('D3')
    def test_d4_wrong_h1(self):self.good('D4');self.replace(self.layer,'<h1>身体</h1>','<h1>身体基准</h1>');self.bad('D4')
    def test_d4_stage_body(self):self.mutate_text('D4','v2 · 身体')
    def test_d4_stage_dimensions(self):self.mutate_text('D4','v2 外观尺寸')
    def test_a5_frozen_hash(self):self.good('A5');self.write('frozen.bin',b'changed');self.bad('A5')
    def test_d1_bad_status(self):self.good('D1');self.assets[0]['source']['review_status']='accepted-scene';self.save_manifests();self.bad('D1')
    def test_d1_missing_name(self):self.good('D1');d=self.read_json('docs/.vitepress/data/bunny/asset-names.json');del d['scene'];self.json('docs/.vitepress/data/bunny/asset-names.json',d);self.bad('D1')
    def test_d1_new_original_md5(self):self.good('D1');self.write('.release/bunny/3.1.0/scene.png',b'wrong');self.bad('D1')
    def test_d2_unknown_original(self):self.good('D2');self.json('docs/.vitepress/data/bunny/display-text.json',{'catalog/bunny/3.1.0/data.json':{'不存在':'改写'}});self.bad('D2')
    def test_missing_data_is_failure(self):self.good('R8');(self.root/'docs/public/site/thumbs/index.json').unlink();self.bad('R8')
    def test_regression_r1_public_only_is_not_built(self):
        self.write('dist/characters/bunny/3.1.0/scene.webp',b'scene-web')
        self.append(self.layer,'<a href="/characters/bunny/3.1.0/scene.webp">图像</a>')
        self.good('R1');(self.dist/'characters/bunny/3.1.0/scene.webp').unlink();self.bad('R1')
    def test_regression_r2_external_mapping(self):
        self.good('R2');self.replace(self.layer,'id="body"','id="other"')
        data=self.read_json('docs/.vitepress/data/bunny/anchor-map.json');data['anchors'][self.layer+'#body']='https://example.com/not-a-built-page#gone'
        self.json('docs/.vitepress/data/bunny/anchor-map.json',data);self.bad('R2')
    def test_regression_r3_relative_historical_image(self):
        self.good('R3');self.append(self.layer,'<img src="3.1.0/old.webp">');self.bad('R3')
    def test_regression_r7b_relative_image(self):
        self.good('R7b');self.replace(self.layer,' data-asset-id="scene"','');self.replace(self.layer,'/characters/bunny/3.1.0/scene.webp','3.1.0/scene.webp');self.bad('R7b')
    def test_regression_r3_empty_history_item(self):
        self.good('R3');self.replace(self.archive,self.figure('old'),'');self.bad('R3')
    def test_regression_r13_bare_original(self):
        self.good('R13');self.append(self.home,'<img src="/characters/origins/1.0.0/bunny-original.webp">');self.bad('R13')
    def test_regression_r9_actual_image(self):
        self.good('R9');self.replace(self.home,'/characters/bunny/3.1.0/scene.webp','/characters/bunny/3.1.0/old.webp');self.bad('R9')
    def test_regression_r3_duplicate_image_inside_one_item(self):
        self.good('R3');self.replace(self.archive,self.figure('old'),self.figure('old')*2);self.bad('R3')
    def test_regression_r3_current_outside_allowed_sections(self):
        self.good('R3');self.replace(self.archive,'<div data-archive-measurements>'+self.figure('scene','现行：场景图')+'</div>',self.figure('scene','现行：场景图'));self.bad('R3')
    def test_regression_r15_clickable_links_are_not_loads(self):
        self.write('dist/assets/site.js',"const u=new URL('https://example.com');const a=document.createElement('a');a.href='https://example.com';a.setAttribute('href','https://example.org');a.textContent='链接';")
        self.good('R15');self.write('dist/assets/site.js',"const s=document.createElement('script');s.src='https://example.com/a.js';document.body.append(s);");self.bad('R15')
    def test_r15_dynamic_stylesheet_link(self):
        self.good('R15');self.write('dist/assets/site.js',"const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='https://example.com/style.css';document.head.append(sheet);");self.bad('R15')
    def test_regression_a5_unexpected_new_webp(self):
        frozen={f'docs/public/characters/bunny/3.1.0/{a["id"]}.webp':a['web']['sha256'] for a in self.assets}
        self.json('frozen.json',frozen);self.good('A5')
        self.write('docs/public/characters/bunny/3.1.0/unapproved.webp',b'new');self.bad('A5')
    def test_d4_vitepress_heading_permalink(self):
        self.replace(self.layer,'<h1>身体</h1>','<h1>身体 <a class="header-anchor" href="#body" aria-label="Permalink">\u200b</a></h1>')
        self.good('D4');self.replace(self.layer,'<h1>身体 ','<h1>错误 ');self.bad('D4')
    def test_d3_vitepress_group_permalink(self):
        self.replace(self.downloads,'场景与线稿</h2>','场景与线稿 <a class="header-anchor" href="#dl-main" aria-label="Permalink">\u200b</a></h2>')
        self.good('D3');self.replace(self.downloads,'场景与线稿 <a','错误 <a');self.bad('D3')
    def test_htmlscan_only_doc_ids(self):
        p=parse_html('<head><title>旧</title></head><body><span id="outside"></span><div class="vp-doc"><h1 id="inside">身体</h1></div><script>左</script><img alt="角色右"></body>');self.assertEqual(['inside'],p.ids);self.assertNotIn('旧',p.visible_text());self.assertNotIn('左',p.visible_text());self.assertIn('角色右',p.visible_text())
    def test_fix1_text_r1_theme_skip_link_uses_document_ids(self):
        self.append(self.layer,'<a href="#VPContent">跳至正文</a><main id="VPContent"></main>')
        self.good('R1')
        self.replace(self.layer,'id="VPContent"','id="missing"');self.bad('R1')

    def test_fix1_text_r1_stub_same_page_fragment_is_not_stub_link(self):
        self.append(self.stub,'<a href="#VPContent">跳至正文</a><main id="VPContent"></main>')
        self.good('R1')
        self.replace(self.stub,'id="VPContent"','id="missing"')
        errors=self.check('R1')
        self.assertTrue(any('target anchor does not exist' in x.message for x in errors))
        self.assertFalse(any('target is redirect stub' in x.message for x in errors))

    def test_fix1_text_r1_document_ids_do_not_expand_r2_baseline_targets(self):
        self.replace(self.layer,'id="body"','id="other"')
        self.append(self.home,'<span id="outside"></span>')
        self.append(self.layer,f'<a href="{self.home}#outside">目标</a>')
        mapping=self.read_json('docs/.vitepress/data/bunny/anchor-map.json')
        mapping['anchors'][self.layer+'#body']=self.home+'#outside'
        self.json('docs/.vitepress/data/bunny/anchor-map.json',mapping)
        self.bad('R1');self.bad('R2')
        self.replace(self.home,'<span id="outside"></span>','')
        self.replace(self.home,'<h1>Bunny</h1>','<h1>Bunny</h1><span id="outside"></span>')
        self.good('R1');self.good('R2')

    def test_fix1_text_d4_ascii_stage_before_chinese(self):
        self.append(self.layer,'<p>v2.0中性头部</p>');self.good('D4')
        self.replace(self.layer,'v2.0中性头部','v2中性头部');self.bad('D4')

    def test_fix1_text_r12a_orange_hex_before_chinese(self):
        self.append(self.layer,'<p>夹克取橙色</p>');self.good('R12a')
        self.replace(self.layer,'夹克取橙色','夹克取#fd6702的橙色');self.bad('R12a')

    def test_fix1_text_r12a_red_hex_before_chinese(self):
        self.append(self.layer,'<p>红色</p>');self.good('R12a')
        self.replace(self.layer,'<p>红色</p>','<p>色值#ca2f2f红</p>');self.bad('R12a')

    def test_fix1_text_ascii_stage_digits(self):
        self.append(self.layer,'<p>v２ 中性头部</p>');self.good('D4')
        self.replace(self.layer,'v２ 中性头部','v2 中性头部');self.bad('D4')

    def test_fix1_text_ascii_and_fullwidth_measurement_digits(self):
        for number in ('165','１６５'):
            with self.subTest(number=number):
                self.page(self.layer,'<p>身高未设定</p>');self.good('R12a')
                self.page(self.layer,'<p>'+number+'cm</p>');self.bad('R12a')

    def test_fix1_text_ascii_date_digits(self):
        self.append(self.layer,'<p>２０２６-１０-３０</p>');self.good('R12a')
        self.replace(self.layer,'２０２６-１０-３０','2026-10-30');self.bad('R12a')

    def test_fix1_text_ascii_version_digits(self):
        self.append(self.layer,'<p>１.２.３</p>');self.good('R5')
        self.replace(self.layer,'１.２.３','1.2.3');self.bad('R5')

    def test_fix1_text_r5_adjacent_table_cells(self):
        self.append(self.layer,'<table><tr><td>1.23</td><td>0.98</td></tr></table>')
        self.good('R5')
        self.replace(self.layer,'<td>1.23</td><td>0.98</td>','<td>1.230.98</td>');self.bad('R5')

    def test_fix1_text_r5_adjacent_spans(self):
        self.append(self.layer,'<span>1.00</span><span>0.36</span><span>0.42</span>')
        self.good('R5')
        self.replace(self.layer,'<span>1.00</span><span>0.36</span><span>0.42</span>','<span>1.000.36</span>');self.bad('R5')

    def test_fix1_text_r5_archive_header_element_boundaries(self):
        self.replace(self.archive,'<h2>变更记录</h2>','<table><tr><td>1.23</td><td>0.98</td></tr></table><h2>变更记录</h2>')
        self.good('R5')
        self.replace(self.archive,'<td>1.23</td><td>0.98</td>','<td>1.230.98</td>');self.bad('R5')

    def test_fix1_text_r5_archive_record_element_boundaries(self):
        self.replace(self.archive,'<div data-changelog></div>','<div data-changelog><span>1.00</span><span>0.36</span><span>0.42</span></div>')
        self.good('R5')
        self.replace(self.archive,'<span>1.00</span><span>0.36</span>','<span>1.000.36</span>');self.bad('R5')

    def test_fix1_text_r12a_number_and_inline_unit(self):
        self.append(self.layer,'<p>厘米身高<span>未设定</span></p>');self.good('R12a')
        self.replace(self.layer,'厘米身高<span>未设定</span>','165<span>cm</span>');self.bad('R12a')

    def test_fix1_text_r4_inline_word_remains_joined(self):
        self.append(self.layer,'<p>保持<span>线条</span></p>');self.good('R4')
        self.replace(self.layer,'保持<span>线条</span>','保<span>留</span>');self.bad('R4')

    def test_fix1_text_cli_unknown_pages_and_pending(self):
        for flag in ('--pages','--pending'):
            with self.subTest(flag=flag):
                output=io.StringIO()
                with contextlib.redirect_stdout(output):code=main(['--rules','R1',flag,self.layer],config=self.cfg)
                self.assertEqual(0,code)
                output=io.StringIO()
                with contextlib.redirect_stdout(output):code=main(['--rules','R1',flag,'/unknown-page'],config=self.cfg)
                self.assertEqual(2,code)
                self.assertEqual('usage: unknown page /unknown-page\n',output.getvalue())

    def test_fix1_text_cli_slashless_directory_pages(self):
        for path in (self.home,self.home.rstrip('/')):
            with self.subTest(path=path):
                output=io.StringIO()
                with contextlib.redirect_stdout(output):code=main(['--rules','R14','--pages',path],config=self.cfg)
                self.assertEqual(0,code)
        self.replace(self.home,'本地审阅版，不是生产发布','缺失')
        for path in (self.home,self.home.rstrip('/')):
            with self.subTest(path=path):
                output=io.StringIO()
                with contextlib.redirect_stdout(output):code=main(['--rules','R14','--pages',path],config=self.cfg)
                self.assertEqual(1,code)
                self.assertIn('R14 '+self.home+':',output.getvalue())

    def test_fix1_text_cli_slashless_directory_pending(self):
        self.append(self.layer,f'<a href="{self.home}#future">未来锚点</a>')
        for path in (self.home,self.home.rstrip('/')):
            with self.subTest(path=path):
                output=io.StringIO()
                with contextlib.redirect_stdout(output):code=main(['--rules','R1','--pending',path],config=self.cfg)
                self.assertEqual(0,code)
        self.bad('R1')

    def test_fix1_text_r9_nested_list_is_not_latest_entry(self):
        self.replace(self.home,'<li data-asset-id="scene">','<li data-asset-id="scene"><ul hidden><li>第 1 张</li></ul>')
        self.good('R9')
        self.replace(self.home,'<ol data-latest>','<ol data-latest><li data-asset-id="old">额外条目</li>');self.bad('R9')

    def test_fix1_text_r9_latest_requires_ordered_list(self):
        self.good('R9');self.replace(self.home,'<ol data-latest>','<div data-latest>')
        self.replace(self.home,'</ol>','</div>');self.bad('R9')

    def test_fix1_text_r10_overlapping_direction_exceptions(self):
        for phrase in ('角色左右肩宽相同','角色左右识别','点开后可在画面左右翻看'):
            with self.subTest(phrase=phrase):
                self.append(self.layer,'<p>'+phrase+'</p>');self.good('R10')
        self.append(self.layer,'<p>左右手</p>');self.bad('R10')

    def test_fix1_text_r10_removal_cannot_create_exception(self):
        self.append(self.layer,'<p>画面左右键</p>');self.good('R10')
        self.replace(self.layer,'<p>画面左右键</p>','<p>左画面左右键</p>');self.bad('R10')

    def test_fix1_text_r10_inline_direction_fragments_remain_joined(self):
        self.append(self.layer,'<p>角色<span>左</span>腿</p>');self.good('R10')
        self.replace(self.layer,'角色<span>左</span>腿','<span>左</span>腿');self.bad('R10')

    def test_fix1_text_r11_wrapper_figure_does_not_inherit_front(self):
        group='<figure>'+self.figure('body-front','正面')+self.figure('body-side','角色右侧面')+self.figure('body-back','背面')+'<figcaption>后腰交叉携行三视</figcaption></figure>'
        self.append(self.layer,group);self.good('R11')
        self.replace(self.layer,self.figure('body-front','正面'),self.figure('body-front','后腰'));self.bad('R11')

    def test_fix1_text_r11_front_ignores_nested_figure_caption_and_alt(self):
        self.append(self.layer,'<figure data-asset-id="body-front"><img alt="正面"><figcaption>正面</figcaption>'+self.figure('body-back','后腰交叉携行')+'</figure>')
        self.good('R11')
        self.replace(self.layer,'<img alt="正面"><figcaption>正面</figcaption>','<img alt="后腰"><figcaption>正面</figcaption>');self.bad('R11')

    def test_fix1_text_r11_wrapper_caption_still_checks_side(self):
        self.append(self.layer,'<figure>'+self.figure('body-front','正面')+'<figcaption>角色右侧面</figcaption></figure>')
        self.good('R11')
        self.replace(self.layer,'<figcaption>角色右侧面</figcaption>','<figcaption>侧面</figcaption>');self.bad('R11')

    def test_fix1_text_r11_caption_excludes_embedded_figure(self):
        self.append(self.layer,'<figure data-asset-id="body-front"><img alt="正面"><figcaption>正面示意'+self.figure('body-back','后腰交叉携行')+'</figcaption></figure>')
        self.good('R11')
        self.replace(self.layer,'<figcaption>正面示意','<figcaption>后腰示意');self.bad('R11')

    def test_cli_rule_alias_and_status(self):
        output=io.StringIO()
        with contextlib.redirect_stdout(output):code=main(['--rules','R12','--pages',self.layer],config=self.cfg)
        self.assertEqual(0,code);self.assertIn('OK (2 rules)',output.getvalue())
        self.append(self.layer,'<p>#fd6702</p>');output=io.StringIO()
        with contextlib.redirect_stdout(output):code=main(['--rules','R12a'],config=self.cfg)
        self.assertEqual(1,code);self.assertIn('R12a '+self.layer+':',output.getvalue())

    def test_fix2_text_split_tokens_keep_phrasing_text_joined(self):
        cases=(
            ('R5','3.<b>1</b>.0','3.<b>0</b>.0'),
            ('R12a','2026-<b>10</b>-29','2026-<b>10</b>-30'),
            ('R12a','#f<b>d</b>','#fd<b>6702</b>'),
            ('R12a','<span class="swatch-hash">#</span>orange','<span class="swatch-hash">#</span>fd6702'),
            ('D4','v<b>2.0</b> 身体','v<b>2</b> 身体'),
        )
        for rule,control,bad in cases:
            with self.subTest(rule=rule,bad=bad):
                self.page(self.layer,'<h1>身体</h1><p>'+control+'</p>');self.good(rule)
                self.page(self.layer,'<h1>身体</h1><p>'+bad+'</p>');self.bad(rule)

    def test_fix2_text_phrasing_elements_and_wbr_preserve_versions(self):
        phrasing='a abbr b bdi bdo cite code data dfn em i kbd mark q s samp small span strong sub sup time u var'.split()
        for tag in phrasing:
            with self.subTest(tag=tag):
                self.page(self.layer,f'<p>3.<{tag}>1</{tag}>.0</p>');self.good('R5')
                self.page(self.layer,f'<p>3.<{tag}>0</{tag}>.0</p>');self.bad('R5')
        self.page(self.layer,'<p><span>3.</span><wbr><span>1.0</span></p>');self.good('R5')
        self.page(self.layer,'<p><span>3.</span><wbr><span>0.0</span></p>');self.bad('R5')

    def test_fix2_text_nonphrasing_boundaries_do_not_form_versions(self):
        for middle in ('<div>0</div>','<br>0','<hr>0','<img alt="0">'):
            with self.subTest(middle=middle):
                self.page(self.layer,'<p>3.'+middle+'.0</p>');self.good('R5')
                self.page(self.layer,'<p>3.<b>0</b>.0</p>');self.bad('R5')

    def test_fix2_text_split_addresses_are_cleaned_before_boundaries(self):
        cases=(
            '<code>bunny-3.1.0-<wbr>design-reference.zip</code>',
            '<span>bunny-3.1.0-design-reference</span><span>.zip</span>',
            '<a href="/media/bunny/3.1.0/sun05-scene-final-v1.png">/media/bunny/<wbr>3.1.0/sun05-scene-final-v1.png</a>',
            '<code>goggles-v2-<wbr>belt-only.webp</code>',
        )
        for snippet in cases:
            with self.subTest(snippet=snippet):
                self.page(self.home,'<h1>Bunny</h1><p>版本：3.1.0</p><p>资料文件：'+snippet+'</p>')
                self.good('R5');self.good('D4')
                self.append(self.home,'<p>另一个版本：3.1.0 v<b>2</b> 身体</p>')
                self.bad('R5');self.bad('D4')

    def test_fix2_text_archive_header_cleans_names_and_joins_tokens(self):
        prefix='<h1>历史档案</h1><p>版本：3.<b>1</b>.0</p><p>资料包：<code>bunny-3.1.0-<wbr>design-reference.zip</code></p>'
        self.page(self.archive,prefix+'<h2>变更记录</h2>');self.good('R5')
        self.replace(self.archive,'3.<b>1</b>.0','3.<b>0</b>.0');self.bad('R5')

    def test_fix2_text_archive_records_use_joined_cleaned_text(self):
        for wrapper in ('<div data-changelog>{}</div>','<li data-archive-item="old"><figcaption>{}</figcaption></li>'):
            with self.subTest(wrapper=wrapper):
                header='<h1>历史档案</h1><p>3.1.0</p><h2>变更记录</h2>'
                self.page(self.archive,header+wrapper.format('<code>bunny-3.1.0-<wbr>design-reference.zip</code>'));self.good('R5')
                self.page(self.archive,header+wrapper.format('3.<b>1</b>.0'));self.bad('R5')

    def test_fix2_r1_cross_page_ids_must_be_inside_doc(self):
        cases=(('/characters/bunny/hands','local-search','div'),
               ('/characters/bunny/jacket','VPContent','main'),
               ('/characters/bunny/hands','hands-layer-card','aside class="layer-card"'))
        for target,anchor,tag in cases:
            with self.subTest(anchor=anchor):
                element=f'<{tag} id="{anchor}"></{tag.split()[0]}>'
                self.page(target,'<h1>目标</h1>');self.append(target,element)
                self.page(self.layer,f'<a href="{target}#{anchor}">目标</a>');self.bad('R1',pages=[self.layer])
                self.page(target,'<h1>目标</h1>'+element);self.good('R1',pages=[self.layer])

    def test_fix2_r1_same_page_path_still_uses_doc_ids(self):
        for href in (self.layer+'#VPContent','body-base#VPContent'):
            with self.subTest(href=href):
                self.page(self.layer,'<h1>身体</h1>')
                self.append(self.layer,'<main id="VPContent"></main><a href="#VPContent">跳至正文</a>')
                self.good('R1',pages=[self.layer])
                self.append(self.layer,f'<a href="{href}">正文</a>');self.bad('R1',pages=[self.layer])

    def test_fix2_r12a_unicode_spaces_keep_measurements(self):
        cases=('身高 １６５&nbsp;cm','身高 165&nbsp;cm',
               '身高 １６５\u202fcm','身高 165\u202fcm',
               '身高 １６５\u3000厘米','身高 165\u3000厘米',
               '厚度 ２&nbsp;mm','厚度 2&nbsp;mm')
        for bad in cases:
            with self.subTest(bad=bad):
                self.page(self.layer,'<p>尺寸未设定</p>');self.good('R12a')
                self.page(self.layer,'<p>'+bad+'</p>');self.bad('R12a')

    def test_fix2_r7b_measurement_release_figure_requires_matching_id(self):
        for attribute in ('',' data-asset-id="line"'):
            with self.subTest(attribute=attribute):
                image=self.figure('scene','现行：身体正面')
                self.page(self.archive,'<section data-archive-measurements>'+image+'</section>');self.good('R7b')
                self.replace(self.archive,' data-asset-id="scene"',attribute);self.bad('R7b')

    def test_fix2_r7b_plain_measurement_comparison_image_is_exempt(self):
        image='<div class="body-proportion-compare"><img src="/characters/bunny/3.1.0/scene.webp" alt="身体比例比较"></div>'
        self.page(self.archive,'<section data-archive-measurements>'+image+'</section>');self.good('R7b')
        self.replace(self.archive,'<section data-archive-measurements>','<section>');self.bad('R7b')

    def test_fix2_r3_inactive_image_copies_do_not_count(self):
        image='<img data-asset-id="old" src="/characters/bunny/3.1.0/old.webp">'
        cases=(('<dialog>{}</dialog>','<dialog open>{}</dialog>'),
               ('<noscript>{}</noscript>','<div>{}</div>'),
               ('<template>{}</template>','<div>{}</div>'),
               ('<div hidden>{}</div>','<div>{}</div>'),
               ('<div hidden="false">{}</div>','<div>{}</div>'))
        for inactive,visible in cases:
            with self.subTest(inactive=inactive):
                grid='<ul data-archive-grid="old"><li data-archive-item="old">'
                figure=self.figure('old').replace('</figure>',inactive.format(image)+'</figure>')
                self.page(self.archive,grid+figure+'</li></ul>');self.good('R3')
                figure=self.figure('old').replace('</figure>',visible.format(image)+'</figure>')
                self.page(self.archive,grid+figure+'</li></ul>');self.bad('R3')

    def test_fix2_r3_inactive_source_copies_do_not_count(self):
        source='<source srcset="/characters/bunny/3.1.0/old.webp 1x">'
        for inactive,visible in (('<dialog>{}</dialog>','<dialog open>{}</dialog>'),
                                 ('<noscript>{}</noscript>','<div>{}</div>'),
                                 ('<template>{}</template>','<div>{}</div>'),
                                 ('<div hidden>{}</div>','<div>{}</div>'),
                                 ('<div hidden="false">{}</div>','<div>{}</div>')):
            with self.subTest(inactive=inactive):
                grid='<ul data-archive-grid="old"><li data-archive-item="old">'+self.figure('old')+'</li></ul>'
                self.page(self.archive,grid+inactive.format(source));self.good('R3')
                self.page(self.archive,grid+visible.format(source));self.bad('R3')

    def test_fix2_r3_hidden_attribute_on_image_or_source(self):
        for tag,attr in (('img','src'),('source','srcset')):
            for hidden in ('hidden','hidden="false"'):
                with self.subTest(tag=tag,hidden=hidden):
                    grid='<ul data-archive-grid="old"><li data-archive-item="old">'+self.figure('old')+'</li></ul>'
                    image=f'<{tag} {hidden} {attr}="/characters/bunny/3.1.0/old.webp">'
                    self.page(self.archive,grid+image);self.good('R3')
                    self.page(self.archive,grid+image.replace(' '+hidden,''));self.bad('R3')

    def test_fix2_r3_visible_image_outside_grid_still_counts(self):
        image='<img src="/characters/bunny/3.1.0/old.webp">'
        self.append(self.archive,'<dialog>'+image+'</dialog>');self.good('R3')
        self.append(self.archive,image);self.bad('R3')

    def test_fix2_r15_image_functions_skip_data_arguments(self):
        svg="data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%3e%3c/svg%3e"
        for function in ('image-set','-webkit-image-set','image'):
            for argument in ('"'+svg+'"','url("'+svg+'")','data:image/png;base64,AA==','url(data:image/png;base64,AA==)'):
                with self.subTest(function=function,argument=argument):
                    self.write('dist/assets/site.css','.hero{background-image:'+function+'('+argument+' 1x)}');self.good('R15')
                    self.write('dist/assets/site.css','.hero{background-image:'+function+'("https://img.example.com/a.png" 1x)}');self.bad('R15')

    def test_fix2_r15_nested_url_still_checks_remote_loads(self):
        for function in ('image-set','image'):
            with self.subTest(function=function):
                self.write('dist/assets/site.css','.hero{background-image:'+function+'(url("data:image/svg+xml,http://www.w3.org/2000/svg") 1x)}');self.good('R15')
                self.write('dist/assets/site.css','.hero{background-image:'+function+'(url("https://img.example.com/a.png") 1x)}');self.bad('R15')

    def test_fix2_r15_image_arguments_only_start_remote_loads(self):
        for argument in ('"label https://img.example.com/a.png"','"local-https://img.example.com/a.png"','local-https://img.example.com/a.png'):
            with self.subTest(argument=argument):
                self.write('dist/assets/site.css','.hero{background-image:image('+argument+')}');self.good('R15')
                self.write('dist/assets/site.css','.hero{background-image:image(ltr https://img.example.com/a.png,blue)}');self.bad('R15')


    def test_fix2_r15_vite_built_imageset_css_is_local(self):
        # Exact Vite 6.4.3 output from the independent review fixture.
        css='.hero{background-image:image-set(url("data:image/svg+xml,%3csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20width=\'16\'%20height=\'16\'%20viewBox=\'0%200%2016%2016\'%3e%3cpath%20d=\'M2%208h12\'%20stroke=\'%23000\'/%3e%3c/svg%3e") 1x,url("data:image/svg+xml,%3csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20width=\'32\'%20height=\'32\'%20viewBox=\'0%200%2032%2032\'%3e%3cpath%20d=\'M4%2016h24\'%20stroke=\'%23000\'/%3e%3c/svg%3e") 2x)}.badge{background-image:image-set(url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAABE0lEQVR4AQEIAff+AP//////////////////////////////////////////AP//////////////////////////////////////////AP//////////////////////////////////////////AP//////////////////////////////////////////AP//////////////////////////////////////////AP//////////////////////////////////////////AP//////////////////////////////////////////AP//////////////////////////////////////////hLX/AdPL0CwAAAAASUVORK5CYII=) 1x)}\n'
        self.write('dist/assets/site.css',css);self.good('R15')
        self.write('dist/assets/site.css',css+'.remote{background-image:image-set("https://img.example.com/a.png" 1x)}');self.bad('R15')


    def fix3_text_case(self, rule, page, snippet, expected):
        # These literals are self-contained copies of the 32 acceptance cases.
        # Give R5 pages their permitted version so a leaked address version fails.
        if rule=='R5':self.replace(page,'</h1>','</h1><p>3.1.0</p>')
        self.good(rule,pages=[page])
        self.replace(page,'</h1>','</h1>'+snippet)
        errors=self.check(rule,pages=[page])
        self.assertEqual(expected=='fail',bool(errors),[str(error) for error in errors])

    def test_fix3_text_f01_split_version(self):
        self.fix3_text_case('R5',self.layer,'<p>3.<b>0</b>.0</p>','fail')

    def test_fix3_text_f02_version_before_filename_sibling(self):
        self.fix3_text_case('R5',self.layer,'<p><span>3.0.0</span><code>bunny.zip</code></p>','fail')

    def test_fix3_text_f03_path_element_before_version_paragraph(self):
        self.fix3_text_case('R5',self.layer,'<p><code>/media/bunny/3.1.0/scene.png</code></p><p>3.0.0 资料</p>','fail')

    def test_fix3_text_f04_version_and_filename_cells(self):
        self.fix3_text_case('R5',self.layer,'<table><tr><td>3.0.0</td><td>bunny.zip</td></tr></table>','fail')

    def test_fix3_text_f05_split_date(self):
        self.fix3_text_case('R12a',self.layer,'<p>2026-<b>10</b>-30</p>','fail')

    def test_fix3_text_f06_split_color(self):
        self.fix3_text_case('R12a',self.layer,'<p>#fd<b>6702</b></p>','fail')

    def test_fix3_text_f07_hash_span_before_color(self):
        self.fix3_text_case('R12a',self.layer,'<p>主色 <span class="swatch-hash">#</span>fd6702。</p>','fail')

    def test_fix3_text_f08_forbidden_date_before_filename(self):
        self.fix3_text_case('R12a',self.layer,'<p><time datetime="2026-10-24">2026-10-24</time><code>scene.png</code></p>','fail')

    def test_fix3_text_f09_path_cell_before_forbidden_date(self):
        self.fix3_text_case('R12a',self.layer,'<table><tr><td><code>/media/bunny/3.1.0/scene.png</code></td><td>2026-10-24</td></tr></table>','fail')

    def test_fix3_text_f10_url_paragraph_before_color(self):
        self.fix3_text_case('R12a',self.layer,'<p>https://example.com/palette</p><p>#fd6702</p>','fail')

    def test_fix3_text_f11_color_and_filename_cells(self):
        self.fix3_text_case('R12a',self.layer,'<table><tr><td>#fd6702</td><td>swatch.png</td></tr></table>','fail')

    def test_fix3_text_f12_nbsp_measurement(self):
        self.fix3_text_case('R12a',self.layer,'<p>身高 165&nbsp;cm</p>','fail')

    def test_fix3_text_f13_fullwidth_measurement(self):
        self.fix3_text_case('R12a',self.layer,'<p>身高１６５厘米</p>','fail')

    def test_fix3_text_f14_inline_unit(self):
        self.fix3_text_case('R12a',self.layer,'<p>165<span>cm</span></p>','fail')

    def test_fix3_text_f15_sibling_number_and_unit(self):
        self.fix3_text_case('R12a',self.layer,'<p><span>165</span><span>cm</span></p>','fail')

    def test_fix3_text_f16_color_before_chinese(self):
        self.fix3_text_case('R12a',self.layer,'<p>夹克取#fd6702的橙色</p>','fail')

    def test_fix3_text_f17_split_stage(self):
        self.fix3_text_case('D4',self.layer,'<p>v<b>2</b> 身体</p>','fail')

    def test_fix3_text_f18_stage_before_filename_sibling(self):
        self.fix3_text_case('D4',self.layer,'<p><b>v2</b><code>goggles.webp</code></p>','fail')

    def test_fix3_text_f19_path_list_item_before_stage(self):
        self.fix3_text_case('D4',self.layer,'<ul><li>/characters/bunny/headgear</li><li>v2 外观尺寸</li></ul>','fail')

    def test_fix3_text_f20_stage_and_filename_list_items(self):
        self.fix3_text_case('D4',self.layer,'<ul><li>v2</li><li>goggles.webp</li></ul>','fail')

    def test_fix3_text_f21_stage_before_chinese(self):
        self.fix3_text_case('D4',self.layer,'<p>v2中性头部样板</p>','fail')

    def test_fix3_text_p01_decimal_table_cells(self):
        self.fix3_text_case('R5',self.layer,'<table><tr><th>比例</th><td>1.23</td><td>0.98</td></tr></table>','pass')

    def test_fix3_text_p02_decimal_sibling_spans(self):
        self.fix3_text_case('R5',self.layer,'<div><span class="tick">1.00</span><span class="tick">0.36</span><span class="tick">0.42</span></div>','pass')

    def test_fix3_text_p03_filename_with_wbr(self):
        self.fix3_text_case('R5',self.home,'<p>资料包：<code>bunny-3.1.0-<wbr>design-reference.zip</code></p>','pass')

    def test_fix3_text_p04_filename_split_across_spans(self):
        self.fix3_text_case('R5',self.home,'<p><span class="file-stem">bunny-3.1.0-design-reference</span><span class="file-ext">.zip</span></p>','pass')

    def test_fix3_text_p05_path_with_wbr(self):
        self.fix3_text_case('R5',self.home,'<p><a href="/media/bunny/3.1.0/sun05-scene-final-v1.png">/media/bunny/<wbr>3.1.0/sun05-scene-final-v1.png</a></p>','pass')

    def test_fix3_text_p06_label_before_path_element(self):
        self.fix3_text_case('R5',self.home,'<p><span class="file-type">PNG</span><a href="/media/bunny/3.1.0/sun05-scene-final-v1.png">/media/bunny/<wbr>3.1.0/sun05-scene-final-v1.png</a></p>','pass')

    def test_fix3_text_p07_download_path_table_cells(self):
        self.fix3_text_case('R5',self.downloads,'<table><tbody><tr><td>SUN-05</td><td><code>/media/bunny/3.1.0/sun05-scene-final-v1.png</code></td></tr><tr><td>STRUCTURE20</td><td><code>/media/bunny/3.1.0/structure20-lineart-v1.png</code></td></tr></tbody></table>','pass')

    def test_fix3_text_p08_label_before_path_element_sibling(self):
        self.fix3_text_case('R5',self.downloads,'<p><span class="code-name">SUN-05</span><code>/media/bunny/3.1.0/sun05-scene-final-v1.png</code></p>','pass')

    def test_fix3_text_p09_path_after_element_boundary(self):
        self.fix3_text_case('R5',self.downloads,'<p><span>SUN-05</span>/media/bunny/3.1.0/sun05-scene-final-v1.png</p>','pass')

    def test_fix3_text_p10_stage_in_filename_with_wbr(self):
        self.fix3_text_case('D4',self.downloads,'<p><code>goggles-v2-<wbr>belt-only.webp</code></p>','pass')

    def test_fix3_text_p11_allowed_date_before_filename(self):
        self.fix3_text_case('R12a',self.layer,'<p><time datetime="2026-10-28">2026-10-28</time><code>scene.png</code></p>','pass')

    def test_fix3_r5_archive_header_version_before_zip(self):
        metadata=(
            '<dl><dt>版本</dt><dd>3.1.0</dd><dt>资料包</dt><dd><code>bunny-3.1.0-design-reference.zip</code></dd></dl>',
            '<table><tr><th>版本</th><td>3.1.0</td><td><code>bunny-3.1.0-design-reference.zip</code></td></tr></table>',
            '<table><tr><th>版本</th><td>3.1.0</td></tr><tr><th>资料包</th><td><code>bunny-3.1.0-design-reference.zip</code></td></tr></table>',
        )
        for content in metadata:
            with self.subTest(content=content):
                header='<h1>历史档案</h1>'+content+'<p>本页记录 Bunny 的设计稿</p>'
                self.page(self.archive,header+'<h2>变更记录</h2><div data-changelog></div>')
                self.assertEqual(['3.1.0'],re.findall(r'[0-9]+\.[0-9]+\.[0-9]+',parse_html(header).body.regex_text(alt=True)))
                self.good('R5',pages=[self.archive])

    def test_fix3_r5_archive_changelog_date_then_path_cell(self):
        for label in ('','原图 '):
            with self.subTest(label=label):
                row='<tr><td><time datetime="2026-10-28">2026-10-28</time></td><td>'+label+'<code>/media/bunny/3.1.0/sun05-pose-structure-v1.png</code></td><td>线稿通过</td></tr>'
                self.page(self.archive,'<h1>历史档案</h1><p>3.1.0</p><h2>变更记录</h2><table data-changelog><tbody>'+row+'</tbody></table>')
                self.good('R5',pages=[self.archive])

    def test_fix3_r15_imageset_comment_before_remote_string(self):
        self.good('R15')
        self.write('dist/assets/site.css','.hero{background:image-set(/* hi-dpi */"https://img.example.com/a.png" 2x)}')
        self.bad('R15')

    def test_fix3_r15_image_comment_before_remote_string(self):
        self.good('R15')
        self.write('dist/assets/site.css','.hero{background:image(/*x*/"https://img.example.com/a.png")}')
        self.bad('R15')

    def test_fix3_r15_imageset_whitespace_inside_remote_string(self):
        self.good('R15')
        self.write('dist/assets/site.css','.hero{background:image-set(" https://img.example.com/a.png" 1x)}')
        self.bad('R15')

    def test_fix3_r15_comment_punctuation_does_not_end_function(self):
        for comment in ('/* ) */', "/* ' */", '/* ( " */'):
            with self.subTest(comment=comment):
                self.write('dist/assets/site.css','.hero{background:image-set('+comment+'"https://img.example.com/a.png" 2x)}')
                self.bad('R15')


    def fix4_text_case(self, rule, page, snippet, expected, mode='after-h1', old=None):
        # Every acceptance row below carries its own literals and fixture setup.
        file=self.dist/(page.lstrip('/')+('index.html' if page.endswith('/') else '.html'))
        if rule=='R5' and page!=self.archive:
            # One permitted version makes an address leaking its version observable.
            source=file.read_text(encoding='utf-8')
            self.assertEqual(1,source.count('</h1>'))
            file.write_text(source.replace('</h1>','</h1><p>3.1.0</p>',1),encoding='utf-8')
        self.good(rule,pages=[page])
        if mode=='css':
            self.write('dist/assets/zz-accept.css',snippet)
        else:
            source=file.read_text(encoding='utf-8')
            if mode=='after-h1':
                anchor='</h1>';replacement=anchor+snippet
            elif mode=='before-vp-doc':
                anchor='<div class="vp-doc">';replacement=snippet+anchor
            elif mode=='replace':
                self.assertIsNotNone(old)
                anchor=old;replacement=snippet
            else:
                self.fail('unknown acceptance mode: '+mode)
            self.assertEqual(1,source.count(anchor),'acceptance anchor must occur exactly once')
            file.write_text(source.replace(anchor,replacement,1),encoding='utf-8')
        errors=self.check(rule,pages=[page])
        self.assertEqual(expected=='fail',bool(errors),[str(error) for error in errors])

    def test_fix4_text_a01_alt_stage_in_filename_link(self):
        self.fix4_text_case('D4',self.downloads,'<a href="/characters/bunny/3.1.0/body-front.svg"><img src="/characters/bunny/3.1.0/body-front.svg" alt="v2 身体正面标尺">body-front.svg</a>','fail')

    def test_fix4_text_a02_alt_date_in_path_link(self):
        self.fix4_text_case('R12a',self.downloads,'<a href="/characters/bunny/3.1.0/body-front.svg"><img src="/characters/bunny/3.1.0/body-front.svg" alt="身体正面标尺 2026-10-24">/characters/bunny/3.1.0/body-front.svg</a>','fail')

    def test_fix4_text_a03_alt_cm_in_filename_link(self):
        self.fix4_text_case('R12a',self.downloads,'<a href="/characters/bunny/3.1.0/body-front.svg"><img src="/characters/bunny/3.1.0/body-front.svg" alt="身高 165 cm 标尺">body-front.svg</a>','fail')

    def test_fix4_text_a04_md_paragraph_filename_then_img(self):
        self.fix4_text_case('R12a',self.downloads,'<p>sun05-scene-final-v1.png\n<img src="/characters/bunny/3.1.0/sun05-scene-final-v1.webp" alt="SUN-05 场景 2026-10-24"></p>','fail')

    def test_fix4_text_a05_td_filename_then_img_alt_date(self):
        self.fix4_text_case('R12a',self.layer,'<table><tr><td>scene.png<img alt="场景 2026-10-01"></td></tr></table>','fail')

    def test_fix4_text_a06_li_img_alt_version_then_path(self):
        self.fix4_text_case('R5',self.layer,'<ul><li><img alt="资料 3.0.0">/characters/bunny/x</li></ul>','fail')

    def test_fix4_text_a07_thumb_link_alt_stage(self):
        self.fix4_text_case('D4',self.layer,'<p><a href="/characters/bunny/3.1.0/goggles.webp"><img src="/site/thumbs/bunny/3.1.0/goggles.webp" alt="护目镜 v2 正面">goggles.webp</a></p>','fail')

    def test_fix4_text_a08_td_path_br_date(self):
        self.fix4_text_case('R12a',self.layer,'<table><tr><td>/media/bunny/3.1.0/scene.png<br>2026-10-24</td></tr></table>','fail')

    def test_fix4_text_a09_td_path_br_time(self):
        self.fix4_text_case('R12a',self.layer,'<table><tr><td>/media/bunny/3.1.0/scene.png<br><time datetime="2026-10-24">2026-10-24</time></td></tr></table>','fail')

    def test_fix4_text_a10_li_filename_br_version(self):
        self.fix4_text_case('R5',self.layer,'<ul><li>scene.png<br>3.0.0</li></ul>','fail')

    def test_fix4_text_a11_li_path_nested_list_stage(self):
        self.fix4_text_case('D4',self.layer,'<ul><li>/characters/bunny/headgear<ul><li>v2</li></ul></li></ul>','fail')

    def test_fix4_text_a12_li_version_br_filename(self):
        self.fix4_text_case('R5',self.layer,'<ul><li>3.0.0<br>scene.png</li></ul>','fail')

    def test_fix4_text_a13_td_time_br_filename(self):
        self.fix4_text_case('R12a',self.layer,'<table><tr><td><time datetime="2026-10-24">2026-10-24</time><br>scene.png</td></tr></table>','fail')

    def test_fix4_text_a14_md_cell_date_br_filename(self):
        self.fix4_text_case('R12a',self.layer,'<table><tbody><tr><td>2026-10-24<br>scene.png</td><td>场景定稿</td></tr></tbody></table>','fail')

    def test_fix4_text_a15_md_cell_version_br_zip(self):
        self.fix4_text_case('R5',self.layer,'<table><tbody><tr><td>3.0.0<br>bunny-3.0.0-design-reference.zip</td></tr></tbody></table>','fail')

    def test_fix4_text_a16_md_cell_stage_br_filename(self):
        self.fix4_text_case('D4',self.layer,'<table><tbody><tr><td>v2<br>goggles.webp</td><td>护目镜</td></tr></tbody></table>','fail')

    def test_fix4_text_a17_div_colour_url_block_ascii(self):
        self.fix4_text_case('R12a',self.layer,'<div class="chip">橙 #fd6702<div class="src">https://example.com/palette</div>OG 标志在角色左臂</div>','fail')

    def test_fix4_text_a18_div_stage_path_block_ascii(self):
        self.fix4_text_case('D4',self.layer,'<div class="note">头部样板 v2<p>/characters/bunny/headgear</p>OG 标志</div>','fail')

    def test_fix4_text_a19_div_colour_filename_block_ascii(self):
        self.fix4_text_case('R12a',self.layer,'<div>色 #ca2f2f<p>swatch.png</p>OG 标志</div>','fail')

    def test_fix4_text_a20_div_stage_filename_block_ascii(self):
        self.fix4_text_case('D4',self.layer,'<div>样板 v3<p>goggles.webp</p>OG 标志</div>','fail')

    def test_fix4_text_a21_archive_header_version_br_zip(self):
        # Rebuild the archive introduction before its first h2.
        old='<p>本页记录 Bunny 3.1.0 本地修订中已被取代的设计稿和变更记录，现行设计以<a href="/characters/bunny/">角色主页</a>为准。</p>'
        self.page(self.archive,'<h1>历史档案</h1>'+old+'<h2>变更记录</h2><div data-changelog></div>')
        self.fix4_text_case('R5',self.archive,'<p>本页记录已被取代的设计稿，现行设计以<a href="/characters/bunny/">角色主页</a>为准。</p><dl><dt>现行版本</dt><dd>3.1.0<br>bunny-3.1.0-design-reference.zip</dd></dl>','pass',mode='replace',old=old)

    def test_fix4_text_a22_archive_header_wording_br_zip(self):
        # Rebuild the archive introduction before its first h2.
        old='<p>本页记录 Bunny 3.1.0 本地修订中已被取代的设计稿和变更记录，现行设计以<a href="/characters/bunny/">角色主页</a>为准。</p>'
        self.page(self.archive,'<h1>历史档案</h1>'+old+'<h2>变更记录</h2><div data-changelog></div>')
        self.fix4_text_case('R5',self.archive,'<p>本页记录已被取代的设计稿，现行设计以<a href="/characters/bunny/">角色主页</a>为准。</p><dl><dt>现行版本</dt><dd>Bunny 3.1.0 本地修订<br>bunny-3.1.0-design-reference.zip</dd></dl>','pass',mode='replace',old=old)

    def test_fix4_text_a23_archive_header_span_code_wbr_zip(self):
        # Rebuild the archive introduction before its first h2.
        old='<p>本页记录 Bunny 3.1.0 本地修订中已被取代的设计稿和变更记录，现行设计以<a href="/characters/bunny/">角色主页</a>为准。</p>'
        self.page(self.archive,'<h1>历史档案</h1>'+old+'<h2>变更记录</h2><div data-changelog></div>')
        self.fix4_text_case('R5',self.archive,'<p>本页记录已被取代的设计稿，现行设计以<a href="/characters/bunny/">角色主页</a>为准。</p><dl><dt>版本</dt><dd><span>3.1.0</span><code>bunny-3.1.0-<wbr>design-reference.zip</code></dd></dl>','pass',mode='replace',old=old)

    def test_fix4_text_a24_version_span_then_code_wbr_zip(self):
        self.fix4_text_case('R5',self.layer,'<p><span>3.0.0</span><code>bunny-3.1.0-<wbr>design-reference.zip</code></p>','fail')

    def test_fix4_text_a25_version_span_then_code_trailing_space(self):
        self.fix4_text_case('R5',self.layer,'<p><span>3.0.0</span><code>bunny.zip </code></p>','fail')

    def test_fix4_text_a26_td_only_filename_cell_still_stripped(self):
        self.fix4_text_case('R5',self.home,'<table><tr><td>PNG</td><td>bunny-3.1.0-design-reference.zip</td></tr></table>','pass')

    def test_fix4_text_a27_li_only_path_still_stripped(self):
        self.fix4_text_case('R5',self.home,'<ul><li>/media/bunny/3.1.0/sun05-scene-final-v1.png</li></ul>','pass')

    def test_fix4_text_b01_time_slash_time(self):
        self.fix4_text_case('R12a',self.layer,'<p>更新：<time datetime="2026-10-28">2026-10-28</time>/<time datetime="2026-10-24">2026-10-24</time></p>','fail')

    def test_fix4_text_b02_b_slash_colour(self):
        self.fix4_text_case('R12a',self.layer,'<p>夹克：<b>orange</b>/#fd6702</p>','fail')

    def test_fix4_text_b03_b_slash_stage(self):
        self.fix4_text_case('D4',self.layer,'<p>头部样板 <b>SUN-05</b>/v2</p>','fail')

    def test_fix4_text_b04_wbr_slash_cm(self):
        self.fix4_text_case('R12a',self.layer,'<p>身高 H0<wbr>/165cm</p>','fail')

    def test_fix4_text_b05_span_slash_stage(self):
        self.fix4_text_case('D4',self.layer,'<p>编号 <span>A1</span>/v3 标签</p>','fail')

    def test_fix4_text_b06_code_slash_date(self):
        self.fix4_text_case('R12a',self.layer,'<p>日期 <code>x</code>/2026-10-01</p>','fail')

    def test_fix4_text_b07_em_starts_with_slash_colour(self):
        self.fix4_text_case('R12a',self.layer,'<p>色 orange<em>/#fd6702</em></p>','fail')

    def test_fix4_text_b08_plain_text_stage_after_slash(self):
        self.fix4_text_case('D4',self.layer,'<p>头部样板 SUN-05/v2</p>','fail')

    def test_fix4_text_b09_plain_text_date_after_slash(self):
        self.fix4_text_case('R12a',self.layer,'<p>更新 2026-10-28/2026-10-24</p>','fail')

    def test_fix4_text_b10_span_then_text_path(self):
        self.fix4_text_case('R5',self.downloads,'<p><span>SUN-05</span>/media/bunny/3.1.0/sun05-scene-final-v1.png</p>','pass')

    def test_fix4_text_b11_home_span_starts_with_path(self):
        self.fix4_text_case('R5',self.home,'<p>SUN-05<span>/media/bunny/3.1.0/sun05-scene-final-v1.png 原图</span></p>','pass')

    def test_fix4_text_b12_downloads_span_starts_with_path(self):
        self.fix4_text_case('R5',self.downloads,'<p>SUN-05<span>/media/bunny/3.1.0/sun05-scene-final-v1.png 原图</span></p>','pass')

    def test_fix4_text_b13_home_path_after_wbr(self):
        self.fix4_text_case('R5',self.home,'<p>SUN-05<wbr>/media/bunny/3.1.0/sun05-scene-final-v1.png 原图</p>','pass')

    def test_fix4_text_b14_wbr_before_short_slash_stage(self):
        self.fix4_text_case('D4',self.layer,'<p>头部样板 SUN-05<wbr>/v2</p>','fail')

    def test_fix4_text_c01_home_version_span_then_filename_link(self):
        self.fix4_text_case('R5',self.home,'<p><span>资料包 3.1.0</span><a href="/media/bunny/3.1.0/bunny-3.1.0-design-reference.zip">bunny-3.1.0-design-reference.zip <span aria-hidden="true">↗</span></a></p>','fail')

    def test_fix4_text_c02_home_zip_line_version_then_filename(self):
        # Rebuild the home download groups and their ZIP row.
        old='<p class="download-list__zip"><a href="/media/bunny/3.1.0/bunny-3.1.0-design-reference.zip">资料包 ZIP</a> · 224.6 MB</p>'
        self.page(self.home,'<h1>Bunny</h1><div class="download-list">'+self.groups(self.cfg.home_groups,['scene','line','pose'],home=True)+old+'</div>')
        self.fix4_text_case('R5',self.home,'<p class="download-list__zip"><span>资料包 3.1.0</span><a href="/media/bunny/3.1.0/bunny-3.1.0-design-reference.zip">bunny-3.1.0-design-reference.zip ↗</a> · 224.6 MB</p>','fail',mode='replace',old=old)

    def test_fix4_text_c03_download_item_stage_then_filename_link(self):
        # Rebuild a thumbnail, name, size, and link inside a download-list item.
        old='<span class="download-list__name">SUN-05 场景定稿</span><span class="download-list__size">2.5 MB</span><a href="/media/bunny/3.1.0/sun05-scene-final-v1.png" target="_blank" rel="noopener noreferrer">原图 PNG ↗</a>'
        self.page(self.downloads,'<h1>下载</h1><h2 id="dl-main">场景与线稿</h2><div class="download-list" data-download-group="dl-main"><ul><li data-download-asset="scene">'+self.figure('scene','SUN-05 场景定稿')+old+'</li></ul></div>')
        self.fix4_text_case('D4',self.downloads,'<span class="download-list__name">SUN-05 场景定稿 v1</span><a href="/media/bunny/3.1.0/sun05-scene-final-v1.png" target="_blank" rel="noopener noreferrer">sun05-scene-final-v1.png ↗</a><span class="download-list__size">2.5 MB</span>','fail',mode='replace',old=old)

    def test_fix4_text_c04_download_item_date_then_filename_link(self):
        # Rebuild a thumbnail, name, size, and link inside a download-list item.
        old='<span class="download-list__name">SUN-05 场景定稿</span><span class="download-list__size">2.5 MB</span><a href="/media/bunny/3.1.0/sun05-scene-final-v1.png" target="_blank" rel="noopener noreferrer">原图 PNG ↗</a>'
        self.page(self.downloads,'<h1>下载</h1><h2 id="dl-main">场景与线稿</h2><div class="download-list" data-download-group="dl-main"><ul><li data-download-asset="scene">'+self.figure('scene','SUN-05 场景定稿')+old+'</li></ul></div>')
        self.fix4_text_case('R12a',self.downloads,'<span class="download-list__name">SUN-05 场景定稿</span><time datetime="2026-10-24">2026-10-24</time><a href="/media/bunny/3.1.0/sun05-scene-final-v1.png" target="_blank" rel="noopener noreferrer">sun05-scene-final-v1.png ↗</a>','fail',mode='replace',old=old)

    def test_fix4_text_c05_colour_span_then_filename_span(self):
        self.fix4_text_case('R12a',self.layer,'<p><span class="chip__value">#fd6702</span><span class="chip__file">swatch-orange.png · 色卡</span></p>','fail')

    def test_fix4_text_c06_name_stage_then_filename_link(self):
        self.fix4_text_case('D4',self.downloads,'<ul><li><span>护目镜正面 v3</span><a href="/media/bunny/3.1.0/goggles.png">goggles.png ↗</a></li></ul>','fail')

    def test_fix4_text_c07_time_then_filename_and_label(self):
        self.fix4_text_case('R12a',self.layer,'<p><time datetime="2026-10-24">2026-10-24</time><span>sun05-scene-final-v1.png 场景图定稿</span></p>','fail')

    def test_fix4_text_c08_b_stage_then_filename_and_label(self):
        self.fix4_text_case('D4',self.layer,'<p><b>v2</b><span>goggles.webp 护目镜</span></p>','fail')

    def test_fix4_text_c09_time_then_bare_filename_text(self):
        self.fix4_text_case('R12a',self.layer,'<table><tr><td><time datetime="2026-10-24">2026-10-24</time>scene.png</td></tr></table>','fail')

    def test_fix4_text_c10_version_span_then_bare_filename_text(self):
        self.fix4_text_case('R5',self.layer,'<p><span>3.0.0</span>bunny.zip</p>','fail')

    def test_fix4_text_c11_b_stage_then_bare_filename_text(self):
        self.fix4_text_case('D4',self.layer,'<ul><li><b>v2</b>goggles.webp</li></ul>','fail')

    def test_fix4_text_c12_filename_split_stem_ext_spans(self):
        self.fix4_text_case('R5',self.home,'<p><span class="file-stem">bunny-3.1.0-design-reference</span><span class="file-ext">.zip</span></p>','pass')

    def test_fix4_text_c13_bare_filename_with_wbr(self):
        self.fix4_text_case('R5',self.home,'<p>资料包文件 bunny-3.1.0-<wbr>design-reference.zip（224.6 MB）</p>','pass')

    def test_fix4_text_c14_bare_path_with_wbr(self):
        self.fix4_text_case('R5',self.home,'<p>原图 /media/bunny/<wbr>3.1.0/sun05-scene-final-v1.png</p>','pass')

    def test_fix4_text_d01_layer_card_facts_fact_order(self):
        self.fix4_text_case('R12a',self.layer,'<dl class="layer-card__facts"><div><dt>H0</dt><dd>1475 px</dd></div><div><dt>头高</dt><dd>225 px</dd></div><div><dt>头身</dt><dd>约 6.56</dd></div><div><dt>厘米身高</dt><dd>未设定</dd></div></dl>','pass')

    def test_fix4_text_d02_layer_card_before_vp_doc(self):
        # page() builds the vp-doc wrapper; the aside is inserted before it.
        self.page(self.layer,'<h1>身体</h1><p>身体基准</p>')
        self.fix4_text_case('R12a',self.layer,'<aside class="layer-card"><p class="layer-card__no">0</p><p>身体</p><dl class="layer-card__facts"><div><dt>头身</dt><dd>约 6.56</dd></div><div><dt>厘米身高</dt><dd>未设定</dd></div></dl></aside>','pass',mode='before-vp-doc')

    def test_fix4_text_d03_table_rows_number_then_phrase(self):
        # The small site otherwise has no dimensions page.
        self.page(self.home+'dimensions','<h1>图面尺寸</h1>')
        self.fix4_text_case('R12a',self.home+'dimensions','<table><tbody><tr><td>头身</td><td>6.56</td></tr><tr><td>厘米身高</td><td>未设定</td></tr></tbody></table>','pass')

    def test_fix4_text_d04_prose_number_then_phrase(self):
        self.fix4_text_case('R12a',self.layer,'<p>头身比约 6.56</p><p>厘米身高未设定。</p>','pass')

    def test_fix4_text_d05_home_ratio_ticks_then_phrase(self):
        self.fix4_text_case('R12a',self.home,'<div class="ratio-box"><div class="ratio-box__ticks" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>0.56</span></div><p class="ratio-box__note">厘米身高未设定</p></div>','pass')

    def test_fix4_text_d06_real_cm_still_fails(self):
        self.fix4_text_case('R12a',self.layer,'<p>身高 165 厘米</p>','fail')

    def test_fix4_text_d07_phrase_then_real_cm(self):
        self.fix4_text_case('R12a',self.layer,'<p>厘米身高未设定，参考 170 厘米</p>','fail')

    def test_fix4_text_d08_number_then_cm_word_other_phrase(self):
        self.fix4_text_case('R12a',self.layer,'<p>约 6.56</p><p>厘米身高 165</p>','fail')

    def test_fix4_text_e01_url_dq_leading_space(self):
        self.fix4_text_case('R15',self.home,'.hero{background-image:url(" https://img.example.com/a.png")}','fail',mode='css')

    def test_fix4_text_e02_font_face_sq_leading_space(self):
        self.fix4_text_case('R15',self.home,'@font-face{font-family:X;src:url(\' https://fonts.example.com/x.woff2\') format("woff2")}','fail',mode='css')

    def test_fix4_text_e03_vite_escaped_space_unquoted(self):
        self.fix4_text_case('R15',self.home,'.hero{background-image:url(\\ https://img.example.com/a.png)}','fail',mode='css')

    def test_fix4_text_e04_import_string_leading_space(self):
        self.fix4_text_case('R15',self.home,'@import " https://fonts.example.com/a.css";','fail',mode='css')

    def test_fix4_text_e05_url_dq_leading_tab(self):
        self.fix4_text_case('R15',self.home,'.x{background:url("\thttps://cdn.example.net/p.jpg")}','fail',mode='css')

    def test_fix4_text_e06_import_url_leading_space(self):
        self.fix4_text_case('R15',self.home,'@import url(" https://cdn.example.net/a.css");','fail',mode='css')

    def test_fix4_text_e07_import_sq_leading_space(self):
        self.fix4_text_case('R15',self.home,"@import ' https://cdn.example.net/a.css';",'fail',mode='css')

    def test_fix4_text_e08_url_hex_escape(self):
        self.fix4_text_case('R15',self.home,'.x{background:url("\\68ttps://cdn.example.net/p.jpg")}','fail',mode='css')

    def test_fix4_text_e09_style_attr_leading_space(self):
        self.fix4_text_case('R15',self.layer,'<div style="background-image:url(\' https://cdn.example.net/p.jpg\')"></div>','fail')

    def test_fix4_text_e10_style_element_spaced(self):
        self.fix4_text_case('R15',self.layer,'<style>.y{background:url( " https://cdn.example.net/p.jpg" )}</style>','fail')

    def test_fix4_text_e11_control_url_no_space(self):
        self.fix4_text_case('R15',self.home,'.x{background:url("https://cdn.example.net/p.jpg")}','fail',mode='css')

    def test_fix4_text_e12_control_imageset_leading_space(self):
        self.fix4_text_case('R15',self.home,'.hero{background-image:image-set(" https://img.example.com/a.png" 1x)}','fail',mode='css')

    def test_fix4_text_e13_relative_spaced(self):
        self.fix4_text_case('R15',self.home,'.x{background:url( "/assets/p.jpg" )}','pass',mode='css')

    def test_fix4_text_e14_data_svg_with_xmlns(self):
        self.fix4_text_case('R15',self.home,'.x{background:url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\'%3e%3c/svg%3e")}','pass',mode='css')

    def test_fix4_text_e15_escaped_space_relative(self):
        self.fix4_text_case('R15',self.home,'.x{background:url(\\ /assets/p.jpg)}','pass',mode='css')

    def test_fix4_text_f01_path_text_then_stage_span(self):
        self.fix4_text_case('D4',self.layer,'<ul><li>/characters/bunny/3.1.0/body-ruler.svg<span class="download-list__name">v2 身体标尺</span></li></ul>','fail')

    def test_fix4_text_f02_path_text_then_date(self):
        self.fix4_text_case('R12a',self.layer,'<ul><li>/characters/bunny/3.1.0/body-ruler.svg<time datetime="2026-10-24">2026-10-24</time></li></ul>','fail')

    def test_fix4_text_f03_url_text_then_colour_code(self):
        self.fix4_text_case('R12a',self.layer,'<p>参考色卡：https://example.com/palette<code>#fd6702</code></p>','fail')

    def test_fix4_text_f04_url_removed_between_stage_and_ascii(self):
        self.fix4_text_case('D4',self.layer,'<p>头部样板 <b>v2</b>https://example.com/palette<span>OG 标志</span></p>','fail')

    def test_fix4_text_f05_dropped_code_between_stage_and_ascii(self):
        self.fix4_text_case('D4',self.layer,'<p>头部样板 <b>v2</b><code>goggles.webp</code>OG 标志</p>','fail')

    def test_fix4_text_f06_left_filename_rescanned(self):
        self.fix4_text_case('R5',self.home,'<p>资料包 bunny-3.1.0-design-reference.zip<span>goggles.webp 护目镜</span></p>','pass')

    def test_fix4_text_f07_dropped_link_between_colour_and_ascii(self):
        self.fix4_text_case('R12a',self.layer,'<p>主色 <code>#fd6702</code><a href="/media/bunny/3.1.0/palette.png">palette.png</a>OG</p>','fail')

    def test_fix4_text_plain_slash_tokens_on_current_page(self):
        cases=(
            ('D4','SUN-05/v2','current page contains a stage label'),
            ('R12a','2026-10-28/2026-10-24','date is outside allowed set: 2026-10-24'),
        )
        for rule,value,message in cases:
            with self.subTest(rule=rule,value=value):
                self.page(self.layer,'<h1>身体</h1>')
                self.good(rule,pages=[self.layer])
                self.append(self.layer,'<p>'+value+'</p>')
                errors=self.check(rule,pages=[self.layer])
                self.assertEqual([(rule,self.layer,message)],[(error.rule,error.page,error.message) for error in errors])

if __name__=='__main__':unittest.main()
