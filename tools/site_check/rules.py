"""Independent site rules. Each rule consumes the same complete build inventory."""
from collections import Counter
from dataclasses import dataclass
import base64
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit

from .config import (RULE_IDS, PROCESS_WORDS, CANCELLED_NAMES, EDITORIAL_CLAIMS,
                     DIRECTION_EXCEPTIONS, PURPLES)
from .htmlscan import HIDDEN, Node, clean_text, load_pages, normalize_path, resolve_url

@dataclass(frozen=True)
class Failure:
    rule: str
    page: str
    message: str
    def __str__(self):return f'{self.rule} {self.page}: {self.message}'

class DataError(Exception):pass
class UsageError(ValueError):pass

class Context:
    def __init__(self,cfg,pages,pending):
        self.cfg=cfg
        self.pages=load_pages(cfg.dist)
        def requested(paths):
            result=set()
            for original in paths:
                path=normalize_path(urlsplit(original).path)
                if path not in self.pages and path+'/' in self.pages:path+='/'
                if path not in self.pages:raise UsageError('unknown page '+original)
                result.add(path)
            return result
        self.selected=None if pages is None else requested(pages)
        self.pending=requested(pending or ())
        self.cache={}
    def wanted(self,path):return self.selected is None or path in self.selected
    def scanned(self):return [p for path,p in self.pages.items() if self.wanted(path)]
    def current(self,page):return page.path!=self.cfg.archive and page.path not in self.cfg.stubs
    def nonstubs(self):return [p for p in self.scanned() if p.path not in self.cfg.stubs]
    def read(self,path):
        path=Path(path)
        if not path.is_absolute():path=self.cfg.root/path
        if path not in self.cache:
            try:self.cache[path]=json.loads(path.read_text(encoding='utf-8'))
            except (OSError,UnicodeError,json.JSONDecodeError) as exc:
                raise DataError(f'cannot read {path}: {exc}') from exc
        return self.cache[path]
    def data(self,name):return self.read(Path(self.cfg.data_dir)/name)
    def assets(self):
        return [a for path in self.cfg.manifests for a in self.read(path)['assets']]
    def indexed_assets(self):return {a['id']:a for a in self.assets()}
    def status(self,asset):return asset.get('source',{}).get('review_status','')
    def local_file(self,path):
        path=unquote(urlsplit(path).path)
        if path.startswith('/media/'):return self.cfg.root/'.release'/path[len('/media/'):]
        built=self.cfg.dist/path.lstrip('/')
        return built if built.is_file() else self.cfg.root/'docs/public'/path.lstrip('/')
    def target_problem(self,url,source,*,pending=False,allow_stub=False,document_ids=False):
        resolved=resolve_url(url,source)
        if resolved is None:return None
        path,anchor=resolved
        if not allow_stub and path in self.cfg.stubs:return f'target is redirect stub: {url}'
        if path.startswith('/media/'):
            releases=self.read(self.cfg.releases_file)
            return None if path in {a['path'] for a in releases['assets']} else f'media path missing from release catalog: {url}'
        page=self.pages.get(path)
        if page is None:
            if not anchor and (self.cfg.dist/path.lstrip('/')).is_file():return None
            return f'target does not exist: {url}'
        if anchor and not (pending and path in self.pending) and anchor not in (page.all_ids if document_ids else page.ids):
            return f'target anchor does not exist: {url}'
        return None
    def asset_for_url(self,url,page='/'):
        resolved=resolve_url(url,page)
        if resolved is None:return None
        path=resolved[0]
        for asset in self.assets():
            if path in (asset.get('web',{}).get('path'),asset.get('original',{}).get('path')):return asset
        match=re.fullmatch(r'/site/thumbs/([^/]+)/([^/]+)/(.+)\.webp',path)
        if match:
            aid=match[3]
            for asset in self.assets():
                web=asset.get('web',{}).get('path','')
                if asset['id']==aid and web.startswith(f'/characters/{match[1]}/{match[2]}/'):return asset
        if path.lower().endswith('.svg'):
            key=('svg',path)
            if key not in self.cache:
                self.cache[key]=None
                file=self.local_file(path)
                if file.is_file():
                    text=file.read_text(encoding='utf-8')
                    for encoded in re.findall(r'data:image/[^;,]+;base64,([A-Za-z0-9+/=\s]+)',text):
                        try:digest=hashlib.sha256(base64.b64decode(encoded)).hexdigest()
                        except ValueError:continue
                        for a in self.assets():
                            if digest in (a.get('web',{}).get('sha256'),a.get('original',{}).get('sha256')):self.cache[key]=a
            return self.cache[key]
        return None
    def mapping_problem(self,url,source):
        resolved=resolve_url(url,source)
        if resolved is None:return 'mapping target must be a built internal page: '+url
        if resolved[0] not in self.pages:return 'mapping target page does not exist: '+url
        return self.target_problem(url,source)
    def node(self,mode,*args,text=None):
        try:
            out=subprocess.run(['node',str(self.cfg.node_helper),mode,*map(str,args)],input=text,text=True,capture_output=True,timeout=30)
        except (OSError,subprocess.TimeoutExpired) as exc:raise DataError(f'node helper: {exc}') from exc
        if out.returncode:raise DataError('node helper: '+out.stderr.strip().replace('\n',' '))
        try:return json.loads(out.stdout)
        except json.JSONDecodeError as exc:raise DataError('node helper returned invalid JSON') from exc


