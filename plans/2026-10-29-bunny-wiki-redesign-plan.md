# Bunny 设计站改版 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Bunny 设计站改成方向 A：角色主页 + 设定集。现行页只讲现行设计，历史进档案，三张新成果入站，旧链接和旧锚点继续可用，全部规则由站点检查脚本判定。

**Architecture:**
- 页面仍是 VitePress markdown。
- Bunny 页用自定义布局 `BunnyPage` 和一组主题组件，数据来自 `docs/.vitepress/data/bunny/*.json`、两份清单和缩略图索引，由构建时数据加载器汇总。
- 现行和历史的划分只看清单里的 `review_status`。
- 站点检查脚本是 Python 标准库脚本，读构建产物 `docs/.vitepress/dist`。有两项检查要借 Node：搜索索引查询和 emoji 判定。

**Tech Stack:** VitePress 1.6.4、Vue ^3.5.13、vite 6.4.3、Node ≥ 22（本机 26）、Python 3 + Pillow（仓库已用）、`node --test`、`unittest`。

**Spec:** `plans/2026-10-29-bunny-wiki-redesign-design.md`（下称"设计文档"，节号如 §4.10）。

---

## Global Constraints

- 不部署，不上传 R2；不改 `worker/`、`wrangler.jsonc`；`catalog/releases.json` 的 `contentReady: false` 不动。
- 不加运行时依赖。VitePress 1.6.4、Vue ^3.5.13、vite 6.4.3 不升级。不引外部 CDN、字体或脚本。
- 以 `6cd6593` 为准，这些文件的 sha256 不变：已有的 180 张 `docs/public/characters/bunny/3.1.0/*.webp`、19 张该目录下的 `*.svg`、原稿两份文件（`docs/public/characters/origins/1.0.0/bunny-original.webp` 和 `.release/origins/1.0.0/bunny-original.png`）、`catalog/bunny/3.1.0/` 下 7 个尺寸 JSON，共 208 个文件。
- 清单只能由 `tools/build-local-catalog.py` 生成。`catalog/<角色>/<版本>/manifest.json` 与 `docs/public/catalog/<角色>/<版本>/manifest.json` 保持一致。
- 生成工具只在本工作树 `/Users/roy/Developments/design-bunny-repair`、本机时区里跑。不开新工作树，因为新工作树里没有 `.release/`。
- `docs/characters/bunny/index.md` 的 frontmatter 有且只有一处 `releaseReady: false`。`npm run check:release` 必须继续失败。
- 原图链接是 `/media/<角色>/<版本>/<文件>`，网页图是 `/characters/<角色>/<版本>/<名>.webp`。`ReleaseImage` 现有行为全部保留，大图层显示的图不变，见设计文档 §3.1。
- `npm run build` 现有四步的顺序不变，输出仍是 `docs/.vitepress/dist`。
- 现行页的文字规则以设计文档 §4.10 为准，逐字照用。
- 原因栏和所有产物里写到人时，一律写「负责人」，不用昵称。
- 本计划称"现行页"的，是除 `/characters/bunny/archive` 和 14 个跳转桩以外的全部构建页面，含 `/` 和 `/standards/`。
- 14 个跳转桩是：`face`、`expressions`、`assembly`、`assembled`、`saw`、`weapon-history`，以及 8 个旧桩 `overview`、`design-language`、`head-expressions`、`upper-layers`、`legs`、`knee-guard`、`systems`、`usage`。
- 测试文件照仓库现有习惯放在 `test/`。`node --test` 不扫描 `docs/.vitepress` 这类点目录（2026-10-29 实测），放在源码旁边不会被执行。`test/` 下的每个 `.mjs` 都会被当成测试，所以测试夹具不能用 `.mjs` 后缀。
- 单独跑某个 Python 测试，用 `python3 -m unittest discover -s test -p '<文件名>' -v`。不要用 `python3 -m unittest test.<模块>`：标准库里也有 `test` 包，会被优先导入。
- Codex 施工时不提交 git，由 Claude 在验收通过后提交。
- Codex 不改受保护文件：`tools/check-site.py`、`tools/site_check/**`、`test/check_site_test.py`、本计划、设计文档。
- 每个 Codex 任务结束时，把需要人看的清单写到 `/tmp/bunny_wiki/build/`（不进仓库）。
- 效果图 A 用的素材名（如 `layer6-jacket.jpg`、`dagger-mount.jpg`）到资产 id 的对照，以 `/Users/roy/Developments/x_ops/output/bunny-wiki-mock-20261029/mock/assets/index.json` 为准：取每项 `src` 的文件名去掉后缀，就是资产 id。三个例外：`key-scene` 是 `sun05-scene-final-v1`，`structure20` 是 `structure20-lineart-v1`，`sun05-pose` 是 `sun05-pose-structure-v1`；`original` 是 `bunny-original`。
- 每页可见文字里版本号最多一处。Bunny 区只在主页信息框和档案页页头各写一次，站点首页只在标语里写一次。下载项名称、图注、组名都不写版本号，例如写「资料包 ZIP」「角色清单」「原稿清单」。
- 站内链接只指向改版后的位置：不指向 14 个跳转桩，也不指向已迁走的锚点。改版后的锚点以各任务 Interfaces 里列出的为准。

## Review Focus

1. **旧链接的锚点经过百分号编码或带 `.html` 后缀**：例如 `/characters/bunny/face.html#%E5%A4%B4%E9%83%A8…`。跳转桩和现行页的锚点兜底都要先解码、去后缀再查映射，不能落空。这条由 Task 2 的 `resolveAnchorTarget` 单测钉住。
2. **站内单页跳转进入一个锚点已迁走的页面**：`AnchorFallback` 不只在首次加载时查，路由变化后也要查。这条由 Task 2 的 `shouldRedirectForHash` 单测钉住。A11 再在浏览器里用 VitePress 路由做一次站内跳转，确认路由变化后执行了 `location.replace`。
3. **分组大图层翻到第 3 张后按 Esc**：焦点必须回到最初点开的那张缩略图，不是第 3 张对应的缩略图。"原始尺寸"模式下按左右键只滚动、不翻页。这条由 Task 2 的 `stepIndex` 单测（到两端不循环）和 A10 浏览器实测钉住。
4. **新资产漏写中文名，或页面写错资产 id**：构建必须直接失败，不能把 id 或空白当图注显示。这条由 Task 2 的 `buildAssetIndex` 单测钉住。
5. **375 宽下的长文件名和长图注**：下载列表、档案网格不能横向溢出。这条由 A9 对所有 Bunny 页面的溢出量测钉住。

---

## 文件结构

**Codex 在 Task 0 单独一轮写，Claude 复核并提交后锁定，此后 Codex 不改**
- `tools/check-site.py`：命令入口，`python3 tools/check-site.py [--dist PATH] [--rules R1,R3,…] [--pages /path …] [--pending /path …]`。
- `tools/site_check/__init__.py`、`config.py`（站点的固定期望）、`htmlscan.py`（解析构建出的 HTML）、`rules.py`（各条规则）、`node_helper.mjs`（MiniSearch 查询、emoji 判定）、`cli.py`。
- `tools/site_check/baseline-anchors.json`：`6cd6593` 构建产物里 31 个页面 `.vp-doc` 内的全部 id，共 229 个。
- `tools/site_check/frozen-hashes.json`：第 3 条约束列的全部文件的 sha256。
- `test/check_site_test.py`：每条规则一个好样例、一个故意做坏的样例。
- `package.json`：只加一行 `"check:site": "python3 tools/check-site.py"`。

**Codex 写**
- `tools/build-local-catalog.py`：重构成函数，加显式"无基线"字段。
- `test/build_local_catalog_test.py`：新建。
- `tools/build-thumbs.py`、`test/build_thumbs_test.py`：新建，生成并核对缩略图。
- `catalog/bunny/3.1.0/source-map.json`：补审阅状态，新增条目。
- 由工具生成：`catalog/**/manifest.json`、`docs/public/catalog/**`、`catalog/releases.json`。
- `docs/public/characters/bunny/3.1.0/{sun05-scene-final-v1,structure20-lineart-v1,sun05-pose-structure-v1}.webp`。
- `docs/public/site/thumbs/<角色>/<版本>/<id>.webp`、`docs/public/site/thumbs/index.json`。
- `docs/.vitepress/data/bunny/`：`asset-names.json`、`home.json`、`changes.json`、`layers.json`、`downloads.json`、`archive.json`、`anchor-map.json`、`display-text.json`。
- `docs/.vitepress/data/bunny-site.data.mjs`：数据加载器。
- `docs/.vitepress/theme/bunny-site.mjs`：纯逻辑；测试 `test/bunny-site.test.mjs`。
- `docs/.vitepress/search-render.mjs`：搜索索引用的渲染；测试 `test/search-render.test.mjs`。
- `docs/.vitepress/theme/`：
  - 新建：`SiteLayout.vue`、`BunnyPage.vue`、`components/{AssetImage,CharacterHero,LatestList,ChapterBar,LayerStrip,LayerCard,ReferenceCard,PagePager,OriginNote,ArchiveGrid,ChangelogTable,DownloadList,RedirectStub,AnchorFallback}.vue`；
  - 修改：`ReleaseImage.vue`、`BodyMeasurements.vue`、`GarmentMeasurements.vue`、`BodyProportionCompare.vue`（只在需要时加 `assetId`）、`index.ts`、`style.css`；
  - 删除：`EditorialLayout.vue`、`bunny-editorial.css`、`components/BunnyChapterHeader.vue`、`components/EditorialPair.vue`。
- `docs/.vitepress/config.mts`、`docs/.vitepress/bunny-navigation.mjs`。
- `docs/characters/bunny/*.md`（29 个）、新建 `docs/characters/bunny/archive.md`、`docs/index.md`、`docs/standards/index.md`（只改违反规则的字句）、`README.md`。

---

## 页面结构契约（检查脚本依赖，组件必须照此输出）

- **K0 正文容器**：
  - 四种 Bunny 布局（home、archive、layer、reference）都用 `<div class="vp-doc">` 包住 `<Content/>`。层号卡、参考卡、页底翻页放在它外面。
  - 检查脚本只在 `.vp-doc` 里找锚点 id，和基线的取法一致。
  - 适用于 16 个页面：主页、档案页、14 个内页。跳转桩不适用。
  - 这 16 页的 markdown 第一行正文是 `# <页面名>`，frontmatter 的 `title` 与它相同。页面名取 `READING_ORDER`（主页为「Bunny」，档案页为「历史档案」）。
  - 主页和 14 个内页的这个 `h1` 写成 `# <页面名> {.bunny-sr-only}`，视觉隐藏，只供搜索和 D4 用。页面上看得到的名字由信息框、层号卡、参考卡显示，那里不用 `h1`，所以和效果图 A 的观感相同。档案页的 `h1` 正常显示。
  - 这 16 页的 frontmatter 都写 `sidebar: false`、`aside: false`。
