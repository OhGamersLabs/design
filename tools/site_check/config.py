"""Site-wide rules and discovered, injectable character expectations."""
from dataclasses import dataclass, field
import json
import math
from pathlib import Path
import re

PROCESS_WORDS = ('本轮','此前','已取消','取消','保留','旧','历史','尚未','待选','待补','改为','原有')
EDITORIAL_CLAIMS = ('最容易画错','一眼就能认出')
DIRECTION_EXCEPTIONS = ('角色左','角色右','画面左','画面右','左右识别','左右翻看','左右键','左右肩宽')
PURPLES = ('#6551b9','#7462c4','#7462c412','#5743a8','#4f3c9b','#faf9fd','#f6f5fa','#f2f0f8','#e8e5ef')
SHARED_COLLECTIONS = frozenset(('origins', 'base-bodies', 'world'))
RULE_IDS = ('R1','R2','R3','R4','R6','R7','R7b','R8','R9','R10','R11','R12a','R12b','R13','R14','R15','R16','R17','A1','A2','D2','D4')


@dataclass
class CharacterSpec:
    id: str
    name: str
    order: float = 0
    role: str = ''
    portrait: str = ''
    portrait_path: str = ''
    portrait_width: int = 0
    portrait_height: int = 0
    updated: str = ''
    page_titles: dict = field(default_factory=dict)
    stubs: tuple = ()
    latest: tuple = ()
    allowed_dates: tuple = ()
    forbidden_words: tuple = ()
    fixed_captions: dict = field(default_factory=dict)
    home: str = ''
    data_dir: str = ''
    listed: bool = True
    group: str = 'squad'

    def __post_init__(self):
        if not self.home:self.home=f'/characters/{self.id}/'
        if not self.data_dir:self.data_dir=f'docs/.vitepress/data/{self.id}'


def read_object(path):
    value=json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(value,dict):raise ValueError(f'expected JSON object: {path}')
    return value


def strings(value,label):
    if not isinstance(value,list) or not all(isinstance(item,str) for item in value):
        raise ValueError(f'expected string list: {label}')
    return tuple(value)


def names(value,label):
    if not isinstance(value,dict) or not all(isinstance(key,str) and isinstance(item,str) for key,item in value.items()):
        raise ValueError(f'expected string map: {label}')
    return value


def string(value,label):
    if not isinstance(value,str):raise ValueError(f'expected string: {label}')
    return value


def object_value(value,label):
    if not isinstance(value,dict):raise ValueError(f'expected object: {label}')
    return value


def character_path(value,cid):
    path=string(value,f'{cid}:path')
    if not path.startswith(f'/characters/{cid}/'):raise ValueError(f'path outside character {cid}: {path}')
    return path