def refs(page):
    """Image sources and downloadable asset links, retaining their owning node."""
    for node in page.body.walk():
        if node.tag=='img' and node.attrs.get('src'):yield node,node.attrs['src']
        if node.tag in ('img','source') and node.attrs.get('srcset'):
            # Data URIs are single references even though their payload contains a comma.
            value=node.attrs['srcset']
            if value.strip().startswith('data:'):yield node,value.strip().split()[0]
            else:
                for item in value.split(','):
                    if item.strip():yield node,item.strip().split()[0]
        if node.tag=='a' and node.attrs.get('href') and re.search(r'\.(?:webp|png|svg|jpg|zip|json)$',urlsplit(node.attrs['href']).path,re.I):yield node,node.attrs['href']


def figure_for(node):return node if node.tag=='figure' else node.ancestor(lambda n:n.tag=='figure')
def caption(figure):
    caps=figure.find('figcaption') if figure else []
    if not caps:return ''
    strong=caps[0].find('strong')
    return (strong[0] if strong else caps[0]).text().strip()
def text(node):return clean_text(node.text(alt=True))
def regex_text(node, *, before_order=float('inf')):
    return node.regex_text(alt=True,before_order=before_order)
def heading_text(node):
    # VitePress permalink links have a zero-width-space text node.
    def content(n):
        if n.has_class('header-anchor'):return ''
        return ''.join(x if isinstance(x,str) else content(x) for x in n.children)
    return content(node).strip()
def fail(rule,page,message):return Failure(rule,page,message)


def r1(c):
    errors=[]
    for p in c.scanned():
        for a in p.body.find('a','href'):
            href=a.attrs['href']
            same_fragment=href.startswith('#')
            problem=c.target_problem(href,p.path,pending=True,allow_stub=same_fragment,document_ids=same_fragment)
            if problem:errors.append(fail('R1',p.path,problem))
    return errors


def r2(c):
    baseline=c.read(c.cfg.baseline_file); mapping=c.data('anchor-map.json')
    anchors=mapping.get('anchors',{});stubs=mapping.get('stubs',{})
    known={path+'#'+anchor for path,ids in baseline.items() for anchor in ids}
    errors=[]
    for key in anchors:
        source=key.split('#',1)[0]
        if c.wanted(source) and key not in known:errors.append(fail('R2',source,'mapping key is outside baseline: '+key))
    for path,ids in baseline.items():
        if not c.wanted(path):continue
        page=c.pages.get(path)
        if page is None:errors.append(fail('R2',path,'old URL is missing'))
        for anchor in ids:
            if page and c.current(page) and anchor in page.ids:continue
            key=path+'#'+anchor
            if key not in anchors:errors.append(fail('R2',path,'old anchor has no mapping: '+anchor));continue
            problem=c.mapping_problem(anchors[key],path)
            if problem:errors.append(fail('R2',path,problem))
    for path in c.cfg.stubs:
        if not c.wanted(path):continue
        p=c.pages.get(path); expected=stubs.get(path,{}).get('target')
        if p is None or not expected:errors.append(fail('R2',path,'stub page or mapping is missing'));continue
        refresh=[]
        for meta in p.root.find('meta'):
            if meta.attrs.get('http-equiv','').lower()=='refresh':
                m=re.fullmatch(r'\s*3\s*;\s*url\s*=\s*(.*?)\s*',meta.attrs.get('content',''),re.I)
                if m:refresh.append(m[1].strip('"\''))
        links=[a.attrs.get('href') for n in p.body.find(attr='data-redirect-stub') for a in n.find('a')]
        if refresh!=[expected] or links!=[expected]:errors.append(fail('R2',path,'meta refresh, stub link and mapping target must agree'))
        problem=c.mapping_problem(expected,path)
        if problem:errors.append(fail('R2',path,problem))
    return errors


def inactive_archive_image(node):
    def inactive(n):
        return n.tag in ('noscript','template') or (n.tag=='dialog' and 'open' not in n.attrs) or 'hidden' in n.attrs
    return inactive(node) or node.ancestor(inactive) is not None


def archive_asset_renderings(c,page):
    """Collect renderings once, including figure ids and picture alternatives."""
    renderings={}
    for node,url in refs(page):
        if node.tag=='a' or inactive_archive_image(node):continue
        owner=node
        if node.tag=='source':
            picture=node.ancestor(lambda n:n.tag=='picture')
            if picture is not None:owner=next((n for n in picture.find('img') if not inactive_archive_image(n)),picture)
            else:
                fig=figure_for(node)
                if fig is not None:
                    owner=next((n for n in fig.find('img') if figure_for(n) is fig and not inactive_archive_image(n)),node)
        ids=renderings.setdefault(owner,set())
        asset=c.asset_for_url(url,page.path)
        if asset:ids.add(asset['id'])
    for node in page.body.find('img','data-asset-id'):
        if inactive_archive_image(node):continue
        renderings.setdefault(node,set()).add(node.attrs['data-asset-id'])
    # The marker also identifies figures whose image address is not a manifest URL.
    # A wrapper figure does not borrow the rendering of a nested asset figure.
    for fig in page.body.find('figure','data-asset-id'):
        owners=[node for node in renderings if figure_for(node) is fig]
        for owner in owners:
            renderings.setdefault(owner,set()).add(fig.attrs['data-asset-id'])
    return renderings.items()


