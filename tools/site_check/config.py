"""Fixed site expectations, injectable for small independent fixture sites."""
from dataclasses import dataclass, field
from pathlib import Path

BUNNY = '/characters/bunny/'
PAGE_TITLES = dict(zip((BUNNY, *(BUNNY+x for x in ('body-base','innerwear','hosiery','shoes','hands','thigh-gear','jacket','harness','headgear','weapon','dimensions','visual-language','application'))), ('Bunny','身体','上衣与短裤','袜装','鞋靴','手部','腿带','橙色夹克','裤腰皮带','护目镜','双匕首','图面尺寸','画风与配色','使用检查')))
STUBS = tuple(BUNNY+x for x in ('face','expressions','assembly','assembled','saw','weapon-history','overview','design-language','head-expressions','upper-layers','legs','knee-guard','systems','usage','archive','downloads'))
PROCESS_WORDS = ('本轮','此前','已取消','取消','保留','旧','历史','尚未','待选','待补','改为','原有')
CANCELLED_NAMES = ('耳机','兔耳','护套','吊带','锯','棍','大剑','黑曜石')
EDITORIAL_CLAIMS = ('最容易画错','一眼就能认出')
DIRECTION_EXCEPTIONS = ('角色左','角色右','画面左','画面右','左右识别','左右翻看','左右键','左右肩宽')
PURPLES = ('#6551b9','#7462c4','#7462c412','#5743a8','#4f3c9b','#faf9fd','#f6f5fa','#f2f0f8','#e8e5ef')
RULE_IDS = ('R1','R2','R3','R4','R6','R7','R7b','R8','R9','R10','R11','R12a','R12b','R13','R14','R15','R16','A1','A2','D2','D4')

@dataclass
class SiteConfig:
    root: Path = field(default_factory=lambda: Path(__file__).resolve().parents[2])
    dist: Path | None = None
    home: str = BUNNY
    page_titles: dict = field(default_factory=lambda: dict(PAGE_TITLES))
    stubs: tuple = STUBS
    latest: tuple = (
        ('2026-10-29','场景图定稿','sun05-scene-latest'),
        ('2026-10-28','STRUCTURE20 线稿通过','structure20-lineart-latest'),
        ('2026-10-28','SUN-05 冲刺姿势选定','sun05-pose-structure-latest'),
        ('2026-10-27','后腰交叉携行三视','daggers-back-latest'),
    )
    baseline_file: Path | None = None
    ruler_paths: tuple | None = None
    manifests: tuple | None = None
    data_dir: str = 'docs/.vitepress/data/bunny'
    thumbs_file: str = 'docs/public/site/thumbs/index.json'
    releases_file: str = 'catalog/releases.json'
    allowed_dates: tuple = tuple('2026-10-'+str(n) for n in range(25,30))
    node_helper: Path = field(default_factory=lambda: Path(__file__).with_name('node_helper.mjs'))

    def __post_init__(self):
        self.root = Path(self.root).resolve()
        self.dist = Path(self.dist).resolve() if self.dist is not None else self.root/'docs/.vitepress/dist'
        if self.baseline_file is None: self.baseline_file=Path(__file__).with_name('baseline-anchors.json')