def discover_characters(root):
    specs=[]
    thumbs=None
    for file in sorted((root/'docs/.vitepress/data').glob('*/character.json')):
        cid=file.parent.name
        if cid in SHARED_COLLECTIONS or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',cid):raise ValueError('invalid character id: '+cid)
        character=read_object(file)
        if not isinstance(character.get('name'),str) or not isinstance(character.get('role'),str) or not isinstance(character.get('order'),(int,float)) or isinstance(character['order'],bool) or not math.isfinite(character['order']) or not isinstance(character.get('pages'),list):
            raise ValueError(f'invalid character.json: {cid}')
        pages={f'/characters/{cid}/':character['name']}
        for entry in character['pages']:
            page=object_value(entry,f'{cid}:pages')
            pages[character_path(page['path'],cid)]=string(page['title'],f'{cid}:page title')
        mapping=read_object(file.with_name('anchor-map.json'))
        stubs=tuple(character_path(path,cid) for path in object_value(mapping['stubs'],f'{cid}:stubs'))
        home=read_object(file.with_name('home.json'))
        updated=string(home['updated'],f'{cid}:updated')
        if not isinstance(home['highlights'],list):raise ValueError(f'expected highlights list: {cid}')
        latest=[]
        for entry in home['highlights']:
            highlight=object_value(entry,f'{cid}:highlight')
            latest.append(tuple(string(highlight[key],f'{cid}:highlight {key}') for key in ('date','title','asset')))
        spec_file=file.with_name('site-check.json')
        source=read_object(spec_file)
        extra=set(source)-{'allowedDates','forbiddenWords','fixedCaptions'}
        if extra:raise ValueError(f'unknown site-check.json keys for {cid}: '+', '.join(sorted(extra)))
        portrait=string(character.get('portrait'),f'{cid}:portrait')
        manifest=read_object(root/'catalog'/cid/'manifest.json')
        if manifest.get('character_id')!=cid or not isinstance(manifest.get('assets'),list):raise ValueError(f'invalid character manifest: {cid}')
        if portrait==f'{cid}-original-latest' or not any(object_value(asset,f'{cid}:asset').get('id')==portrait for asset in manifest['assets']):
            raise ValueError(f'portrait must belong to character collection: {cid}/{portrait}')
        if thumbs is None:thumbs=read_object(root/'docs/public/site/thumbs/index.json')
        thumb=object_value(thumbs.get(f'{cid}/{portrait}'),f'{cid}:portrait thumbnail')
        portrait_path=string(thumb['path'],f'{cid}:portrait thumbnail path')
        for dimension in ('width','height'):
            if type(thumb.get(dimension)) is not int or thumb[dimension]<=0:raise ValueError(f'invalid portrait thumbnail {dimension}: {cid}')
        group=character.get('group','squad')
        if group not in ('squad','major-cast'):raise ValueError(f'invalid character group: {cid}')
        specs.append(CharacterSpec(id=cid,name=character['name'],page_titles=pages,stubs=stubs,latest=tuple(latest),
            order=character['order'],role=character['role'],portrait=portrait,portrait_path=portrait_path,
            portrait_width=thumb['width'],portrait_height=thumb['height'],updated=updated,
            allowed_dates=strings(source['allowedDates'],str(spec_file)+':allowedDates'),
            forbidden_words=strings(source['forbiddenWords'],str(spec_file)+':forbiddenWords'),
            fixed_captions=names(source['fixedCaptions'],str(spec_file)+':fixedCaptions'),
            listed=(root/'docs/characters'/cid/'index.md').is_file(),group=group))
    return tuple(specs)


def discover_shared_dates(root):
    file=root/'docs/.vitepress/data/base-bodies/base-bodies.json'
    if not file.is_file():return ()
    data=read_object(file)
    return strings(data.get('allowedDates',[]),str(file)+':allowedDates')


@dataclass
class SiteConfig:
    root: Path = field(default_factory=lambda: Path(__file__).resolve().parents[2])
    dist: Path | None = None
    characters: tuple[CharacterSpec, ...] | None = None
    shared_allowed_dates: tuple[str, ...] | None = None
    baseline_file: Path | None = None
    ruler_paths: tuple | None = None
    manifests: tuple | None = None
    thumbs_file: str = 'docs/public/site/thumbs/index.json'
    releases_file: str = 'catalog/releases.json'
    node_helper: Path = field(default_factory=lambda: Path(__file__).with_name('node_helper.mjs'))
    character_error: str | None = field(default=None,init=False)

    def __post_init__(self):
        self.root = Path(self.root).resolve()
        self.dist = Path(self.dist).resolve() if self.dist is not None else self.root/'docs/.vitepress/dist'
        if self.baseline_file is None:self.baseline_file=Path(__file__).with_name('baseline-anchors.json')
        if self.characters is None:
            try:self.characters=discover_characters(self.root)
            except (OSError,UnicodeError,KeyError,TypeError,ValueError) as exc:
                self.characters=()
                self.character_error=str(exc)
        if self.shared_allowed_dates is None:
            try:self.shared_allowed_dates=discover_shared_dates(self.root)
            except (OSError,UnicodeError,KeyError,TypeError,ValueError) as exc:
                self.shared_allowed_dates=()
                if self.character_error is None:self.character_error=str(exc)