def r3(c):
    assets=c.indexed_assets(); errors=[]
    for p in c.nonstubs():
        seen=set()
        for node,url in refs(p):
            asset=c.asset_for_url(url,p.path)
            if not asset or asset['id']=='bunny-original':continue
            aid=asset['id'];status=c.status(asset)
            if c.current(p):
                if not status.startswith('current-') and aid not in seen:
                    errors.append(fail('R3',p.path,'non-current asset: '+aid));seen.add(aid)
            elif node.tag!='a' and status.startswith('current-'):
                fig=figure_for(node);key=id(fig) if fig else id(node)
                if key in seen:continue
                seen.add(key)
                if node.ancestor(lambda n:'data-changelog' in n.attrs or 'data-archive-measurements' in n.attrs) is None:errors.append(fail('R3',p.path,'current archive image is outside changelog or old measurements: '+aid))
                if not caption(fig).startswith('现行：'):errors.append(fail('R3',p.path,'current archive image caption needs 现行：: '+aid))
                item=node.ancestor(lambda n:'data-archive-item' in n.attrs)
                scope=item or fig
                if scope and any(n.has_class('archive-stamp') and '历史' in n.text() for n in scope.walk()):errors.append(fail('R3',p.path,'current image carries history stamp: '+aid))
        if p.path==c.cfg.archive:
            counts=Counter()
            renderings=list(archive_asset_renderings(c,p))
            for node,ids in renderings:
                if 'data-archive-measurements' in node.attrs or node.ancestor(lambda n:'data-archive-measurements' in n.attrs):continue
                item=node.ancestor(lambda n:n.tag=='li' and 'data-archive-item' in n.attrs)
                grid=item.ancestor(lambda n:'data-archive-grid' in n.attrs) if item else None
                for aid in sorted(ids):
                    if aid not in assets or not c.status(assets[aid]).startswith('historical-'):continue
                    counts[aid]+=1
                    if item is None or grid is None or item.attrs['data-archive-item']!=aid:
                        errors.append(fail('R3',p.path,'historical image must be inside its archive grid item: '+aid))
                    if node.ancestor(lambda n:'data-changelog' in n.attrs):
                        errors.append(fail('R3',p.path,'historical image is inside changelog: '+aid))
            for item in p.body.find(attr='data-archive-item'):
                if item.ancestor(lambda n:'data-archive-grid' in n.attrs) is None:continue
                if item.ancestor(lambda n:'data-archive-measurements' in n.attrs):continue
                aid=item.attrs['data-archive-item']
                if item.tag!='li':errors.append(fail('R3',p.path,'archive grid item must be li: '+aid))
                if aid not in assets or not c.status(assets[aid]).startswith('historical-'):errors.append(fail('R3',p.path,'archive grid item is not historical: '+aid))
                # An empty item marker cannot establish image coverage.
                owners=set()
                for node,ids in renderings:
                    if node.ancestor(lambda n:'data-archive-item' in n.attrs) is not item:continue
                    if 'data-archive-measurements' in node.attrs or node.ancestor(lambda n:'data-archive-measurements' in n.attrs):continue
                    if aid in ids:owners.add(node)
                    for rendered_id in sorted(ids):
                        asset=assets.get(rendered_id)
                        if rendered_id!=aid or asset is None or not c.status(asset).startswith('historical-'):
                            errors.append(fail('R3',p.path,'archive grid image mismatch: '+rendered_id))
                if len(owners)!=1:errors.append(fail('R3',p.path,f'archive item needs exactly one matching image: {aid} ({len(owners)})'))
            for aid,a in assets.items():
                if c.status(a).startswith('historical-') and counts[aid]!=1:errors.append(fail('R3',p.path,f'historical asset must have exactly one rendering outside measurements: {aid} ({counts[aid]})'))
    if c.wanted(c.cfg.archive) and c.cfg.archive not in c.pages:errors.append(fail('R3',c.cfg.archive,'archive page missing; historical coverage cannot be checked'))
    return errors


def r4(c):
    errors=[]
    for p in c.scanned():
        if not c.current(p):continue
        # Only navigation/link text has the 历史档案 exception, not prose.
        def visible(n):
            if n.tag in ('script','style','template','head'):return ''
            if n.tag=='a' or n.tag=='nav' or n.ancestor(lambda a:a.tag=='nav'):
                return n.text(alt=True).replace('历史档案','')
            out=''.join(x if isinstance(x,str) else visible(x) for x in n.children)
            if n.tag=='img':out+=n.attrs.get('alt','')
            return out
        value=clean_text(visible(p.body)).replace('抗锯齿','')
        for word in PROCESS_WORDS+CANCELLED_NAMES+EDITORIAL_CLAIMS:
            if word in value:errors.append(fail('R4',p.path,'forbidden wording: '+word))
        if p.body.find('details'):errors.append(fail('R4',p.path,'details element on current page'))
    return errors


