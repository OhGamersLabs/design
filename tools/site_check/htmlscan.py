"""Small HTML tree retaining source order and .vp-doc anchor boundaries."""
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit

VOID = frozenset('area base br col embed hr img input link meta param source track wbr'.split())
HIDDEN = frozenset(('head','script','style','template'))
PHRASING = frozenset('a abbr b bdi bdo cite code data dfn em i kbd mark q s samp small span strong sub sup time u var wbr'.split())
ADDRESS_PATTERNS = (
    re.compile(r'https?://[!-~]+'),
    re.compile(r'(?<![A-Za-z0-9])/[A-Za-z0-9._~%/#-]+'),
    re.compile(r'[A-Za-z0-9._-]+\.(?:png|jpe?g|webp|svg|json|zip|pdf)', re.I|re.ASCII),
)
PATH_AT_BOUNDARY = re.compile(r'/[A-Za-z0-9._~%/#-]+')

@dataclass(eq=False)
class Node:
    tag: str
    attrs: dict = field(default_factory=dict)
    parent: 'Node | None' = None
    children: list = field(default_factory=list)
    order: int = 0

    def has_class(self, name): return name in self.attrs.get('class','').split()
    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child,Node): yield from child.walk()
    def find(self,tag=None,attr=None):
        return [n for n in self.walk() if (tag is None or n.tag==tag) and (attr is None or attr in n.attrs)]
    def ancestor(self,predicate):
        n=self.parent
        while n is not None:
            if predicate(n): return n
            n=n.parent
        return None
    def text(self, *, alt=False, skip=HIDDEN, separator=''):
        """Keep substring text joined by default."""
        if self.tag in skip:return ''
        parts=[]
        for child in self.children:
            if isinstance(child,str):parts.append(child)
            else:parts.append(separator+child.text(alt=alt,skip=skip,separator=separator)+separator)
        if alt and self.tag=='img':parts.append(self.attrs.get('alt',''))
        return ''.join(parts)

    def regex_text(self, *, alt=False, skip=HIDDEN, before_order=float('inf')):
        """A: drop address elements; B: strip per segment; C: add separators."""
        children={};dropped=set()
        def prune(node):
            # Returns (text, subtree_is_phrasing) or None when skipped/dropped.
            if node.tag in skip or node.order>=before_order:return None
            kept=[];complete=[];phrasing=node.tag in PHRASING
            for child in node.children:
                if isinstance(child,str):
                    kept.append(child);complete.append(child)
                else:
                    result=prune(child)
                    if result is not None:
                        kept.append(child);complete.append(result[0]);phrasing=phrasing and result[1]
            value='' if node.tag=='wbr' else ''.join(complete)
            # Step A: only phrasing elements whose whole subtree is phrasing are dropped.
            if node is not self and phrasing and whole_address(value.strip()):
                dropped.add(node);return None
            children[node]=kept
            return value,phrasing
        prune(self)

        segments=[];parts=[];element_boundaries=set();siblings=set();wbrs=set();length=0
        def append(value):
            nonlocal length
            parts.append(value);length+=len(value)
        def boundary():
            nonlocal length
            # Step B: hard boundaries are applied before any address matching.
            if parts:
                segments.append((''.join(parts),set(element_boundaries),set(siblings),set(wbrs)))
            parts.clear();element_boundaries.clear();siblings.clear();wbrs.clear();length=0
        def visit(node):
            if node.tag not in PHRASING:boundary()
            (wbrs if node.tag=='wbr' else element_boundaries).add(length)
            previous=None
            kept=children[node]
            for child in node.children:
                if not isinstance(child,str) and child in dropped:
                    # A removed address leaves a separator where it stood.
                    siblings.add(length);previous=None
                    continue
                if not isinstance(child,str) and child not in children:continue
                if isinstance(child,str):
                    append(child);previous=None
                    continue
                if previous is not None and previous.tag!='wbr' and child.tag!='wbr':
                    siblings.add(length)
                visit(child)
                previous=child
            if alt and node.tag=='img':append(node.attrs.get('alt',''))
            if node.tag!='wbr':element_boundaries.add(length)
            if node.tag not in PHRASING:boundary()
        visit(self)
        boundary()
        return ' '.join(strip_segment(*segment) for segment in segments)

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root=Node('document');self.stack=[self.root];self.counter=0
    def handle_starttag(self,tag,attrs):
        self.counter+=1
        node=Node(tag,dict(attrs),self.stack[-1],order=self.counter)
        self.stack[-1].children.append(node)
        if tag not in VOID:self.stack.append(node)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID:self.handle_endtag(tag)
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag:
                del self.stack[i:];break
    def handle_data(self,data):self.stack[-1].children.append(data)

