"""Fixed site expectations, injectable for small independent fixture sites."""
from dataclasses import dataclass, field
from pathlib import Path

BUNNY = '/characters/bunny/'
PAGE_TITLES = dict(zip((BUNNY, *(BUNNY+x for x in ('body-base','innerwear','hosiery','shoes','hands','thigh-gear','jacket','harness','headgear','weapon','dimensions','visual-language','application','downloads','archive'))), ('Bunny','身体','上衣与短裤','袜装','鞋靴','手部','腿带','橙色夹克','裤腰皮带','护目镜','双匕首','图面尺寸','画风与配色','使用检查','下载','历史档案')))
STUBS = tuple(BUNNY+x for x in ('face','expressions','assembly','assembled','saw','weapon-history','overview','design-language','head-expressions','upper-layers','legs','knee-guard','systems','usage'))
NEW_ASSETS = {
    'sun05-scene-final-v1': ('current-sun05-scene-final',1774,887,'79393ac4c1f18f8e4b247de8e1161d2c'),
    'structure20-lineart-v1': ('current-structure20-lineart',1774,887,'8f420351671682f86654b8322d3005c9'),
    'sun05-pose-structure-v1': ('current-sun05-pose-structure',1536,1024,'9adf75c9c24988c87c19dbf4c5b4aa34'),
    'goggles-v2-belt-only-cel-front-v2': ('current-goggles-belt-only-front',1024,1536,'b11ce319b3fa9c413ae6fca594170418'),
}
HOME_GROUPS = tuple(zip(('dl-scene-lineart','dl-full-figure','dl-body-head','dl-layers-front','dl-parts','dl-weapon'),('场景与线稿','完整人物三视','身体与头部','衣层逐层正面','部件结构','武器')))
PAGE_GROUPS = tuple(zip(('dl-scene-lineart','dl-full-figure','dl-body-head','dl-layer-views','dl-parts-details','dl-weapon','dl-measurement-data'),('场景与线稿','完整人物三视','身体与头部','衣层穿着三视','部件结构与细节','武器','尺寸数据')))
PROCESS_WORDS = ('本轮','此前','已取消','取消','保留','旧','历史','尚未','待选','待补','改为','原有')
CANCELLED_NAMES = ('耳机','兔耳','护套','刀鞘','吊带','锯','棍','大剑','黑曜石')
EDITORIAL_CLAIMS = ('最容易画错','一眼就能认出')
DIRECTION_EXCEPTIONS = ('角色左','角色右','画面左','画面右','左右识别','左右翻看','左右键','左右肩宽')
PURPLES = ('#6551b9','#7462c4','#7462c412','#5743a8','#4f3c9b','#faf9fd','#f6f5fa','#f2f0f8','#e8e5ef')
RULE_IDS = ('R1','R2','R3','R4','R5','R6','R7','R7b','R8','R9','R10','R11','R12a','R12b','R13','R14','R15','R16','A5','D1','D2','D3','D4')

@dataclass
class SiteConfig:
    root: Path = field(default_factory=lambda: Path(__file__).resolve().parents[2])
    dist: Path | None = None
    home: str = BUNNY
    archive: str = BUNNY+'archive'
    downloads: str = BUNNY+'downloads'
    page_titles: dict = field(default_factory=lambda: dict(PAGE_TITLES))
    stubs: tuple = STUBS
    latest: tuple = (
        ('2026-10-29','场景图定稿','sun05-scene-final-v1'),
        ('2026-10-28','STRUCTURE20 线稿通过','structure20-lineart-v1'),
        ('2026-10-28','SUN-05 冲刺姿势选定','sun05-pose-structure-v1'),
        ('2026-10-27','后腰交叉携行三视','assassin-daggers-waist-carry-cel-back-v2'),
    )
    new_assets: dict = field(default_factory=lambda: dict(NEW_ASSETS))
    home_groups: tuple = HOME_GROUPS
    page_groups: tuple = PAGE_GROUPS
    home_download_count: int = 26
    measurement_anchors: tuple = ('body-measurements','garment-dimensions')
    frozen_file: Path | None = None
    baseline_file: Path | None = None
    # None uses the fixed SVG names recorded in frozen-hashes, never a mutable glob.
    ruler_paths: tuple | None = None
    manifests: tuple = ('catalog/bunny/3.1.0/manifest.json','catalog/origins/1.0.0/manifest.json')
    data_dir: str = 'docs/.vitepress/data/bunny'
    thumbs_file: str = 'docs/public/site/thumbs/index.json'
    releases_file: str = 'catalog/releases.json'
    allowed_dates: tuple = tuple('2026-10-'+str(n) for n in range(25,30))
    version: str = '3.1.0'
    node_helper: Path = field(default_factory=lambda: Path(__file__).with_name('node_helper.mjs'))

    def __post_init__(self):
        self.root = Path(self.root).resolve()
        self.dist = Path(self.dist).resolve() if self.dist is not None else self.root/'docs/.vitepress/dist'
        if self.frozen_file is None: self.frozen_file=Path(__file__).with_name('frozen-hashes.json')
        if self.baseline_file is None: self.baseline_file=Path(__file__).with_name('baseline-anchors.json')