def r5(c):
    errors=[]
    for p in c.nonstubs():
        if c.current(p):
            versions=re.findall(r'[0-9]+\.[0-9]+\.[0-9]+',regex_text(p.body))
            if len(versions)>1 or any(v!=c.cfg.version for v in versions):errors.append(fail('R5',p.path,'at most one current version is allowed: '+repr(versions)))
        else:
            # Header means the article content before its first h2, excluding nav.
            roots=p.docs or [p.body]; cutoff=min((n.order for root in roots for n in root.find('h2')),default=float('inf'))
            value=' '.join(regex_text(root,before_order=cutoff) for root in roots)
            versions=re.findall(r'[0-9]+\.[0-9]+\.[0-9]+',value)
            if versions!=[c.cfg.version]:errors.append(fail('R5',p.path,'archive header must contain current version exactly once'))
            nodes=p.body.find(attr='data-changelog')+[cap for item in p.body.find(attr='data-archive-item') for cap in item.find('figcaption')]
            for n in nodes:
                if re.search(r'[0-9]+\.[0-9]+\.[0-9]+',regex_text(n)):errors.append(fail('R5',p.path,'version appears in archive record or grid caption'))
    return errors


def r6(c):
    file=c.cfg.root/'docs/characters/bunny/index.md'
    try:source=file.read_text(encoding='utf-8')
    except OSError as exc:raise DataError(str(exc)) from exc
    fm=re.match(r'\A(?:\ufeff)?---\s*\n(.*?)\n---(?:\s*\n|$)',source,re.S)
    count=len(re.findall(r'^releaseReady:\s*false\s*(?:#.*)?$',fm[1],re.M)) if fm else 0
    return [] if count==1 else [fail('R6',str(file.relative_to(c.cfg.root)),f'frontmatter releaseReady: false occurs {count} times')]


def r7(c):
    assets=c.assets();thumbs=c.read(c.cfg.thumbs_file)
    allowed={a[k]['path'] for a in assets for k in ('web','original') if k in a}
    for path in c.cfg.manifests:allowed.update(d['path'] for d in c.read(path).get('downloads',[]))
    allowed.update(t['path'] for t in thumbs.values())
    if c.cfg.ruler_paths is None:
        allowed.update('/'+p.removeprefix('docs/public/') for p in c.read(c.cfg.frozen_file) if p.endswith('.svg'))
    else:allowed.update(c.cfg.ruler_paths)
    public=c.cfg.root/'docs/public'
    allowed.update('/'+p.relative_to(public).as_posix() for p in (public/'catalog').rglob('*.json'))
    errors=[]
    for p in c.nonstubs():
        for node,url in refs(p):
            resolved=resolve_url(url,p.path)
            if resolved is None or resolved[0] not in allowed:errors.append(fail('R7',p.path,'address is outside asset allowlist: '+url))
    return errors


def r7b(c):
    c.assets();errors=[]
    for p in c.scanned():
        seen=set()
        for node,url in refs(p):
            if node.tag=='a' or urlsplit(url).path.lower().endswith('.svg'):continue
            fig=figure_for(node)
            if p.path==c.cfg.archive and node.ancestor(lambda n:'data-archive-measurements' in n.attrs) and (fig is None or not fig.has_class('release-image')):continue
            asset=c.asset_for_url(url,p.path)
            if not asset:continue
            key=(fig or node,asset['id'])
            if key in seen:continue
            seen.add(key)
            if fig is None or not fig.has_class('release-image') or fig.attrs.get('data-asset-id')!=asset['id']:
                errors.append(fail('R7b',p.path,'image needs figure.release-image with matching data-asset-id: '+asset['id']))
    return errors


def r8(c):
    assets=c.assets();thumbs=c.read(c.cfg.thumbs_file);errors=[]
    bypath={a['web']['path']:a for a in assets}
    seen=set()
    for key,t in thumbs.items():
        source=t.get('sourcePath');asset=bypath.get(source);seen.add(source)
        if asset is None or t.get('sourceSha256')!=asset['web'].get('sha256'):errors.append(fail('R8',key,'thumbnail source sha256 does not match manifest'))
        collection=re.fullmatch(r'/characters/([^/]+)/([^/]+)/[^/]+',source or '',re.ASCII)
        expected=f'{collection[1]}/{collection[2]}/{asset["id"]}' if collection and asset else None
        if key!=expected or t.get('path')!='/site/thumbs/'+key+'.webp':
            errors.append(fail('R8',key,'thumbnail key, path and source asset must agree'))
    for path in bypath:
        if path not in seen:errors.append(fail('R8',path,'thumbnail index entry missing'))
    return errors