- **K1 图片**：
  - 站内每张资产图都经 `ReleaseImage` 渲染，根元素是 `<figure class="release-image" data-asset-id="<资产 id>">`。
  - 图注是 `figcaption strong` 的文字。
  - 标尺 SVG 也经 `ReleaseImage`，但不带 `data-asset-id`。
  - 例外：档案页旧尺寸节里 `BodyProportionCompare` 的普通 `<img>`。
- **K2 分组**：分组图的触发按钮带 `data-lightbox-group="<组名>"`。原稿 `bunny-original` 的按钮永远不带这个属性。
- **K3 分组大图层**：
  - 打开后显示 `[data-lightbox-counter]`，文字是「第 N 张，共 M 张」。
  - 翻页按钮是 `[data-lightbox-prev]` 和 `[data-lightbox-next]`，`aria-label` 分别为「上一张」「下一张」。到两端时 `disabled`，不循环。
- **K4 最新**：`<ol data-latest>`。每个 `<li data-asset-id="…">` 里有一个 `<time datetime="YYYY-MM-DD">`，内容是同一日期；还有一个 `[data-latest-title]`，内容是标题。
- **K5 首屏**：
  - 根元素 `[data-hero]`。
  - 三个切换按钮 `[role=tab]`，文字依次为「场景定稿」「完整三视」「线稿」。
  - 三个面板分别是 `[data-hero-panel="scene"]`、`[data-hero-panel="three"]`、`[data-hero-panel="line"]`。
  - 状态文字放在 `[data-hero-status]`。
- **K6 原稿**：`OriginNote` 输出的 `figure` 带 `data-asset-id="bunny-original"`。
- **K7 档案**：
  - 每组网格的根元素是 `[data-archive-grid="<组 id>"]`，每项是 `<li data-archive-item="<资产 id>">`，里面先放 `<span class="archive-stamp">历史</span>`，再放 figure。
  - 变更记录表的根元素是 `[data-changelog]`。
  - 旧尺寸节的根元素是 `[data-archive-measurements]`。
- **K8 跳转桩**：
  - frontmatter 只写 `layout: BunnyPage`、`bunny: stub`、`search: false`、`sidebar: false`、`aside: false`，不写目标。
  - 目标和目标标题只来自 `anchor-map.json` 的 `stubs[路径]`，页面不重复写一份。
  - 正文只有 `<p data-redirect-stub>本页已迁移，前往：<a href="<目标>">目标标题</a></p>`。
  - `<head>` 里有 `<meta http-equiv="refresh" content="3; url=<目标>">`，由 `config.mts` 的 `transformPageData` 按映射表注入。
- **K9 衣层条**：`[data-layer-strip]` 下有 9 个 `li[data-layer="0"…"8"]`，里面的 figure 分组名为 `layers`。
- **K10 下载列表**：
  - 每组的根元素是 `div[data-download-group="<组 id>"]`，组的 `anchors` 在根元素里各渲染成一个 `<span id>`。
  - 主页：`<DownloadList set="home" />` 一次渲染六组。每组根元素带 `id="<组 id>"`，组名是根元素里的 `h3`。末尾固定加资料包 ZIP 一行、状态与最近更新一行。
  - 「下载」内页：markdown 里每组写 `## <组名> {#<组 id>}`，下面跟 `<DownloadList set="page" group="<组 id>" />`。根元素不带 `id`，`id` 在标题上。这样左侧参考卡的目录（读 `page.headers`）和本地搜索都能看到组名。资料包 ZIP 链接写在第一组之前的正文里。
  - 组 id 一律以 `dl-` 开头，免得和主页章节锚点 `#weapon`、`#downloads` 撞名。
  - 资产项是 `li[data-download-asset="<资产 id>"]`，文件项是 `li[data-download-file="<地址>"]`。
  - 资产项的缩略图照效果图 A「点缩略图看大图」，按 K1 经 `AssetImage` 渲染：`li[data-download-asset]` 里是 `figure.release-image[data-asset-id]`，大图层分组名 `downloads`，名称是 `figcaption strong`；文件大小和原图链接放在 figure 外。
  - 主页下载段的六组依次是：场景与线稿、完整人物三视、身体与头部、衣层逐层正面、部件结构、武器。资产项合计 26 个。
  - 「下载」内页的七组依次是：场景与线稿、完整人物三视、身体与头部、衣层穿着三视、部件结构与细节、武器、尺寸数据。
  - 主页六组的 id 依次是：`dl-scene-lineart`、`dl-full-figure`、`dl-body-head`、`dl-layers-front`、`dl-parts`、`dl-weapon`。
  - 「下载」内页七组的 id 依次是：`dl-scene-lineart`、`dl-full-figure`、`dl-body-head`、`dl-layer-views`、`dl-parts-details`、`dl-weapon`、`dl-measurement-data`。
  - 「尺寸数据」组的 `anchors` 是 `["body-measurements", "garment-dimensions"]`。

## 数据文件格式（`docs/.vitepress/data/bunny/`）

- **`asset-names.json`**：`{ "<资产 id>": "中文名称" }`。键必须恰好是 bunny/3.1.0 清单的全部 id 加上 `bunny-original`。
- **`home.json`**：
  ```json
  { "tabs": [{ "key": "scene|three|line", "label": "…", "caption": "…", "assets": ["id"] }],
    "facts": [{ "term": "…", "value": "…", "note": "…" }],
    "chips": [{ "name": "橙", "use": "夹克、角色左腿袜", "swatch": "orange" }],
    "chipNote": "取自定稿图的近似色",
    "version": "Bunny 3.1.0 本地修订", "status": "本地审阅版，不是生产发布", "updated": "2026-10-29",
    "chapters": [{ "id": "identity", "label": "身份与画风" }] }
  ```
  - `swatch` 只取 `orange|red|white|black`，由 CSS 变量着色，数据里不写色值。
- **`changes.json`**：一条改动一条记录，数组按日期倒序；同日期时以 `order` 升序，顺序照检查条件 M3。
  ```json
  [{ "date": "2026-10-29", "order": 1,
     "latest": { "title": "场景图定稿", "asset": "sun05-scene-final-v1", "caption": "…" },
     "log": { "change": "SUN-05 场景图定稿", "reason": "—", "asset": "sun05-scene-final-v1", "caption": "现行：…" } }]
  ```
  - `latest` 可为 `null`。`log.caption` 必须以「现行：」开头。
- **`layers.json`**：
  ```json
  [{ "layer": 0, "name": "身体", "path": "/characters/bunny/body-base", "front": "id", "side": "id", "back": "id",
     "summary": "…", "facts": [{ "term": "…", "value": "…" }], "leftRight": "…" }]
  ```
  - 9 条，层号 0–8。
- **`downloads.json`**：
  ```json
  { "home": [{ "id": "dl-scene-lineart", "group": "场景与线稿", "anchors": [], "items": [{ "asset": "id", "label": "…" }] }],
    "page": [{ "id": "dl-…", "group": "…", "anchors": [], "items": [{ "asset": "id", "label": "…" } | { "file": "/characters/bunny/3.1.0/x.svg", "label": "…" }] }] }
  ```
- **`archive.json`**：
  ```json
  { "groups": [{ "id": "staff", "title": "双手棍", "statuses": ["historical-…"],
                 "items": [{ "asset": "id", "date": "2026-10-26|—", "replacedBy": "…" }] }] }
  ```
  - 档案网格的图注一律取 `asset-names.json` 的名称，`archive.json` 不另存名称。
- **`anchor-map.json`**：
  ```json
  { "stubs": { "/characters/bunny/face": { "target": "/characters/bunny/#identity", "title": "身份与画风" } },
    "anchors": { "/characters/bunny/face#v2-·-中性头部样板": "/characters/bunny/#identity" } }
  ```
  - 键里的 id 都是解码后的原文。
- **`display-text.json`**：
  ```json
  { "catalog/bunny/3.1.0/body-measurements.json": { "<原字符串>": "<改写后>" },
    "catalog/bunny/3.1.0/garment-measurements.json": { … },
    "@labels": { "body.front": "正面", "body.side": "角色右侧面", "body.back": "背面",
                 "garment.front": "正面", "garment.side": "角色右侧面", "garment.back": "背面" } }
  ```
  - 按原文整串匹配，同一原文处处同改。
  - `@labels` 是尺寸组件里写死的视角名（`body-measurements.mjs` 的 `labels`、`GarmentMeasurements.vue` 的 `viewNames`），由 Vue 外壳按视角键替换显示。键只能是上面六个；侧面写哪一侧，在 Task 1 复核时按记录定，上面的值只是格式示例。D2 不按原文核对 `@labels`。
- **缩略图索引 `docs/public/site/thumbs/index.json`**：
  ```json
  { "bunny/3.1.0/<id>": { "path": "/site/thumbs/bunny/3.1.0/<id>.webp", "width": 480, "height": 720,
      "sha256": "…", "sourcePath": "/characters/bunny/3.1.0/<id>.webp", "sourceSha256": "…" } }
  ```

---

### Task 0: 站点检查脚本、基线快照与做坏样例（Codex 施工第 0 步，Claude 复核后锁定）

**Files:**
- Create: `tools/check-site.py`、`tools/site_check/{__init__,config,htmlscan,rules,cli}.py`、`tools/site_check/node_helper.mjs`、`tools/site_check/baseline-anchors.json`、`tools/site_check/frozen-hashes.json`
- Create: `test/check_site_test.py`
- Modify: `package.json`（加 `check:site`）

**Interfaces:**
- Produces:
  - 命令 `npm run check:site`。
  - `python3 tools/check-site.py --rules <ids> --pages <path…>` 只跑选定规则、选定页面。
  - 失败时每条打印一行 `<规则 id> <页面>: <说明>`，退出码 1；全部通过时打印 `site check: OK (<n> rules)`，退出码 0。
  - `--pages` 只限定被扫描的页面。链接目标、锚点是否存在，始终按完整构建判。
  - 绑定在某一页的检查，那一页不在 `--pages` 里时整条跳过：R3 的档案覆盖与去重、R9、R13 的"主页恰好一次"、R14、D3 的主页段和下载内页段、R16。
  - R13 在主页以外的页面上判"原稿出现 0 次"。
  - `--pending` 列出还没改写的页面。链接指向这些页面时，只查页面存在，不查锚点。
  - 数据文件缺失时，依赖它的规则报一条失败，不抛异常。
