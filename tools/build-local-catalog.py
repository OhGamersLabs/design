#!/usr/bin/env python3
"""Refresh the local draft catalog and source ZIP; never uploads or deploys."""
import json,hashlib,zipfile
from PIL import Image
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()


def source_for(key: str, entry: dict | None, original_sha: str) -> dict:
    """Validate explicit provenance while preserving the source field order."""
    if entry is None:
        raise ValueError(f'{key}: missing source-map entry')
    if 'kind' in entry:
        raise ValueError(f'{key}: source-map entry must not contain kind')
    if 'no_baseline' in entry and 'baseline_sha256' in entry:
        raise ValueError(f'{key}: no_baseline and baseline_sha256 are mutually exclusive')
    if entry.get('no_baseline') is True:
        return dict(kind='local-design-revision', **{
            field: value for field, value in entry.items() if field != 'no_baseline'
        })
    if 'baseline_sha256' not in entry:
        raise ValueError(f'{key}: baseline_sha256 is required unless no_baseline is true')
    kind = 'recovered-reference' if entry['baseline_sha256'] == original_sha else 'revised-reference'
    return dict(kind=kind, **entry)


def main() -> None:
 source_map=json.loads((R/'catalog/bunny/3.1.0/source-map.json').read_text())
 catalog={'schemaVersion':1,'contentReady':False,'assets':[]}
 for char,ver in [('bunny','3.1.0'),('origins','1.0.0')]:
  webdir=R/'docs/public/characters'/char/ver; origdir=R/'.release'/char/ver
  manifest={'schema_version':'1.0','character_id':char,'release_version':ver,'language':'zh-CN','title':'Bunny 设计参考 · 本地修订' if char=='bunny' else '角色原始手稿','status':'local-review','source':'https://design.ohgamers.org/characters/bunny/','baseline_version':'3.0.0' if char=='bunny' else '1.0.0','asset_count':0,'assets':[],'downloads':[]}
  for web in sorted(webdir.glob('*.webp')):
   orig=origdir/(web.stem+'.png')
   if not orig.is_file():raise Exception('Missing original '+str(orig))
   def meta(path,url,mime):
    im=Image.open(path);return dict(path=url,mime_type=mime,width=im.width,height=im.height,bytes=path.stat().st_size,sha256=sha(path),alpha='A' in im.getbands())
   original=meta(orig,f'/media/{char}/{ver}/{orig.name}','image/png');derived=meta(web,f'/characters/{char}/{ver}/{web.name}','image/webp')
   key=char+'/'+orig.name
   source=source_for(key,source_map.get(key),original['sha256'])
   manifest['assets'].append(dict(id=web.stem,character=char,version=ver,title=web.stem,source=source,original=original,web=derived))
   catalog['assets'].append(dict(character=char,version=ver,path=original['path'],key=f'x_ops/design/characters/{char}/releases/{ver}/{orig.name}',sha256=original['sha256'],size=original['bytes'],contentType='image/png',downloadName=orig.name))
  manifest['asset_count']=len(manifest['assets'])
  if char=='bunny':
   z=origdir/'bunny-3.1.0-design-reference.zip'
   with zipfile.ZipFile(z,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=1) as archive:
    for item in manifest['assets']:
     p=origdir/Path(item['original']['path']).name;archive.write(p,p.name)
    info=zipfile.ZipInfo('manifest.json',date_time=(2026,10,23,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;archive.writestr(info,json.dumps(manifest,ensure_ascii=False,indent=2))
   download=dict(id='source-images',path=f'/media/{char}/{ver}/{z.name}',mime_type='application/zip',bytes=z.stat().st_size,sha256=sha(z))
   manifest['downloads'].append(download);catalog['assets'].append(dict(character=char,version=ver,path=download['path'],key=f'x_ops/design/characters/{char}/releases/{ver}/{z.name}',sha256=download['sha256'],size=download['bytes'],contentType='application/zip',downloadName=z.name))
  for p in [R/'catalog'/char/ver/'manifest.json',R/'docs/public/catalog'/char/ver/'manifest.json']:
   p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 (R/'catalog/releases.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
 print('Catalog:',len(catalog['assets']),'exact files')


if __name__ == '__main__':
    main()