def r9(c):
    if not c.wanted(c.cfg.home):return []
    p=c.pages.get(c.cfg.home)
    if p is None:return [fail('R9',c.cfg.home,'home page missing')]
    latest=p.body.find('ol','data-latest');actual=[];errors=[]
    c.assets()
    if len(latest)==1:
        for item in (n for n in latest[0].children if isinstance(n,Node) and n.tag=='li'):
            dates=item.find('time');titles=item.find(attr='data-latest-title')
            image_ids={asset['id'] for node,url in refs(type('Part',(),{'body':item})()) if node.tag!='a' and (asset:=c.asset_for_url(url,p.path))}
            if image_ids!={item.attrs.get('data-asset-id')}:errors.append(fail('R9',p.path,'latest image must match its declared asset id'))
            actual.append((dates[0].attrs.get('datetime') if dates else None,titles[0].text().strip() if titles else None,item.attrs.get('data-asset-id')))
            if len(dates)!=1 or dates[0].text().strip()!=dates[0].attrs.get('datetime'):errors.append(fail('R9',p.path,'latest date text and datetime must agree'))
    if actual!=list(c.cfg.latest):errors.append(fail('R9',p.path,'latest dates, titles, assets or order differ from expected four entries'))
    if len({x[2] for x in actual})!=len(actual):errors.append(fail('R9',p.path,'latest asset is repeated'))
    return errors


def r10(c):
    errors=[]
    for p in c.nonstubs():
        values=[clean_text(p.visible_text())] if c.current(p) else [text(n) for n in p.body.find(attr='data-changelog')]+[text(cap) for item in p.body.find(attr='data-archive-item') for cap in item.find('figcaption')]
        for value in values:
            covered=bytearray(len(value))
            for fragment in DIRECTION_EXCEPTIONS:
                start=value.find(fragment)
                while start!=-1:
                    covered[start:start+len(fragment)]=b'\x01'*len(fragment)
                    start=value.find(fragment,start+1)
            if any(char in '左右' and not covered[i] for i,char in enumerate(value)):errors.append(fail('R10',p.path,'unqualified 左/右 in visible text'))
    return errors


def r11(c):
    errors=[];fixed='SUN-05 人体结构稿，手中为占位杆'
    for p in c.nonstubs():
        current=c.current(p)
        if current:
            nodes=[n for n in p.body.walk() if n.tag in ('figcaption','img','h1','h2','h3','h4','button') or n.attrs.get('role')=='tab' or 'data-download-asset' in n.attrs or 'data-download-file' in n.attrs]
            for n in nodes:
                value=clean_text(n.attrs.get('alt','') if n.tag=='img' else n.text())
                for m in re.finditer('侧面',value):
                    if not re.search(r'(?:角色左|角色右|刃|刀身|护手|柄)$',value[:m.start()]):errors.append(fail('R11',p.path,'side view needs character side: '+value.strip()));break
        for fig in p.body.find('figure'):
            aid=fig.attrs.get('data-asset-id','')
            nested=any(n is not fig for n in fig.find('figure'))
            if not aid and not nested:
                for node,url in refs(type('Part',(),{'body':fig})()):
                    m=re.search(r'/([^/]+)\.(?:webp|png)$',urlsplit(url).path)
                    if m:aid=m[1];break
            own_caps=[n for n in fig.find('figcaption') if figure_for(n) is fig]
            own_images=[n for n in fig.find('img') if figure_for(n) is fig]
            own_caption=''
            if own_caps:
                strong=[n for n in own_caps[0].find('strong') if figure_for(n) is fig]
                own_caption=(strong[0] if strong else own_caps[0]).text(skip=HIDDEN|{'figure'}).strip()
            if aid=='sun05-pose-structure-v1' and own_caption!=(fixed if current else '现行：'+fixed):errors.append(fail('R11',p.path,'SUN-05 structure caption differs from required wording'))
            if current and 'front' in aid:
                value=' '.join(n.text(skip=HIDDEN|{'figure'}) for n in own_caps)+' '.join(n.attrs.get('alt','') for n in own_images)
                if '后腰' in value or '交叉携行' in value:errors.append(fail('R11',p.path,'front image caption/alt describes rear carry'))
    return errors


def r12a(c):
    errors=[]
    for p in c.scanned():
        if not c.current(p):continue
        value=regex_text(p.body)
        if re.search(r'#[0-9a-fA-F]{3,8}(?![A-Za-z0-9_])',value):errors.append(fail('R12a',p.path,'visible color value'))
        if re.search(r'[0-9０-９]+(?:\.[0-9０-９]+)?\s*(?:cm|厘米|公分|mm|毫米)',re.sub(r'厘米身高\s*未设定','',value)):errors.append(fail('R12a',p.path,'visible centimeter/millimeter number'))
        for date in sorted(set(re.findall(r'[0-9]{4}-[0-9]{2}-[0-9]{2}',value))-set(c.cfg.allowed_dates)):errors.append(fail('R12a',p.path,'date is outside allowed set: '+date))
        if c.node('emoji',text=value):errors.append(fail('R12a',p.path,'visible emoji'))
    return errors


def r12b(c):
    errors=[]
    for file in sorted((c.cfg.dist/'assets').rglob('*.css')):
        css=file.read_text().lower()
        for color in PURPLES:
            if re.search(re.escape(color)+r'(?![0-9a-f])',css):errors.append(fail('R12b','/'+file.relative_to(c.cfg.dist).as_posix(),'forbidden purple value: '+color))
    return errors