- 规则 id：`R1`–`R16` 对应设计文档 A7 的 ①–⑯。`R12` 拆成两半：`R12a` 查页面文字，`R12b` 查构建出的 CSS。`--rules R12` 两半都跑。
- R7 拆成两条：`R7` 查地址是否在允许集合里，`R7b` 查资产图的 figure 是否带 `data-asset-id`。旧页面的图都不带这个属性，所以 `R7b` 只在改写过的页面上跑。
- 另有五条补充规则：
  - `A5`：冻结文件哈希；
  - `D1`：数据完整性，审阅状态、三张新资产、中文名称；
  - `D2`：`display-text.json` 的每个键都能在对应 JSON 里找到原文；
  - `D3`：下载列表，按 K10 检查；
  - `D4`：页面名，按 K0 检查，并查现行页的阶段标签。

- [ ] **Step 1：取基线。** 用 `/tmp/bunny_wiki/baseline-dist`（`0e85606` 的构建，正文和 `6cd6593` 相同）。
  - 锚点：取 31 个页面 `.vp-doc` 内的全部 id，按页面写入 `baseline-anchors.json`，共 229 个。
  - 哈希：按第 3 条约束列的文件，写入 `frozen-hashes.json`，合计 180 + 19 + 2 + 7 = 208 个文件。原稿两份是 `docs/public/characters/origins/1.0.0/bunny-original.webp` 和 `.release/origins/1.0.0/bunny-original.png`。
- [ ] **Step 2：写做坏样例测试。**
  - 测试在临时目录里造一个最小站：构建产物几页 HTML、两份清单、缩略图索引、数据文件。
  - 用可注入的 `SiteConfig` 传入小号期望。每条规则先断言好样例通过，再改坏一处，断言报出这条规则的 id。
  - 样例至少覆盖：
    - `R1`：死链；链接指向跳转桩；锚点不存在。
    - `R2`：旧锚点没有映射；映射目标不存在；映射目标是跳转桩。
    - `R3`：现行页出现历史图；档案网格出现现行图；历史图在网格里出现两次或缺席；档案页现行图的图注没有「现行：」。
    - `R4`：出现「本轮」「保留」「刀鞘」「<details>」各一例。另有例外样例：「历史档案」「抗锯齿」应通过。
    - `R5`：一页出现两次 X.Y.Z；文件名 `bunny-3.1.0-design-reference.zip` 不计入。
    - `R6`：`releaseReady: false` 出现零次、两次。
    - `R7`：图片地址不在任何清单里。
    - `R8`：缩略图源 sha 与清单不符。
    - `R9`：最新四条顺序错、图重复。
    - `R10`：「左腿」「右侧视图」应失败；「角色左腿」「画面左上方」「左右识别」应通过。
    - `R11`：SUN-05 图注写错；正面图图注含「后腰」；图注里的「侧面」前没写哪一侧。正文里的「刀身侧面厚度」应通过。
    - `R12a`：可见文字里有 `#fd6702`、`165 cm`、emoji `🐰`、不在允许集合的日期。
    - `R12b`：构建 CSS 里有 `#6551b9`。
    - `R13`：原稿出现两次，或带分组；只扫衣层页时，原稿 0 次应通过。
    - `R14`：缺状态文字。
    - `R15`：`<script src="https://…">`、CSS 里的 `url(https://…)`。
    - `R16`：搜「双手棍」结果来自现行页；跳转桩进了索引。现行页只含「双手」、被模糊匹配命中时，应通过。
    - `R5`：档案页页头之外的变更记录里写了 3.1.0。
    - `R7`：页面链接资料包 ZIP、`/catalog/bunny/3.1.0/*.json` 和两份清单时应通过。
    - `R7b`：资产图的 figure 缺 `data-asset-id`。
    - `R2`：跳转桩的 `meta refresh` 目标与映射表不一致。
    - `D4`：页面 `h1` 和 `READING_ORDER` 不一致；现行页出现「v2 · 身体」「v2 外观尺寸」。
    - `--pages` 只列衣层页时，R3 的档案覆盖、D3、R9 不报错。`--pending` 指向的页面缺锚点时，R1 不报错。
    - `D3`：下载内页漏了一张现行图；主页下载段只有 25 项。
    - `A5`、`D1`、`D2`：各一例。
- [ ] **Step 3：跑测试，确认先失败。**
  - 测试文件开头把仓库的 `tools/` 加进 `sys.path`，再导入 `site_check`。
  - Run：`python3 -m unittest discover -s test -p 'check_site_test.py' -v`
  - Expected：此时 `site_check` 还没写，报 ImportError。
- [ ] **Step 4：实现 `tools/site_check/`。** 规则细节如下。
  - **可见文字**：
    - 取页面 `<body>` 里的文本节点（跳过 `script`、`style`、`template`、`head`），再加上 `img[alt]`。
    - 计数和匹配前，先删掉网址、路径和文件名，判定式只认 ASCII：
      - 网址：`https?://[!-~]+`；
      - 路径：`(?<![A-Za-z0-9])/[A-Za-z0-9._~%/#-]+`；
      - 文件名：`[A-Za-z0-9._-]+\.(?:png|jpe?g|webp|svg|json|zip|pdf)`。
    - 「正面/侧面」「1.00 / 0.36」这类中文或带空格的斜杠不删，Step 2 各加一个样例。
  - **R4**：
    - 过程词、已取消名称、例外清单、编辑性断言（「最容易画错」「一眼就能认出」）都照设计文档 §4.10，逐字子串匹配。
    - 现行页不能出现 `<details>` 元素。
  - **D4**：
    - 现行页可见文字里不能有阶段标签，判定式 `(?<![A-Za-z])v\d+(?![\w.])`。网址和文件名已先删掉。
    - 每个 Bunny 页面 `.vp-doc` 里的第一个 `h1` 等于 K0 规定的页面名。
  - **R10**：每个「左」「右」字都必须落在下列片段之一里：`角色左`、`角色右`、`画面左`、`画面右`、`左右识别`、`左右翻看`、`左右键`、`左右肩宽`。
    - 适用范围：现行页；档案页的 `[data-changelog]`；档案页 `[data-archive-item]` 的图注。
  - **R11**：
    - 页面范围：现行页。档案页只查 SUN-05 结构稿的固定图注（见下）。
    - 只查视图名出现的位置：`figcaption`、`img[alt]`、`h1`–`h4`、`button` 和 `[role=tab]` 的文字、下载项名称。
    - 这些位置上的每个「侧面」，前面必须紧跟「角色左」「角色右」，或者是部件的侧面：前面紧跟「刃」「刀身」「护手」「柄」之一。
    - id 含 `front` 的资产，图注和 `alt` 不含「后腰」「交叉携行」。
    - `sun05-pose-structure-v1` 的图注：现行页上是「SUN-05 人体结构稿，手中为占位杆」，档案页上是「现行：SUN-05 人体结构稿，手中为占位杆」。
  - **R5**：
    - 现行页：可见文字里 `\d+\.\d+\.\d+` 最多一处，有的话只能是 `3.1.0`。
    - 档案页：页头（第一个 `h2` 之前）恰好一处 `3.1.0`；`[data-changelog]` 和 `[data-archive-item]` 图注里一处也没有。从旧页搬来的文字不查。
  - **R12a**：
    - 色值的判定式：`#[0-9a-fA-F]{3,8}\b`。
    - 允许出现的日期：2026-10-25、2026-10-26、2026-10-27、2026-10-28、2026-10-29。
    - 厘米数的判定式：`\d+(?:\.\d+)?\s*(?:cm|厘米|公分|mm|毫米)`。
  - **R12b**：构建出的 `dist/assets/*.css` 里不能有九个紫色值，大小写不敏感。
  - **R3 / R7 / R7b**：
    - 扫描范围：`img[src]`、`img[srcset]`、`source[srcset]`，以及 `a[href]` 中扩展名为 `.webp`、`.png`、`.svg`、`.jpg`、`.zip`、`.json` 的地址。页面链接不在范围内，由 R1 管。
    - R7 的允许集合：两份清单的资产（网页图、原图）、清单 `downloads` 里的资料包 ZIP、缩略图索引、19 张标尺 SVG、`docs/public/catalog/**` 下实际存在的 JSON（含两份清单和尺寸 JSON 的公开副本）。
    - 资产 id 取自 `data-asset-id`，以及 `/characters/<c>/<v>/<id>.webp`、`/media/<c>/<v>/<id>.png`、`/site/thumbs/<c>/<v>/<id>.webp` 三种地址。
    - 标尺 SVG 解出内嵌的 base64 图，按 sha256 在清单里找到来源资产，再看它的状态。
    - R7b：`figure.release-image` 里的图如果是清单资产，figure 必须带同一个 `data-asset-id`。这条保证资产图都经 `AssetImage` 渲染，名称取自名称表。
    - 档案页旧尺寸节里的图（含 `BodyProportionCompare` 的普通 `<img>`），说明从所在 `figure` 的 `figcaption` 读；`current-*` 图的说明必须以「现行：」开头。只出现在文字链接里的地址不查说明。
  - **R1**：`/media/` 下的链接按 `catalog/releases.json` 判是否存在，不看 dist（原图不在 dist 里）。
  - **R16**：用 `node tools/site_check/node_helper.mjs search <索引 js> <词>` 查询。
    - helper 加载 `minisearch`（vitepress 自带的依赖），参数同 VitePress：`fuzzy: 0.2, prefix: true, boost: {title: 4, text: 2, titles: 1}`。
    - 只算命中词以「双手棍」开头的结果：MiniSearch 结果的 `match` 里，至少有一个键以「双手棍」开头。模糊匹配只命中「双手」的结果不算。
    - 判定：这样的结果至少有一条，且全部来自 `/characters/bunny/archive`，标题路径的第一级是「历史档案」。
    - 索引的 `documentIds` 里不能有任何跳转桩路径。
  - **emoji**：用 `node_helper.mjs emoji` 从标准输入读文本，判定式是 `/\p{Emoji_Presentation}|\uFE0F/u`。
  - **R2**：
    - 对 `baseline-anchors.json` 里的每个「页面#id」：
      - 页面在新构建里是现行页，且 id 还在 → 通过；
      - 否则，`anchor-map.json` 的 `anchors` 必须有这一项，目标页面存在、目标 id 存在，且目标不是跳转桩。
    - 每个跳转桩都要有 `meta refresh`，目标落地；`meta refresh` 的地址、`[data-redirect-stub] a[href]`、`stubs[路径].target` 三者相等。
    - `anchors` 里不能有基线以外的键。
  - **D1**：
    - bunny/3.1.0 清单的每个资产，`review_status` 都匹配 `^(current|historical)-[a-z0-9_.-]+$`。
    - 三张新资产的 id、状态、尺寸、原图 md5 等于设计文档 §4.6 的表和 §4.5 给定的状态名。
    - `asset-names.json` 的键集合与清单相等，值都不为空。
  - **D3**：
    - 组按 `[data-download-group]` 的值认，顺序照 K10。组名：主页取根元素里的 `h3`，「下载」内页取根元素前面最近的 `h2`。
    - 主页下载段的组名、组序照 K10，资产项合计 26 个。
    - 「下载」内页的组名、组序照 K10。每个 `current-*` 资产恰好有一个资产项；没有非现行资产，也没有 `bunny-original`。
    - 「尺寸数据」组里能找到 `body-measurements`、`garment-dimensions` 两个 id。