@dataclass
class Page:
    root: Node
    path: str = ''
    file: Path | None = None
    @property
    def body(self):return next(iter(self.root.find('body')),self.root)
    @property
    def docs(self):return [n for n in self.body.walk() if n.has_class('vp-doc')]
    @property
    def ids(self):
        return [n.attrs['id'] for n in self.body.walk() if 'id' in n.attrs and (n.has_class('vp-doc') or n.ancestor(lambda a:a.has_class('vp-doc')))]
    @property
    def all_ids(self):return [n.attrs['id'] for n in self.root.walk() if 'id' in n.attrs]
    def visible_text(self,*,separator=''):return self.body.text(alt=True,separator=separator)


def parse_html(text,path='',file=None):
    parser=Parser();parser.feed(text);parser.close()
    return Page(parser.root,path,file)


def clean_text(text):
    """Only ASCII addresses/names are removed; Chinese and spaced slashes survive."""
    for pattern in ADDRESS_PATTERNS:text=pattern.sub('',text)
    return text


ADDRESS_END = re.compile(r'\.(?:png|jpe?g|webp|svg|json|zip|pdf)$', re.I)

def address_like_path(value):
    # A path start not backed by the look-behind needs a second '/' or an address extension.
    return value.count('/')>=2 or bool(ADDRESS_END.search(value))

def whole_address(value):
    url,path,name=ADDRESS_PATTERNS
    return bool(url.fullmatch(value) or name.fullmatch(value) or (path.fullmatch(value) and address_like_path(value)))

def strip_segment(text, element_boundaries, siblings, wbrs=frozenset()):
    """Strip addresses in one hard segment, then insert surviving sibling spaces."""
    for pattern in ADDRESS_PATTERNS:
        def cut(start,end):
            # A URL or path never runs past the first element edge (not wbr) after its start.
            return min((offset for offset in element_boundaries if start<offset<end),default=end)
        if pattern is ADDRESS_PATTERNS[1]:
            spans=[];end=0
            for slash in re.finditer('/',text):
                start=slash.start()
                if start<end:continue
                match=pattern.match(text,start)
                if not match and (start in element_boundaries or start in wbrs):
                    match=PATH_AT_BOUNDARY.match(text,start)
                    # A boundary path must look like an address.
                    if match and not address_like_path(match[0]):match=None
                if match:
                    stop=cut(match.start(),match.end());spans.append((match.start(),stop));end=stop
        elif pattern is ADDRESS_PATTERNS[2]:
            spans=[]
            def names(low,high):
                for match in pattern.finditer(text,low,high):
                    start=match.start()
                    # Start at the first inner element edge (not wbr) from which a whole file name matches.
                    for offset in sorted(element_boundaries):
                        if start<offset<match.end() and pattern.fullmatch(text,offset,match.end()):
                            start=offset;break
                    # The text left of a moved start may hold file names of its own.
                    if start>match.start():names(match.start(),start)
                    spans.append((start,match.end()))
            names(0,len(text))
            spans.sort()
        else:
            spans=[];position=0
            while (match:=pattern.search(text,position)):
                stop=cut(match.start(),match.end());spans.append((match.start(),stop));position=stop

        def surviving(offsets):
            result=set();index=0;removed=0
            for offset in sorted(offsets):
                while index<len(spans) and spans[index][1]<=offset:
                    removed+=spans[index][1]-spans[index][0];index+=1
                if index<len(spans) and spans[index][0]<offset<spans[index][1]:continue
                result.add(offset-removed)
            return result
        removed_at=set();removed=0
        for span in spans:
            removed_at.add(span[0]-removed);removed+=span[1]-span[0]
        element_boundaries=surviving(element_boundaries)
        siblings=surviving(siblings)|removed_at
        wbrs=surviving(wbrs)
        parts=[];start=0
        for span in spans:
            parts.append(text[start:span[0]]);start=span[1]
        parts.append(text[start:]);text=''.join(parts)

    parts=[];start=0
    for offset in sorted(siblings):
        parts.extend((text[start:offset],' '));start=offset
    parts.append(text[start:])
    return ''.join(parts)
def normalize_path(path):
    path=unquote(path)
    if path.endswith('/index.html'):return path[:-10]
    if path.endswith('/index'):return path[:-5]
    if path.endswith('.html'):return path[:-5]
    return path or '/'


def resolve_url(url,page):
    parsed=urlsplit(urljoin('https://site.invalid'+page,url))
    if parsed.scheme not in ('http','https') or parsed.netloc!='site.invalid':return None
    return normalize_path(parsed.path),unquote(parsed.fragment)


def load_pages(dist):
    result={}
    for file in sorted(Path(dist).rglob('*.html')):
        path=normalize_path('/'+file.relative_to(dist).as_posix())
        result[path]=parse_html(file.read_text(encoding='utf-8'),path,file)
    return result