def r13(c):
    errors=[]
    for p in c.nonstubs():
        occurrences={}
        for fig in p.body.find('figure'):
            if fig.attrs.get('data-asset-id')=='bunny-original':occurrences[id(fig)]=fig
        for node,url in refs(p):
            if node.tag=='a':continue
            resolved=resolve_url(url,p.path)
            if resolved and re.search(r'/bunny-original\.(?:webp|png)$',resolved[0]):
                owner=figure_for(node) or node
                occurrences[id(owner)]=owner
        expected=1 if p.path==c.cfg.home else 0
        if len(occurrences)!=expected:errors.append(fail('R13',p.path,f'original figure count must be {expected}, got {len(occurrences)}'))
        for owner in occurrences.values():
            if owner.find(attr='data-lightbox-group') or owner.ancestor(lambda n:'data-lightbox-group' in n.attrs):errors.append(fail('R13',p.path,'original must not belong to lightbox group'))
    if c.wanted(c.cfg.home) and c.cfg.home not in c.pages:errors.append(fail('R13',c.cfg.home,'home page missing'))
    return errors


def r14(c):
    if not c.wanted(c.cfg.home):return []
    p=c.pages.get(c.cfg.home)
    nodes=[n for hero in p.body.find(attr='data-hero') for n in hero.find(attr='data-hero-status')] if p else []
    if not any(n.text().strip()=='本地审阅版，不是生产发布' for n in nodes):return [fail('R14',c.cfg.home,'hero status must say 本地审阅版，不是生产发布')]
    return []


REMOTE=r'(?:https?:)?//[^\s\'"`<>),]+'
def load_arguments(value,pattern,flags=re.ASCII):
    """Keep nested url() and quoted parentheses inside a load function."""
    for match in re.finditer(pattern,value,flags):
        depth=1;quote=None;escaped=False;end=match.end()
        for end in range(match.end(),len(value)):
            char=value[end]
            if quote:
                if escaped:escaped=False
                elif char=='\\':escaped=True
                elif char==quote:quote=None
            elif char in '\'"`':quote=char
            elif char=='(':depth+=1
            elif char==')':
                depth-=1
                if depth==0:break
        else:end=len(value)
        yield value[match.end():end]
def css_loads(value):
    flags=re.I|re.ASCII
    # Remove comments before finding function bounds: comment punctuation must
    # not change nesting/quote state. Quoted strings (including data URIs) stay.
    value=re.sub(r'''("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|/\*.*?\*/''',
                 lambda match:match[1] if match[1] is not None else '',value,flags=re.S)
    urls=[]
    def remote(argument):
        argument=argument.strip()
        if argument[:1] in ('"',"'") and argument[-1:]==argument[:1]:argument=argument[1:-1]
        argument=re.sub(r'\\([0-9a-fA-F]{1,6})[ \t\n\r\f]?|\\(.)',lambda m:chr(int(m[1],16)) if m[1] else m[2],argument,flags=re.S)
        match=re.match(REMOTE,argument.strip(' \t\n\r\f\x00-\x1f\x7f'),flags)
        if match:urls.append(match[0])
    for match in re.finditer(r'''url\(((?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\\.|[^)"'\\])*)\)''',value,flags|re.S):remote(match[1])
    for match in re.finditer(r'''@import\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')''',value,flags|re.S):remote(match[1])
    # image() and image-set() also accept image addresses without url().
    for image in load_arguments(value,r'\b(?:image-set|image)\s*\(',flags):
        index=0;depth=0
        while index<len(image):
            char=image[index]
            argument_start=index==0 or image[index-1] in '(,' or image[index-1].isspace()
            if char in '\'"':
                start=index+1;index=start
                while index<len(image):
                    if image[index]=='\\':index+=2;continue
                    if image[index]==char:break
                    index+=1
                # A whole quoted data: argument is skipped, including SVG xmlns.
                if depth==0 and argument_start:
                    match=re.match(REMOTE,image[start:index].strip(),flags)
                    if match:urls.append(match[0])
            elif char=='(':depth+=1
            elif char==')':depth-=1
            elif depth==0 and argument_start:
                if image[index:index+5].lower()=='data:':
                    # Commas belong to an unquoted data URI, not a new URL.
                    while index<len(image) and not image[index].isspace() and image[index] not in '()':index+=1
                    continue
                match=re.match(REMOTE,image[index:],flags)
                if match:
                    urls.append(match[0]);index+=len(match[0]);continue
            index+=1
    return urls
def js_loads(value):
    literal=r'''['"`]('''+REMOTE+r')'
    patterns=[
        r'''\bimport\s*['"]('''+REMOTE+r')',
        r'''\b(?:import|export)\s*[^;\n'"`]*?\bfrom\s*['"]('''+REMOTE+r')',
        r'\b(?:import|fetch|importScripts)\s*\(\s*'+literal,
        r'\bnew\s+(?:Worker|SharedWorker|WebSocket|EventSource)\s*\(\s*'+literal,
        r'(?<![\w$])(?:src|srcset|poster)\s*[:=]\s*'+literal,
        r'''['"](?:src|srcset|poster)['"]\s*\]?\s*[:=]\s*'''+literal,
        r'''\bsetAttribute\(\s*['"](?:src|srcset|poster)['"]\s*,\s*'''+literal,
    ]
    urls=[url for pattern in patterns for url in re.findall(pattern,value,re.ASCII)]
    # Every importScripts argument is a script URL, including later arguments.
    for args in load_arguments(value,r'\bimportScripts\s*\('):
        urls.extend(re.findall(literal,args,re.ASCII))
    # A plain URL object and anchor href are not resource loads. For dynamic
    # href assignments only recognize variables visibly created as link nodes.
    links=re.findall(r'''\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\.createElement\(\s*['"]link['"]\s*\)''',value,re.ASCII)
    for name in links:
        escaped=re.escape(name)
        urls.extend(re.findall(escaped+r'\.href\s*=\s*'+literal,value,re.ASCII))
        urls.extend(re.findall(escaped+r'''\.setAttribute\(\s*['"]href['"]\s*,\s*'''+literal,value,re.ASCII))
    return urls