- [ ] **Step 5：跑测试，确认通过。**
  - Run：`npm test`
  - Expected：全部通过，`check_site_test` 下每条规则的好、坏样例都通过。
- [ ] **Step 6：在改版前的构建上跑一次，确认它能判出现状的问题。**
  - Run：`npm run build && npm run check:site`
  - Expected：退出码 1，至少报出 R3、R4、R7b、R10、R14、D4 的问题。把各规则的条数记到 `/tmp/bunny_wiki/build/task0-baseline.txt`。
- [ ] **Step 7：交独立复核。** Claude 重跑 Step 3–6 的命令，核对 Step 2 的样例清单逐条有测试；再派一个 opus 子代理，对照设计文档 §4.10、§5 和本节审读检查脚本，只找漏判和误判。发现的问题交 Codex 改，改完再复核，通过后再进 Task 1。
- [ ] **Step 8：提交（Claude）。** 提交后这些文件即为受保护文件，后续每个任务验收时用 `git diff --quiet <本提交> -- tools/check-site.py tools/site_check test/check_site_test.py` 确认未被改动。
  ```bash
  git add tools/check-site.py tools/site_check test/check_site_test.py package.json
  git commit -m "test: add site checker for the Bunny wiki redesign"
  ```

### Task 1: 清单工具、审阅状态、中文名称、显示文字、三张新资产、缩略图（Codex 施工第 1 步，分 1a、1b 两段）

**Files:**
- Modify: `tools/build-local-catalog.py`、`catalog/bunny/3.1.0/source-map.json`
- Create: `test/build_local_catalog_test.py`、`tools/build-thumbs.py`、`test/build_thumbs_test.py`
- Create: `.release/bunny/3.1.0/{sun05-scene-final-v1,structure20-lineart-v1,sun05-pose-structure-v1}.png`（不进 git）、同名 `.webp`
- Create: `docs/.vitepress/data/bunny/asset-names.json`、`docs/.vitepress/data/bunny/display-text.json`、`docs/public/site/thumbs/**`
- 由工具重新生成：两份 `manifest.json`、`catalog/releases.json`、资料包 zip

**Interfaces:**
- Produces:
  - `build-local-catalog.py` 里的 `source_for(key: str, entry: dict | None, original_sha: str) -> dict` 和 `main() -> None`。
  - source-map 字段 `"no_baseline": true`。
  - 三张新资产的状态 `current-sun05-scene-final`、`current-structure20-lineart`、`current-sun05-pose-structure`。
  - `asset-names.json`、`display-text.json` 和缩略图索引，格式见上文。

**1a 段：工具重构和三张表的初稿**

- [ ] **Step 1：先写 `test/build_local_catalog_test.py`。** 用 `importlib.util.spec_from_file_location` 载入工具，断言：
  - `source_for('bunny/a.png', {'baseline_sha256': 'x', 'review_status': 'current-a'}, 'x') == {'kind': 'recovered-reference', 'baseline_sha256': 'x', 'review_status': 'current-a'}`；
  - 同一条目在 sha 为 `'y'` 时，`kind == 'revised-reference'`；
  - `source_for('bunny/a.png', {'no_baseline': True, 'review_status': 'current-a'}, 'y') == {'kind': 'local-design-revision', 'review_status': 'current-a'}`，输出里不带 `no_baseline`；
  - 以下情况都抛出 `ValueError`，错误信息含 `key`：`entry is None`；条目缺 `baseline_sha256` 且没有 `no_baseline`；条目里带 `kind`；`no_baseline` 与 `baseline_sha256` 同时出现。
  - 载入模块本身不执行构建，即不写任何文件。
- [ ] **Step 2：Run `python3 -m unittest discover -s test -p 'build_local_catalog_test.py' -v`。** Expected：FAIL。此时模块一载入就会执行整个构建，也找不到 `source_for`。
- [ ] **Step 3：重构 `build-local-catalog.py`。**
  - 顶层代码移进 `main()`，加 `if __name__ == '__main__': main()`。
  - `source_for` 按上面的断言实现。
  - 已有条目的输出字节与重构前完全一致，键的顺序仍是 `kind` 在前、条目字段在后。
- [ ] **Step 4：Run 同一测试。** Expected：PASS。再跑 `python3 tools/build-local-catalog.py; git status --short`。
  - Expected：工具报错退出，错误信息点名 `34-cuff-mechanism`、`35-lacing-thigh-motion`、`outfit-pose-current` 中的第一个。
  - 报错发生在写文件之前，`git status` 里只有工具和测试两处改动。1b 段补上条目后恢复。
- [ ] **Step 5：写归类表初稿。** 不改 `source-map.json`，只写表。
  - 范围：18 张没有状态的图（含 3 张没有条目的）、两张 `accepted-*`、4 张 `local-*`。
  - 两张 `accepted-*` 归历史，依据是 2026-10-28 已选定 SUN-05。
  - 规则照设计文档 §4.5：同部位已有现行图取代的，归历史；判不了的标「存疑」，给一个暂定值。
  - 状态名一律 `current-<slug>` 或 `historical-<slug>`；不动已有的 `current-*` 和 `historical-*`。
  - 写到 `/tmp/bunny_wiki/build/step1-classification.md`，列：资产 id、原状态、新状态、依据（引用现有页面原文或状态名）、存疑与否。
- [ ] **Step 6：写中文名称初稿。**
  - 给 bunny/3.1.0 的 180 个资产和三张新资产，加上 `bunny-original`，共 184 项，各写一个名称。
  - 现行图用检查条件事实表的叫法，加视图或图类词：正面 / 角色右侧面 / 背面 / 分件结构 / 细节 / 局部特写 / 部件。侧面图写明哪一侧，依据是状态名或现有页面原文；查不到的标「存疑」。
  - 历史图可取现有图注、`alt` 和状态名，可以有过程词和已取消名称。但它会成为档案网格的图注，所以左右同样写「角色左 / 角色右 / 画面左 / 画面右」，侧面写明哪一侧，不写 X.Y.Z 版本号。
  - 现行图名称必须符合设计文档 §4.10。另有三条固定要求：
    - `sun05-pose-structure-v1` 的名称就是「SUN-05 人体结构稿，手中为占位杆」；
    - id 含 `front` 的资产，名称不含「后腰」「交叉携行」；
    - 名称不写版本号。
  - 写到 `/tmp/bunny_wiki/build/asset-names.draft.json`，对照表写到 `/tmp/bunny_wiki/build/step1-names.md`，列：资产 id、名称、依据、存疑与否。
- [ ] **Step 7：写显示文字对照表初稿。**
  - 范围：两份尺寸 JSON（`catalog/bunny/3.1.0/body-measurements.json`、`garment-measurements.json`）里，在现行页上会显示的字符串。是否显示，按尺寸组件的现有渲染逻辑和 Step 5 的暂定归类判断。
  - 列出违反 §4.10 任一条的字符串，逐条给出改写，格式见上文的 `display-text.json`。
  - 另写 `@labels` 六项：尺寸组件写死的视角名。侧面写哪一侧，依据 `docs/characters/bunny/body-comparison.json` 等文件里写明的「角色右侧」和各图的记录；身体和服装的侧面若不是同一侧，分别写。
  - 写到 `/tmp/bunny_wiki/build/display-text.draft.json`，对照表写到 `/tmp/bunny_wiki/build/display-text.md`，列：文件、原文、改写、违反的是哪一条。
- [ ] **Step 8：停下复核。**
  - Claude 逐条复核三张表，改正后定稿。
  - 归类表和名称表里标为存疑的条目，汇总后交负责人，先用暂定值往下做。
  - 负责人答复之前，不做依赖这些条目的页面。Task 2 不依赖它们，可以先做。

**1b 段：写回、加资产、生成**

- [ ] **Step 9：写回定稿的三张表。**
  - 把归类表的新状态写进 `source-map.json`。3 张没有条目的图新建条目，标 `"no_baseline": true`。
  - 名称表存为 `docs/.vitepress/data/bunny/asset-names.json`，显示文字表存为 `docs/.vitepress/data/bunny/display-text.json`。
- [ ] **Step 10：加三张新资产。**
  - `cp -p` 三张原图到 `.release/bunny/3.1.0/`，文件名用设计文档 §4.6 的新名字，拷贝前后都核对 md5。
  - 用 Pillow 存同尺寸 WebP：`Image.open(png).save(webp, 'WEBP', quality=90, method=6)`，放在 `docs/public/characters/bunny/3.1.0/`。
  - 新增三个 source-map 条目，字段为：
    - `no_baseline: true`；
    - 给定的状态名；
    - 一句中文 `description`；
    - `source_artifact_path`，照现有条目的绝对路径写法；
    - `source_artifact_md5`。
- [ ] **Step 11：重新生成清单。**
  - Run：`python3 tools/build-local-catalog.py && node tools/release-catalog.mjs`
  - Expected：输出 `Catalog: 185 exact files` 和 `Release catalog valid: 185 listed assets.`。
  - 再跑一次生成工具，然后 `git status --short`。Expected：第二次运行后没有新的变化。
  - `cmp catalog/bunny/3.1.0/manifest.json docs/public/catalog/bunny/3.1.0/manifest.json`，origins 同样比一次。Expected：两份一致。