def r15(c):
    errors=[]
    for p in c.scanned():
        urls=[]
        for n in p.root.walk():
            if n.tag in ('script','img','iframe','audio','video','source','track','embed','input'):
                for attr in ('src','poster'):
                    if re.match(r'^(?:https?:)?//',n.attrs.get(attr,''),re.I|re.ASCII):urls.append(n.attrs[attr])
            if n.tag in ('img','source'):
                urls.extend(re.findall(REMOTE,n.attrs.get('srcset',''),re.ASCII))
            if n.tag=='object' and re.match(r'^(?:https?:)?//',n.attrs.get('data',''),re.I|re.ASCII):urls.append(n.attrs['data'])
            if n.tag in ('image','use','feimage'):
                for attr in ('href','xlink:href'):
                    if re.match(r'^https?://',n.attrs.get(attr,''),re.I|re.ASCII):urls.append(n.attrs[attr])
            if n.tag=='link' and set(n.attrs.get('rel','').lower().split()) & {'stylesheet','preload','modulepreload','prefetch','icon','apple-touch-icon','manifest'} and re.match(r'^(?:https?:)?//',n.attrs.get('href',''),re.I|re.ASCII):urls.append(n.attrs['href'])
            urls.extend(css_loads(n.attrs.get('style','')))
            if n.tag=='style':urls.extend(css_loads(n.text(skip=())))
            if n.tag=='script':urls.extend(js_loads(n.text(skip=())))
        for url in sorted(set(urls)):errors.append(fail('R15',p.path,'external resource load: '+url))
    for file in sorted(c.cfg.dist.rglob('*')):
        if file.suffix not in ('.css','.js','.mjs'):continue
        source=file.read_text(encoding='utf-8');urls=css_loads(source) if file.suffix=='.css' else js_loads(source)
        for url in sorted(set(urls)):errors.append(fail('R15','/'+file.relative_to(c.cfg.dist).as_posix(),'external resource load: '+url))
    return errors


def r16(c):
    if not c.wanted(c.cfg.archive):return []
    files=sorted((c.cfg.dist/'assets/chunks').glob('@localSearchIndexroot.*.js'))
    if len(files)!=1:return [fail('R16',c.cfg.archive,f'expected one local search index, found {len(files)}')]
    result=c.node('search',files[0],'双手棍');errors=[]
    matches=[r for r in result['results'] if any(k.startswith('双手棍') for k in r.get('match',{}))]
    if not matches:errors.append(fail('R16',c.cfg.archive,'no exact-prefix 双手棍 search result'))
    for item in matches:
        path=normalize_path(urlsplit(item['id']).path)
        titles=item.get('titles',[])+[item.get('title','')]
        if path!=c.cfg.archive or titles[0]!='历史档案':errors.append(fail('R16',path,'双手棍 result must belong to 历史档案'))
    for document in result['documentIds']:
        path=normalize_path(urlsplit(document).path)
        if path in c.cfg.stubs:errors.append(fail('R16',path,'redirect stub is in local search index'))
    return errors


def a5(c):
    frozen=c.read(c.cfg.frozen_file);errors=[]
    for path,expected in frozen.items():
        file=c.cfg.root/path
        if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest()!=expected:errors.append(fail('A5',path,'frozen sha256 mismatch or file missing'))
    prefix='docs/public/characters/bunny/3.1.0/'
    baseline={path for path in frozen if path.startswith(prefix) and path.endswith('.webp')}
    if baseline:
        allowed=baseline|{prefix+aid+'.webp' for aid in c.cfg.new_assets}
        for file in (c.cfg.root/prefix).glob('*.webp'):
            path=file.relative_to(c.cfg.root).as_posix()
            if path not in allowed:errors.append(fail('A5',path,'unexpected new WebP asset name'))
    return errors


def d1(c):
    manifest=c.read(c.cfg.manifests[0]);names=c.data('asset-names.json');assets={a['id']:a for a in manifest['assets']};errors=[]
    if len(assets)!=len(manifest['assets']):errors.append(fail('D1',c.cfg.manifests[0],'duplicate asset ids'))
    for aid,a in assets.items():
        if not re.fullmatch(r'(current|historical)-[a-z0-9_.-]+',c.status(a)):errors.append(fail('D1',aid,'review_status must be current-* or historical-*'))
    expected=set(assets)|{'bunny-original'}
    if set(names)!=expected:errors.append(fail('D1','asset-names.json','name keys differ from bunny assets plus bunny-original'))
    for aid,name in names.items():
        if not isinstance(name,str) or not name.strip():errors.append(fail('D1',aid,'Chinese display name is empty'))
    for aid,(status,width,height,md5) in c.cfg.new_assets.items():
        a=assets.get(aid)
        if a is None:errors.append(fail('D1',aid,'required new asset missing'));continue
        if c.status(a)!=status:errors.append(fail('D1',aid,'new asset status differs'))
        for kind in ('original','web'):
            if (a.get(kind,{}).get('width'),a.get(kind,{}).get('height'))!=(width,height):errors.append(fail('D1',aid,kind+' dimensions differ'))
        file=c.local_file(a['original']['path'])
        if not file.is_file() or hashlib.md5(file.read_bytes()).hexdigest()!=md5:errors.append(fail('D1',aid,'new original md5 differs or file missing'))
    return errors


def d2(c):
    mapping=c.data('display-text.json');errors=[]
    def strings(value):
        if isinstance(value,str):yield value
        elif isinstance(value,dict):
            for v in value.values():yield from strings(v)
        elif isinstance(value,list):
            for v in value:yield from strings(v)
    for path,replacements in mapping.items():
        if path=='@labels':
            allowed={f'{part}.{view}' for part in ('body','garment') for view in ('front','side','back')}
            if set(replacements)-allowed:errors.append(fail('D2',path,'unknown view label key'))
            continue
        originals=set(strings(c.read(path)))
        for source in replacements:
            if source not in originals:errors.append(fail('D2',path,'display-text key is not an original string: '+source))
    return errors


def d3(c):
    wanted=[path for path in (c.cfg.home,c.cfg.downloads) if c.wanted(path)]
    if not wanted:return []
    assets=c.indexed_assets();current={aid for aid,a in assets.items() if c.status(a).startswith('current-')};errors=[]
    for path in wanted:
        p=c.pages.get(path)
        if p is None:errors.append(fail('D3',path,'download page missing'));continue
        groups=p.body.find(attr='data-download-group');expected=c.cfg.home_groups if path==c.cfg.home else c.cfg.page_groups
        actual=[]
        for group in groups:
            if path==c.cfg.home:heads=group.find('h3');head=heads[0] if heads else None
            else:heads=[h for h in p.body.find('h2') if h.order<group.order];head=heads[-1] if heads else None
            actual.append((group.attrs['data-download-group'],heading_text(head) if head else None))
        if actual!=list(expected):errors.append(fail('D3',path,'download group ids, names or order differ'))
        items=[n.attrs['data-download-asset'] for group in groups for n in group.find(attr='data-download-asset')]
        if path==c.cfg.home:
            if len(items)!=c.cfg.home_download_count:errors.append(fail('D3',path,f'home downloads need {c.cfg.home_download_count} assets, got {len(items)}'))
            if any(a not in current for a in items):errors.append(fail('D3',path,'home downloads contain a non-current/original asset'))
        else:
            if Counter(items)!=Counter({a:1 for a in current}):errors.append(fail('D3',path,'downloads must list each current asset exactly once and no other asset'))
            measurement=next((n for n in groups if n.attrs['data-download-group']=='dl-measurement-data'),None)
            ids={n.attrs['id'] for n in measurement.find(attr='id')} if measurement else set()
            if not set(c.cfg.measurement_anchors)<=ids:errors.append(fail('D3',path,'measurement aliases missing from dimensions group'))
    return errors


def d4(c):
    errors=[]
    for path,expected in c.cfg.page_titles.items():
        if not c.wanted(path):continue
        p=c.pages.get(path);h1=[n for root in p.docs for n in root.find('h1')] if p else []
        # VitePress adds a decorative heading permalink, which is not the title.
        name=heading_text(h1[0]) if h1 else None
        if name!=expected:errors.append(fail('D4',path,'first .vp-doc h1 must be '+expected))
    for p in c.scanned():
        if c.current(p) and re.search(r'(?<![A-Za-z])v[0-9]+(?![A-Za-z0-9_.])',regex_text(p.body)):errors.append(fail('D4',p.path,'current page contains a stage label'))
    return errors


RULES={name:globals()[name.lower()] for name in RULE_IDS}
def expand_rules(rules):
    out=[]
    for rule in rules or RULE_IDS:
        for item in (('R12a','R12b') if rule=='R12' else (rule,)):
            if item not in RULES:raise ValueError('unknown rule: '+item)
            if item not in out:out.append(item)
    return out

def run_checks(config,*,rules=None,pages=None,pending=None):
    selected=expand_rules(rules);c=Context(config,pages,pending);errors=[]
    if not c.pages and any(r not in ('R6','A5','D1','D2','R8','R12b') for r in selected):
        return [fail(r,str(config.dist),'build contains no HTML pages') for r in selected]
    for rule in selected:
        try:errors.extend(RULES[rule](c))
        except (DataError,KeyError,TypeError,ValueError,OSError) as exc:
            # A missing/malformed dependency is one actionable rule failure, not a traceback.
            errors.append(fail(rule,'data',str(exc).replace('\n',' ')))
    return errors