- [ ] **Step 12：先写 `test/build_thumbs_test.py`，再实现 `tools/build-thumbs.py [--check]`。**
  - 测试断言：
    - 1024×1536 的源图生成 480×720；1774×887 的源图生成 480×240，高度 = round(h × 480 / w)；
    - 宽度不足 480 的源图不放大；
    - 索引的 `sha256` 和 `sourceSha256` 正确；
    - `--check` 遇到索引过期、缩略图被改过、缺缩略图或多出缩略图，退出码都是 1。
  - 实现要点：
    - 源图是两份清单里每个资产的网页图；
    - 输出路径 `docs/public/site/thumbs/<c>/<v>/<id>.webp`，缩放用 `LANCZOS`，存图参数 `quality=82, method=6`，有透明通道的保留透明；
    - 生成后写索引。
  - Run：`python3 -m unittest discover -s test -p 'build_thumbs_test.py' -v`，然后 `python3 tools/build-thumbs.py && python3 tools/build-thumbs.py --check`。Expected：PASS，退出码 0。
- [ ] **Step 13：验收（由 Claude 重跑）。**
  - `npm test` → 通过。
  - `npm run build` → 通过。
  - `npm run check:local` → 通过。
  - `npm run check:release` → 失败，失败原因只来自发布闸门。
  - `python3 tools/check-site.py --rules A5,D1,D2,R7,R8` → 通过。
  - `git diff --quiet HEAD -- tools/check-site.py tools/site_check test/check_site_test.py` → 退出码 0。
- [ ] **Step 14：提交。**
  ```bash
  git add tools/build-local-catalog.py tools/build-thumbs.py test/build_local_catalog_test.py test/build_thumbs_test.py catalog docs/public/catalog docs/public/characters/bunny/3.1.0/*.webp docs/public/site docs/.vitepress/data/bunny
  git commit -m "feat: register Bunny scene, lineart and pose assets with review statuses and thumbnails"
  ```

### Task 2: 主题、配色、数据层、ReleaseImage 扩展、组件与布局（Codex 施工第 2 步）

**Files:**
- Create: `docs/.vitepress/theme/bunny-site.mjs`、`docs/.vitepress/data/bunny-site.data.mjs`、`docs/.vitepress/search-render.mjs`
- Test: `test/bunny-site.test.mjs`、`test/search-render.test.mjs`
- Create: `SiteLayout.vue`、`BunnyPage.vue`，以及"文件结构"里列出的 14 个组件
- Create: `docs/.vitepress/data/bunny/{home,changes,layers}.json`
- Modify: `ReleaseImage.vue`、`index.ts`、`style.css`、`config.mts`、`bunny-navigation.mjs`
- Delete: `EditorialLayout.vue`、`bunny-editorial.css`、`BunnyChapterHeader.vue`、`EditorialPair.vue`

**Interfaces:**
- Consumes：Task 1 的清单状态、`asset-names.json`、缩略图索引。
- Produces（都在 `bunny-site.mjs`，带 JSDoc 类型）：
  - `buildAssetIndex({ manifests, names, thumbs }) -> Record<string, AssetRecord>`
    - `AssetRecord = { id, collection: 'bunny/3.1.0'|'origins/1.0.0', status: string|null, name, web: {path,width,height,bytes}, original: {path,width,height,bytes}, thumb: {path,width,height} }`。
    - 缺名称、名称表多出未知 id、缺缩略图时，都抛 `Error`，错误信息含 id。
  - `assetById(index, id) -> AssetRecord`：未知 id 抛错。
  - `selectLatest(changes, count) -> Array<{date, title, asset, caption}>`：取 `latest` 非空的记录，按日期倒序、`order` 升序。
  - `resolveAnchorTarget(anchorMap, pathname, hash) -> string | null`：
    - 先把路径归一成基线键的形式：结尾的 `index` 或 `index.html` 去掉、保留前面的 `/`（`/characters/bunny/index.html` → `/characters/bunny/`）；其余页面去掉 `.html`；
    - 再解码 `hash` 的百分号编码；
    - 查 `anchors["<路径>#<id>"]`；
    - 是跳转桩而没有命中锚点时，返回 `stubs[路径].target`；
    - 其余返回 `null`。
  - `shouldRedirectForHash(hash, hasElement) -> boolean`：哈希非空，且页面上没有这个 id 时为真。
  - `readingNeighbors(path) -> { prev: {path,title}|null, next: {path,title}|null }`：顺序取 `bunny-navigation.mjs` 的 `READING_ORDER`。
  - `stepIndex(index, delta, count) -> number`：夹在 `[0, count-1]` 之间，不循环。
- `READING_ORDER`（`bunny-navigation.mjs` 导出）：每项是 `{ path, title }`，依次为：
  - `/characters/bunny/` Bunny
  - `/characters/bunny/body-base` 身体
  - `/characters/bunny/innerwear` 上衣与短裤
  - `/characters/bunny/hosiery` 袜装
  - `/characters/bunny/shoes` 鞋靴
  - `/characters/bunny/hands` 手部
  - `/characters/bunny/thigh-gear` 腿带
  - `/characters/bunny/jacket` 橙色夹克
  - `/characters/bunny/harness` 裤腰皮带
  - `/characters/bunny/headgear` 护目镜
  - `/characters/bunny/weapon` 双匕首
  - `/characters/bunny/dimensions` 图面尺寸
  - `/characters/bunny/visual-language` 画风与配色
  - `/characters/bunny/application` 使用检查
  - `/characters/bunny/downloads` 下载
  - `bunny-navigation.mjs` 只导出 `READING_ORDER`。删掉 `bunnySections`、`legacySections`、`findBunnySection`；它们只被 `config.mts` 的侧栏和要删掉的 `BunnyChapterHeader` 使用。
- `ReleaseImage` 新增 props：`thumb?: string`、`thumbWidth?: number`、`thumbHeight?: number`、`group?: string`、`assetId?: string`。
  - 页面上的图用 `thumb ?? src`。宽高：有缩略图时用缩略图的宽高，否则用 `width/height`。
  - 大图层仍是 `originalUrl || imageUrl`。
  - 分组行为照 K2、K3。
  - 左右键只在"适应屏幕"时翻页。
  - 关闭后焦点回到最初打开它的触发按钮。
- `AssetImage` props：`{ id: string; caption?: string; detail?: string; group?: string; useThumb?: boolean }`。
  - 查 `assetById` 后传给 `ReleaseImage`：`alt` 和 `caption` 默认用中文名称，`assetId = id`。
  - `id === 'bunny-original'` 且传了 `group` 时，抛错。
- 布局 `BunnyPage`，在 `index.ts` 里全局注册。读取的 frontmatter：
  - `bunny: home|layer|reference|archive|stub`；
  - `layer`：层号，只用于衣层页；
  - `category`：类别，只用于参考页；
  - 各种页面的输出（`.vp-doc` 照 K0）：
    - `home` 和 `archive`：整宽的 `.vp-doc` 包住 `<Content/>`；
    - `layer`：左侧 `LayerCard`，右侧 `.vp-doc` 包住 `<Content/>`，下面是 `PagePager`；
    - `reference`：左侧 `ReferenceCard`（类别 + `page.headers` 目录），右侧 `.vp-doc` 包住 `<Content/>`，下面是 `PagePager`；
    - `stub`：渲染 `RedirectStub`。目标和标题从 `anchorMap.stubs[当前路径]` 读。挂载后按 `resolveAnchorTarget(anchorMap, location.pathname, location.hash)` 立即 `location.replace`；没有脚本时由 `meta refresh` 兜底。
- `LayerCard`：
  - 依次显示：大号层号、页名、「第 N 层，共 0 到 8 层」、0–8 层的格子、3–4 行事实、「左右识别」。
  - 九个格子都是链接，当前层带 `aria-current="page"`。
  - 宽屏固定在左侧，≤ 760 px 时收成页顶的一条。
- `ReferenceCard`：显示类别和本页 `h2` 目录，不显示层号；窄屏行为同 `LayerCard`。
- `CharacterHero`：桌面端图框比例和图片相同，不裁切；≤ 760 px 时按 Step 7 的 4:3 取景。
- `index.ts` 全局注册 `BunnyPage`，以及 markdown 里会直接写的组件：`AssetImage`、`OriginNote`、`LayerStrip`、`CharacterHero`、`LatestList`、`ChapterBar`、`ArchiveGrid`、`ChangelogTable`、`DownloadList`、`ReleaseImage`、`BodyMeasurements`、`GarmentMeasurements`、`BodyProportionCompare`。
- `SiteLayout`：包 `DefaultTheme.Layout`，里面挂 `AnchorFallback`。它在首次挂载和每次路由变化后，按 `resolveAnchorTarget` 和 `shouldRedirectForHash` 决定是否用 `location.replace` 跳走。
- `createSearchRender({ archive, names, changes }) -> (src, env, md) => string`（`search-render.mjs`）。`config.mts` 在载入时用 `fs` 读这三份 JSON，调用它，把返回的函数设为 `search.options._render`。返回的函数按下面的顺序做，顺序不能换：
  1. `env.relativePath === 'characters/bunny/archive.md'` 时，把 `<ArchiveGrid group="x" />` 换成该组各图的「名称 · 日期 · 已改为…」纯文本段落，把 `<ChangelogTable />` 换成各条改动的纯文本段落；
  2. `const html = md.render(src, env)`；
  3. `env.frontmatter?.search === false` 时返回 `''`。VitePress 1.6.4 传进来的 `env` 只有 `path`、`relativePath`、`cleanUrls`，`frontmatter` 要等 `md.render` 之后才有；
  4. 返回 `html`。
- `config.mts` 的 `transformPageData`：`bunny: stub` 的页面，按 `anchor-map.json` 的 `stubs[路径]` 往 `frontmatter.head` 里加 `meta refresh`，见 K8。
- `config.mts` 读数据文件时，文件还不存在就用空结构：`archive.json` → `{ "groups": [] }`，`anchor-map.json` → `{ "stubs": {}, "anchors": {} }`，`changes.json` → `[]`。这两份要到 Task 3、Task 6 才写，Task 2 的构建不能因此失败。

- [ ] **Step 1：先写 `test/bunny-site.test.mjs`。** 用 `node:test` 和 `node:assert/strict`，断言：
  - `buildAssetIndex`：读仓库里的两份清单、`asset-names.json` 和缩略图索引。正常时 `sun05-scene-final-v1` 的 `web.width === 1774`，`thumb.width === 480`；从名称表删掉一项后抛错，信息含该 id。
  - `assetById(index, 'no-such-id')` 抛错。
  - `selectLatest(changes, 4)`：用测试里写的八条记录作夹具，日期、`order` 和 `latest` 标题照设计文档 §4.2、§4.4，返回 `[['2026-10-29','场景图定稿'],['2026-10-28','STRUCTURE20 线稿通过'],['2026-10-28','SUN-05 冲刺姿势选定'],['2026-10-27','后腰交叉携行三视']]`。
  - `resolveAnchorTarget`：
    - `('/characters/bunny/face.html', '#%E5%A4%B4')` 能查到映射；
    - `('/characters/bunny/index.html', '#%E6%9C%AC%E8%BD%AE%E8%A1%A5%E5%85%85')` 命中键 `/characters/bunny/#本轮补充`；
    - `('/characters/bunny/face', '')` 返回跳转桩的目标；
    - `('/characters/bunny/jacket', '#jacket-wearing')` 在没有映射时返回 `null`。
  - `shouldRedirectForHash('#x', false) === true`；`shouldRedirectForHash('', false) === false`。
  - `stepIndex(0, -1, 3) === 0`；`stepIndex(2, 1, 3) === 2`。
  - `readingNeighbors('/characters/bunny/jacket')`：`prev.path` 为 thigh-gear，`next.path` 为 harness。
- [ ] **Step 2：先写 `test/search-render.test.mjs`。** 用 `import { createMarkdownRenderer } from 'vitepress'` 生成真实的 `md`，`env` 只传 `{ relativePath }`。断言：
  - 夹具 `archive = { groups: [{ id: 'staff', title: '双手棍', items: [{ asset: 'staff-v2-held-v1', date: '2026-10-26', replacedBy: '双匕首' }] }] }`、`names = { 'staff-v2-held-v1': '双手棍持握' }`，档案页源文里有 `<ArchiveGrid group="staff" />` 时，输出含「双手棍」和「双手棍持握」；
  - 源文以 `---\nsearch: false\n---` 开头时输出空串。
- [ ] **Step 3：Run `node --test test/bunny-site.test.mjs test/search-render.test.mjs`。** Expected：FAIL，此时模块还不存在。
- [ ] **Step 4：实现 `bunny-site.mjs`、`search-render.mjs` 和数据加载器。**
  - 加载器用 `defineLoader`，默认导出是 VitePress 的要求。
  - 加载器读取：两份清单、`asset-names.json`、缩略图索引，以及 `docs/.vitepress/data/bunny/` 下全部 JSON。
  - 返回 `{ assets, home, changes, layers, downloads, archive, anchorMap, displayText }`，其中 `assets` 是 `buildAssetIndex` 的结果。还没写的数据文件，按空结构处理。
- [ ] **Step 5：Run 同上。** Expected：PASS。
- [ ] **Step 6：写数据文件。**
  - `changes.json` 写八条，内容照设计文档 §4.4 和 §4.2：
    - `latest` 的四条照 §4.2。第 3 条的 `caption` 为「SUN-05 人体结构稿，手中为占位杆」。
    - `log` 的配图照效果图 A 档案页，`log.caption` 照效果图 A，再按 §4.10 改：「橙色外套」改「橙色夹克」，「左袖袋」改「角色左袖袋」。
  - `home.json`：照效果图 A 的 `#home` 首屏取文字，按 §4.10 改。
    - `chapters` 七项的 id 依次是 `identity`、`body`、`layers`、`expressions`、`weapon`、`action`、`downloads`，和 Task 3 的主页锚点一致；
    - 「左腿袜」改「角色左腿袜」；
    - 三视里的「侧面」改「角色右侧面」，前提是状态名写明右侧；
    - 光写成「画面左上方的日光」。
  - `layers.json`：
    - 正面图照效果图 A 的衣层条；侧面、背面取各内页现有的现行三视；
    - 第 5 层名称为「腿带」，第 6 层为「橙色夹克」；
    - `summary` 照效果图 A 衣层条的小字，按 §4.10 改左右写法；
    - `facts` 和 `leftRight` 照效果图 A `#inner` 的写法，取材限检查条件事实表。左右写法按 §4.10 改写，不照搬效果图 A。
    - `leftRight` 照设计文档 §4.3 的例句写法，例如夹克：「OG 标志在角色左臂。正面图里它在画面右边，背面图里在画面左边。」
    - 效果图 A 衣层条底注「左右一律以角色自身为准…」改成：「「角色左 / 角色右」指角色自身，「画面左 / 画面右」指图面方向。」
- [ ] **Step 7：实现组件、布局、`ReleaseImage` 扩展和配色。**
  - 视觉取值照效果图 A 的 CSS（`/Users/roy/Developments/x_ops/output/bunny-wiki-mock-20261029/mock/a/index.html`），做成 `style.css` 里的 `--bunny-*` 变量。
  - `--vp-c-brand-1: #fd6702`；`--vp-c-brand-2: #ca2f2f`；`--vp-c-brand-3: #242424`；`--vp-c-brand-soft: rgba(253,103,2,.14)`。
  - `--vp-button-brand-*`：底色 `#242424`，悬停和按下用 `#ca2f2f`，文字 `#ffffff`。
  - 字体 `"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`。
  - Bunny 页里的正文链接照效果图 A：文字色同正文，下划线橙色，粗 2px，下移 3px。
  - 删掉九个紫色值和无用规则，`theme-color` 改为 `#ffffff`。
  - ≤ 760 px 时，首屏图框改为 4:3，`object-fit: cover; object-position: 42% 40%`。
  - 定义 `.bunny-sr-only`：标准的视觉隐藏写法（`position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;`），供 K0 的隐藏 `h1` 用。
- [ ] **Step 8：改 `config.mts`。**
  - 顶栏改为：`Bunny`（`/characters/bunny/`，`activeMatch: '^/characters/bunny/(?!downloads|archive)'`）、`下载`（`/characters/bunny/downloads`）、`历史档案`（`/characters/bunny/archive`）、`通用规范`（`/standards/`）。
  - 删掉 `/characters/` 侧栏，保留 `/standards/` 侧栏。
  - 设 `search.options._render` 为 `createSearchRender(...)` 的结果。
  - 加 `transformPageData`，照 K8 给跳转桩注入 `meta refresh`。
- [ ] **Step 9：验收（由 Claude 重跑）。**
  - `npm test`、`npm run build`、`npm run check:local` → 全部通过。
  - `python3 tools/check-site.py --rules R12b,R15` → 通过。这一步只要求 CSS 里没有紫色、全站不加载外部资源；页面文字留到后面的任务。
  - 检查脚本保护文件的 `git diff --quiet` → 退出码 0。
  - 组件的浏览器实测放到 Task 3，在主页上做。
- [ ] **Step 10：提交。**
  ```bash
  git add -A docs/.vitepress
  git commit -m "feat: add Bunny page layout, data layer, grouped lightbox and brand theme"
  ```

### Task 3: 角色主页与历史档案（Codex 施工第 3 步）

**Files:**
- Modify: `docs/characters/bunny/index.md`（整页重写）
- Create: `docs/characters/bunny/archive.md`、`docs/.vitepress/data/bunny/archive.json`、`downloads.json` 的 `home` 部分
- Modify: `docs/characters/bunny/{body-comparison,body-style-comparison,body-bra-comparison}.json`（只改 candidate 的 `label`）

**Interfaces:**
- Consumes：Task 2 的组件和数据层。
- Produces：
  - 主页锚点：`#identity`、`#body`、`#layers`、`#expressions`、`#weapon`、`#action`、`#downloads`。
  - 档案页锚点：`#changelog`、`#superseded`、`#archive-<组 id>`（每组一个）、`#old-dimensions`、`#archive-rules`。
  - 这些锚点供 Task 6 的映射使用。

- [ ] **Step 1：重写 `index.md`。**
  - frontmatter：
    ```yaml
    title: Bunny
    layout: BunnyPage
    bunny: home
    sidebar: false
    aside: false
    releaseReady: false
    ```
  - 结构：`# Bunny {.bunny-sr-only}`（见 K0），`<CharacterHero />`、`<LatestList />`、`<ChapterBar />`，然后七个 `##` 段，各带上面的锚点。
  - 段落内容照效果图 A `#home`。图一律用 `<AssetImage>`，原稿用 `<OriginNote />`，衣层条用 `<LayerStrip />`，下载段用 `<DownloadList set="home" />`。
  - 头身比例尺框、刃长条和场景两组事实，照效果图 A 做成本页内的 HTML。
  - 文字按 §4.10 改，正面图图注不写「后腰」。
- [ ] **Step 2：写 `downloads.json` 的 `home` 部分。** 照效果图 A 的 26 项和六组；资料包 ZIP 链接由 `DownloadList` 固定加在末尾。
- [ ] **Step 3：写 `archive.md` 和 `archive.json`。**
  - frontmatter：`layout: BunnyPage`、`bunny: archive`、`title: 历史档案`、`sidebar: false`、`aside: false`。
  - 页头：正文第一行是 markdown 的 `# 历史档案`，不由组件输出，搜索的标题路径靠它。版本、状态、最近更新照效果图 A，写在它和第一个 `##` 之间。
  - `## 已取代的设计稿` 和各组的 `### 组名` 都写在 markdown 里，不由组件渲染。
  - 正文依次是：`## 变更记录 {#changelog}` 加 `<ChangelogTable />`；`## 已取代的设计稿 {#superseded}`，下面每组一个 `### 组名 {#archive-<id>}`，后接 `<ArchiveGrid group="<id>" />`，再接从旧页搬来的文字；`## 旧尺寸 · 历史 {#old-dimensions}`；`## 归档规则 {#archive-rules}`。
  - 分组：按 `review_status` 和部位分组，把状态到组的对照写进 `archive.json`；每张 `historical-*` 图恰好进一组。
    - 这几组的 id 固定：`staff`（双手棍）、`saw`（锯）、`obsidian-sword`（黑曜石大剑）、`torso-straps`（躯干吊带）、`pose-ab`（姿势方案 A / B）。其余组的 id 由 Codex 定，写进 `archive.json`。
  - 搬来的文字：
    - 来源：`saw.md`、`weapon-history.md`、各页 `<details>` 里的文字，以及各页中描述已归为历史的图或设计的段落，不管在不在 `<details>` 里。至少包括：
      - `assembled.md` 的双持姿势方案 A / B 段 → `pose-ab` 组；
      - `body-base.md` 的「原01身体三视 · 沿革参考」「原01人物尺寸板」和三段比例对照的说明文字 → `#old-dimensions`；
      - `application.md`、`index.md` 的「此前穿戴动作补图」段 → 对应组。
    - `dimensions.md` 里的旧尺寸段（耳部与发色修订前、完整新绘前基础文胸、此前运动款、原01，以及旧武器尺寸）按原样搬：说明文字和 JSON、SVG 链接都保留。身体和服装的旧尺寸进 `#old-dimensions`，旧武器尺寸进对应的武器组。
    - 原样搬进对应组，去掉其中的图片标签；需要时链接到本组网格里的图。
    - 搬来的标题一律降到 `####` 及以下，不保留 `#`、`##`、`###`。
    - 文字里链接的地址改成新位置，链接文字不改。
    - 这里只是复制。源页上的这些段落，在 Task 4、Task 5 改写各页时删去。
  - 每张图的「日期」和「已改为」照 §4.10 取材；没有记录的写「—」。
  - 旧尺寸节：
    - 放原有的三个 `BodyProportionCompare`。它们的 candidate 一侧是现行图，把 `docs/characters/bunny/body-comparison.json`、`body-style-comparison.json`、`body-bra-comparison.json` 里 candidate 的 `label` 改成「现行：…」开头。这三个文件不在冻结名单里。
    - 服装尺寸的档案版到 Task 5 加了 `scope` 之后再放进来。
    - 节根元素带 `data-archive-measurements`。
- [ ] **Step 4：验收（由 Claude 重跑）。**
  - `npm test`、`npm run build`、`npm run check:local` → 全部通过。
  - 下面的命令 → 通过：
    ```bash
    python3 tools/check-site.py --rules R1,R3,R4,R5,R6,R7,R7b,R9,R10,R11,R12a,R13,R14,D3,D4 --pages /characters/bunny/ /characters/bunny/archive --pending /characters/bunny/body-base /characters/bunny/innerwear /characters/bunny/hosiery /characters/bunny/shoes /characters/bunny/hands /characters/bunny/thigh-gear /characters/bunny/jacket /characters/bunny/harness /characters/bunny/headgear /characters/bunny/weapon /characters/bunny/dimensions /characters/bunny/visual-language /characters/bunny/application /characters/bunny/downloads
    ```
  - 搜索规则 R16 这时还不跑：旧内页里还有「双手棍」，要到 Task 6 全量检查时才能通过。
  - 内置浏览器在 1440×900 下测 A8，在 375×812 下测 A9 的主页部分，再测 A10（主页的分组、原稿、Esc、点背景、焦点）。
  - 检查脚本保护文件的 `git diff --quiet` → 退出码 0。
- [ ] **Step 5：提交。**
  ```bash
  git add docs/characters/bunny/index.md docs/characters/bunny/archive.md docs/characters/bunny/*-comparison.json docs/.vitepress/data/bunny
  git commit -m "feat: rebuild the Bunny character home and add the history archive"
  ```

### Task 4: 九个衣层内页（Codex 施工第 4 步，前半）

**Files:**
- Modify: `docs/characters/bunny/{body-base,innerwear,hosiery,shoes,hands,thigh-gear,jacket,harness,headgear}.md`

**Interfaces:**
- Consumes：`LayerCard`（读 `layers.json`）、`AssetImage`、`PagePager`。
- Produces：各页 `## 穿着三视 {#wearing}`、`## 分件结构 {#construction}`、`## 细节 {#details}` 三个锚点；原有现行小节的锚点保持不变。

- [ ] **Step 1：逐页改写。**
  - frontmatter：`layout: BunnyPage`、`bunny: layer`、`layer: <n>`、`title: <层名>`、`sidebar: false`、`aside: false`。正文第一行 `# <层名>`，层名照 `READING_ORDER`。
  - 正文依次是：「穿着三视」（正面、角色<左|右>侧面、背面，组名 `layer-<n>`），「分件结构」，「细节」。三段之后放原页现有的现行小节，比如腿带的屈髋关系、鞋带收纳。
  - 只用 `current-*` 图。`<details>` 全部删掉，其内容已在 Task 3 迁进档案。
  - 文字：
    - 保留的现行文字按 §4.10 删过程句和已取消名称、改左右写法；与事实表冲突的按事实表改。
    - 每处改写记到 `/tmp/bunny_wiki/build/rewrites.md`，按「页面 | 原句 | 新句 | 原因」四栏。
  - `body-base`：比例比较组件已迁进档案，本页不再放。
  - `harness`：页面标题为「裤腰皮带」。
  - `headgear`：页面标题为「护目镜」。
  - 原有标题改名时，含 `h1`，在新标题处加 `<span id="<旧 slug>"></span>`，保住旧锚点。
  - Task 3 已复制进档案的段落，从本页删去。
  - 站内链接照全局约束，只指向改版后的位置。指向 5 个参考页时，只用 Task 5 Interfaces 列出的锚点，或者不带锚点。
- [ ] **Step 2：验收（由 Claude 重跑）。**
  - `npm test`、`npm run build` → 通过。
  - 下面的命令 → 通过：
    ```bash
    python3 tools/check-site.py --rules R1,R3,R4,R5,R7,R7b,R10,R11,R12a,R13,D4 --pages /characters/bunny/body-base /characters/bunny/innerwear /characters/bunny/hosiery /characters/bunny/shoes /characters/bunny/hands /characters/bunny/thigh-gear /characters/bunny/jacket /characters/bunny/harness /characters/bunny/headgear --pending /characters/bunny/weapon /characters/bunny/dimensions /characters/bunny/visual-language /characters/bunny/application /characters/bunny/downloads
    ```
  - Claude 逐页对照检查条件事实表（`/Users/roy/Developments/x_ops/output/bunny-wiki-mock-20261029/mock/checks.md`），审读保留的现行文字和 `rewrites.md`。冲突处记到 `/tmp/bunny_wiki/build/fact-conflicts.md`，按「页面 | 原文 | 事实表 | 改法」四栏，由 Codex 照改。
  - 内置浏览器在 1440 和 375 下抽看 jacket、hands、thigh-gear 三页，对照效果图 A 的 `#inner`。
  - 检查脚本保护文件的 `git diff --quiet` → 退出码 0。
- [ ] **Step 3：提交。**
  ```bash
  git add docs/characters/bunny
  git commit -m "feat: rewrite the nine Bunny layer pages on the layer template"
  ```

### Task 5: 双匕首、图面尺寸、画风与配色、使用检查、下载（Codex 施工第 4 步，后半）

**Files:**
- Modify: `docs/characters/bunny/{weapon,dimensions,visual-language,application,downloads,archive}.md`、`BodyMeasurements.vue`、`GarmentMeasurements.vue`
- Modify: 在 `downloads.json` 补上 `page` 部分；`display-text.json` 只在发现漏项时补

**Interfaces:**
- Produces：
  - 两个尺寸组件的 prop `scope: 'current' | 'archive'`，默认 `'current'`。
  - `current` 只显示网页图为 `current-*` 的来源；`archive` 只显示其余来源。
- 锚点：
  - `weapon` 页分 `## 武器设计 {#design}`、`## 持握与后腰交叉携行 {#carry}`、`## 持刀表情 {#held-expressions}` 三段；
  - `dimensions` 页分 `## 身体尺寸 {#body-dimensions}`、`## 服装尺寸 {#garment-dimensions}`、`## 武器尺寸 {#weapon-dimensions}` 三段；
  - `downloads` 页的「尺寸数据」组含 `#body-measurements`、`#garment-dimensions` 两个锚点。

- [ ] **Step 1：改尺寸组件。**
  - 外壳文字改成现行写法，两处 `<details>` 改成普通段落。
  - 加 `scope` 过滤：来源图的状态从 `assets` 查。过滤后没有任何来源时，组件什么都不渲染。
  - 渲染 JSON 里的每个字符串前，先查 `display-text.json`。
  - 视角名在 Vue 外壳里按 `@labels` 换写法。`body-measurements.mjs`、`garment-measurements.mjs` 的任何字符串都不改，否则标尺 SVG 会字节漂移。由这两个模块拼出、含视角名的字符串，在外壳里替换视角名那一段。
  - 几何、SVG 和数据文件都不动。
  - 「未取点显示为 —、不给厘米」「近似取点 / 可见取点 / 不赋值」照旧保留。
  - `scope="archive"` 而过滤后没有带标尺的来源时，不渲染"原图标尺与偏差核对"整块（视角按钮、标尺图、单图读数、取点定义），也不读取 `current`；只渲染固定设计尺寸表和"同一尺寸跨图核对"表，表里列出全部非现行来源。`GarmentMeasurements` 的档案版就是这种情况：16 个非现行来源都没有标尺（2026-10-29 核实）。
  - 在 `archive.md` 的旧尺寸节里，用 `<script setup>` 导入下列 JSON，依次放：
    - `<BodyMeasurements :data="freshCelV1" scope="archive" />`，数据 `catalog/bunny/3.1.0/body-measurements-fresh-cel-v1.json`：过滤后只剩正面（`body-v2-fresh-cel-front-v1`，历史），侧面、背面是现行图，被滤掉；
    - `<BodyMeasurements :data="basicBraV1" scope="archive" />`，数据 `body-measurements-basic-bra-v1.json`：三视都是历史；
    - `<BodyMeasurements :data="sportsV1" scope="archive" />`，数据 `body-measurements-sports-v1.json`：用组件默认的 `body-v2-full-*-v1`，三视都是历史；
    - `<GarmentMeasurements :data="garments" scope="archive" />`，数据 `garment-measurements.json`。
  - 原01 没有组件数据，保留 Task 3 搬来的文字记录。各组件旁放 Task 3 搬来的对应说明文字。
  - 不放 `body-measurements.json` 的档案版：它三个视角的来源都是现行图（2026-10-29 核实）。
- [ ] **Step 2：核对显示文字表。**
  - `display-text.json` 已在 Task 1 定稿。组件接上后，如果现行页上还露出违反 §4.10 的 JSON 字符串，补进表里。
  - 补的条目在 `/tmp/bunny_wiki/build/display-text.md` 末尾单列一节「Task 5 新增」，供 Claude 复核。
- [ ] **Step 3：改写五页。**
  - frontmatter：`layout: BunnyPage`、`bunny: reference`、`category: <武器|尺寸|画风|检查|下载>`、`title`、`sidebar: false`、`aside: false`。正文第一行 `# <页面名>`，页面名照 `READING_ORDER`：双匕首、图面尺寸、画风与配色、使用检查、下载。
  - 原有标题改名时，含 `h1`，在新标题处加 `<span id="<旧 slug>"></span>`。Task 3 已复制进档案的段落，从本页删去。
  - 站内链接照全局约束，只指向改版后的位置。
  - `weapon`：分三段，依次是武器设计、持握与后腰交叉携行（吸收 `assembled` 的现行内容）、持刀表情。
  - `application`：改掉左右侧装备一节里关于刀鞘的矛盾，以 `weapon.md` 的无鞘写法为准。
  - `downloads`：
    - 用 `<DownloadList set="page" />`；
    - 分组和组 id 照 K10，加「尺寸数据」组：19 张标尺里来源为现行的那些、尺寸 JSON 的公开副本、两份清单；
    - 下载项名称不写版本号；
    - 每个 `current-*` 资产恰好出现一次；
    - 原稿不进列表。
  - 改写记录照 Task 4 写进 `rewrites.md`。
- [ ] **Step 4：验收（由 Claude 重跑）。**
  - `npm test`、`npm run build` → 通过。
  - `npm run check:local` → 通过，9 张标尺 `--check` 无漂移。
  - 下面的命令 → 通过：
    ```bash
    python3 tools/check-site.py --rules R3,R4,R5,R7,R7b,R10,R11,R12a,R13,D2,D3,D4 --pages /characters/bunny/weapon /characters/bunny/dimensions /characters/bunny/visual-language /characters/bunny/application /characters/bunny/downloads
    ```
  - 档案页也重查一次，因为本任务改了它和尺寸组件：
    ```bash
    python3 tools/check-site.py --rules R3,R5,R7,R7b,R10,R11,D4 --pages /characters/bunny/archive
    ```
  - Claude 在内置浏览器里看档案页旧尺寸节：服装尺寸只出两张表，跨图核对表的来源行数等于非现行来源数（现为 16）；三个身体尺寸组件各出标尺。
  - 对所有改写过的页面重跑 R1，不带 `--pending`：
    ```bash
    python3 tools/check-site.py --rules R1 --pages /characters/bunny/ /characters/bunny/archive /characters/bunny/body-base /characters/bunny/innerwear /characters/bunny/hosiery /characters/bunny/shoes /characters/bunny/hands /characters/bunny/thigh-gear /characters/bunny/jacket /characters/bunny/harness /characters/bunny/headgear /characters/bunny/weapon /characters/bunny/dimensions /characters/bunny/visual-language /characters/bunny/application /characters/bunny/downloads
    ```
  - Claude 照 Task 4 的做法，逐页对照事实表审读这 5 页，冲突处记进 `fact-conflicts.md`，由 Codex 照改。
  - 检查脚本保护文件的 `git diff --quiet` → 退出码 0。
- [ ] **Step 5：提交。**
  ```bash
  git add docs
  git commit -m "feat: rewrite Bunny weapon, dimensions, style, usage and downloads pages"
  ```

### Task 6: 跳转桩、锚点映射、站点首页、通用规范、README（Codex 施工第 5–6 步）

**Files:**
- Modify: 14 个跳转桩的 md、`docs/index.md`、`docs/standards/index.md`、`README.md`
- Modify（只为让全量检查通过）：`docs/characters/bunny/*.md`、Task 2–5 写的组件和数据文件。每处改动记到 `/tmp/bunny_wiki/build/task6-fixes.md`，写明属于哪个任务的产物、为什么改。
- Create: `docs/.vitepress/data/bunny/anchor-map.json`

- [ ] **Step 1：写锚点映射。**
  - 对 `tools/site_check/baseline-anchors.json` 里，凡是在新构建原位置找不到的「页面#id」，各写一条去向。去向只有三种：原页、新位置的别名 id、档案页对应段。
  - `stubs` 写 14 个跳转桩的默认目标和目标标题：
    - `face` → `/characters/bunny/#identity`
    - `expressions` → `/characters/bunny/#expressions`
    - `assembly` → `/characters/bunny/#layers`
    - `assembled` → `/characters/bunny/weapon#carry`
    - `saw` → `/characters/bunny/archive#archive-saw`
    - `weapon-history` → `/characters/bunny/archive#archive-saw`
    - 8 个旧桩各指向内容最接近的位置。
  - 映射表另存 `/tmp/bunny_wiki/build/anchor-map.md`，供 Claude 复核。
  - Claude 在 Step 6 验收时逐条复核，复核通过才提交。跳转桩和锚点兜底都在运行时读这张表，复核后的改动只落在 `anchor-map.json`，页面不用返工。
- [ ] **Step 2：改写 14 个跳转桩。** 照 K8，frontmatter 只设 `layout: BunnyPage`、`bunny: stub`、`search: false`，正文为空。目标、标题和 `meta refresh` 都来自映射表。
  - `downloads` 页基线里的 26 个旧锚点，按内容分三类：
    - 现行内容（如 `layer1-assets`、`jacket-assets`）→ K10 对应的 `dl-*` 组 id；
    - 历史内容（如 `staff-assets`、`obsidian-sword-assets`、`before-clean-cel-assets`、`before-ear-hair-assets`、`before-fresh-body`、`sports-body-history`，以及「此前吊带与固定点原件」等标题锚点）→ 档案页对应组 `#archive-<id>`，旧尺寸类 → `#old-dimensions`；
    - `body-measurements`、`garment-dimensions` 和改名标题的旧 slug 留在原页，不写映射。
    - `anchor-map.md` 按这三类分节列出。
- [ ] **Step 3：改站点首页。**
  - `docs/index.md` 的标语改为「Bunny 3.1.0 本地修订 · 身份、衣层、武器与场景参考」。
  - 配色随主题变化，结构不改。
- [ ] **Step 4：改 `docs/standards/index.md`。** 只改违反 §4.10 的字句，例如「保留在对应白皮书中」改「放在对应白皮书中」，不填内容。
- [ ] **Step 5：改 README。**
  - 删掉「身体比例修订状态」「本轮修订边界」两段和写死的页数。
  - 写明新结构：主页、内页、档案、跳转桩。
  - 加 `npm run check:site` 的用法。
  - 运行方式和发布边界原样保留。
- [ ] **Step 6：验收（由 Claude 重跑）。**
  - `npm test`、`npm run build`、`npm run check:local` → 通过。
  - `npm run check:site`（全部规则、全部页面）→ 通过。
  - Claude 复核 `anchor-map.md`，逐条点开目标位置核对。
  - 检查脚本保护文件的 `git diff --quiet` → 退出码 0。
- [ ] **Step 7：提交。**
  ```bash
  git add docs README.md
  git commit -m "feat: redirect retired Bunny pages and anchors, refresh home tagline and README"
  ```

### Task 7: 全量验收与对照板（Claude）

- [ ] **Step 1：命令类验收。** 依次跑，原始输出存到 `/tmp/bunny_wiki/build/final/`：
  - `npm test`
  - `npm run build`
  - `npm run check:local`
  - `npm run check:release`：必须失败。
  - `node tools/release-catalog.mjs`：输出 `Release catalog valid: 185 listed assets.`。
  - `npm run check:site`
  - `python3 tools/build-local-catalog.py && git status --short`：git 无变化。
  - 两份清单各 `cmp` 一次：一致。
  - `grep -c '"contentReady": false' catalog/releases.json`：输出 `1`。
  - `git diff codex/bunny-design-repair --stat -- worker wrangler.jsonc package-lock.json`：为空。
  - `git diff codex/bunny-design-repair -- package.json`：只多一行 `check:site`。
- [ ] **Step 2：浏览器验收。** 用 `python3 tools/local-preview.py --port 4173` 起本地站，只用内置浏览器：
  - **A8**：1440×900 主页首屏，用 DOM 量测。信息框、最新四条、章节条的底边都 ≤ 900；`--vp-c-brand-1/2/3` 的计算值属于 `{#fd6702, #ca2f2f, #242424}`。
  - **A9**：375×812 下逐页量 `scrollWidth ≤ clientWidth`，覆盖全部 Bunny 页面。
    - 主页大图顶边要在首屏内。
    - 人物包围框按场景定稿原图坐标量好：x 290–1430、y 16–874（原图 1774×887）。在 4:3 取景里，露出的面积至少 90%。
  - **A10**：
    - 主页衣层条依次验：翻页、计数、左右键只在"适应屏幕"时翻页、Esc、点背景、焦点回到最初那张。
    - 单图依次验：原始尺寸切换、查看原图链接。
    - 读代码确认原生 dialog 的 Esc 路径。
  - **A11**：至少验 5 个旧 URL#锚点：两个跳转桩带中文锚点、一个现行页里已迁走的锚点、一个 `.html` 后缀，再做一次站内单页跳转。
    - 站内单页跳转：站内没有指向已迁走锚点的链接，所以用 `preview_eval` 调 VitePress 路由跳到「现行页#已迁走锚点」，确认路由变化后 `AnchorFallback` 执行了 `location.replace`。
- [ ] **Step 3：对照板（A12）。**
  - 1440 和 375 两种宽度，各截主页、橙色夹克内页、档案页，和效果图 A 并排拼成对照板。
  - 连同三张清单交负责人：改写过的句子（`rewrites.md`）、与事实表冲突处的改法（`fact-conflicts.md`）、显示文字对照表（`display-text.md`）。
  - 等负责人过目后，再进 Task 8。

### Task 8: 代码审查、提交、推送并开 PR（Claude）

- [ ] **Step 1：输出 `[PRE-REVIEW]`，派 `code-reviewer`（opus）审整个分支的 diff。**
  - critical 和 high 必须修；修完按 `code-review-handling` 的矩阵重验。
  - 至多 4 轮，到限输出 `[REVIEW-STUCK]`。
- [ ] **Step 2：确认 Cloudflare 没有接 GitHub 自动部署。**
  - 只读查看 Workers 的构建设置，凭证从 `~/.secret/cloudflare/…` 用 `source` 载入，不回显。
  - 有自动部署 → 停下问负责人。
- [ ] **Step 3：输出 `[PRE-COMMIT]`，推送分支，开 PR。**
  - PR 叠在 #2 上，目标分支 `codex/bunny-design-repair`。
  - PR 正文写摘要、`## Spec`（指向设计文档和本计划）、验收结果。
  - 正文末尾附 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`。
- [ ] **Step 4：用 `ccd_pr` 工具绑定 PR 并读取状态。** 仓库没有 CI，只看 PR 状态。不部署。
