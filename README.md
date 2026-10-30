# OhGamers Design Library

OhGamers 角色设计资料站，使用 VitePress 1.6.4 与 Vue 3，按角色主页、衣层页、参考页与旧 URL 跳转桩组织当前图片。

`catalog/releases.json` 的 `contentReady: false` 与角色主页的 `releaseReady: false` 表示审阅状态，不构成生产发布、工程认证或艺术终稿批准。

## 站点结构

- 主页 `/characters/bunny/`：当前精选、身份与画风、身体基准、衣层由内到外、表情、武器与携行、动作与场景。
- 内页：身体、上衣与短裤、袜装、鞋靴、手部、腿带、橙色夹克、裤腰皮带、护目镜，以及双匕首、图面尺寸、画风与配色、使用检查。
- 旧 URL 由 `docs/.vitepress/data/bunny/anchor-map.json` 映射到当前内容；跳转桩不进导航和搜索。原档案及下载页跳到角色主页。

页面数据在 `docs/.vitepress/data/bunny/`。站点只展示当前图片，历史不在站点中展示或提供下载。

## 本地运行

使用 Node.js 22 或更高版本，以及装有 Pillow 的 Python 3.10 或更高版本。

```sh
npm ci
npm test
npm run build
npm run check:local
python3 tools/local-preview.py --port 4173
```

打开 <http://127.0.0.1:4173/characters/bunny/>。这个预览同时提供构建页面和清单精确映射的原图；`npm run dev` 可用于正文与组件开发，但 VitePress 自带服务器不提供 `.release` 中的媒体。编辑后重新构建并刷新预览。

## 图像与原图

每张图使用稳定的 `<slug>`，只包含小写字母、数字和连字符，并以 `-latest` 结束，例如 `body-front-latest`。名称不放衣层编号、迭代号或制作过程词。原图更新时保留同一文件名和 URL。

- 网页图：`docs/public/characters/<char>/<slug>.webp`。
- 原始 PNG：`.release/<char>/<slug>.png`，不进 Git；新克隆必须恢复原图后才能运行 `check:local`。
- 原图 URL：`/media/<char>/<slug>.png`。
- R2 当前对象：`x_ops/design/characters/<char>/latest/<slug>.png`。
- 缩略图：`docs/public/site/thumbs/<char>/<slug>.webp`，由工具生成。
- 逐图尺寸、字节数与 SHA-256：`catalog/<char>/manifest.json` 及其 `docs/public/catalog/<char>/manifest.json` 副本。
- Worker 精确允许路径：`catalog/releases.json`，schemaVersion 2，只保存角色、URL、R2 key 和 MIME，不固定远端文件大小或哈希。

新增图片时，把对应 WebP 和 PNG 放进上述位置，在 `asset-names.json` 中登记中文名，并在当前页面或页面数据中引用 slug。替换图片时直接替换同名 WebP 和 PNG；不新增旧图入口。`catalog/legacy-ids.json` 仅保存这次迁移的旧 ID 对照，不参与页面渲染。站点不再制作或提供 ZIP 原图包。

完成添加或替换后执行：

```sh
python3 tools/build-local-catalog.py
python3 tools/build-thumbs.py
npm run check:local
npm run build
npm run check:site
```

若图片用于尺寸标尺，还须核对该图的测量取点与源哈希，并更新 `catalog/<char>/` 下的对应测量 JSON。构建会据此生成以 `-latest.svg` 结束的标尺；不能把旧坐标直接套给新图。

`build-local-catalog.py` 校验稳定命名和原图存在性，重建本地清单，不需要来源映射、不制作资料包。`build-thumbs.py` 重建当前缩略图并移除废弃缩略图。`check:local` 核对网页图、PNG 与标尺的实际字节、尺寸元数据及 SHA-256。`ReleaseImage` 保持点击/键盘放大、原始尺寸切换、Esc 关闭、焦点恢复与原图链接。

## 检查与发布边界

`npm test` 运行 Worker、目录、页面与测量辅助函数、搜索、构建器、站点检查器及发布流程的离线测试。`npm run build` 校验允许路径并构建静态站。先构建，再运行 `npm run check:site`；它检查链接与旧锚点跳转、当前图片覆盖、原图完整性、稳定文件名、图注、方向、配色、外部资源和搜索。A1/A2 检查清单和页面引用，不再冻结某批图片哈希。`python3 tools/check-site.py --rules R1,R2` 可缩小规则范围；`--pages /characters/bunny/weapon` 可缩小页面扫描范围，全局清单检查仍覆盖全仓。

授权发布到指定目标后，先检查远端计划，再应用图片替换。下面各条 Cloudflare 命令均需追加 `--credentials <本地凭据文件> --email <账户邮箱>`；不要将实际凭据写入文档或日志：

```sh
python3 tools/cloudflare-local.py preflight
python3 tools/cloudflare-local.py publish              # 默认 --dry-run，只读远端并输出 JSON Lines 计划
python3 tools/cloudflare-local.py publish --apply       # 上传原图；此命令会写 R2
python3 tools/cloudflare-local.py dry-run               # Worker 部署预检
python3 tools/cloudflare-local.py deploy                # 此命令会部署 Worker/静态站
```

`publish` 逐图核对本地清单的 SHA-256 与字节数，不要求 `contentReady: true`，因此支持审阅站。缺失对象直接上传；内容相同则跳过。替换已有对象前，先把远端旧字节保存到 `x_ops/design/characters/<char>/history/<去掉-latest的slug>-<UTC YYYYMMDDTHHMMSSZ>.png`，读回验证后再覆盖当前对象，并读回验证新内容。历史只保留在 R2；站点和 Worker 允许路径中没有历史入口。大于 50 MB 的 PUT 使用 `wrangler r2 object put --remote`。每张图独立输出状态，任一失败最终返回非零。同一角色的发布须串行执行；若历史时间戳已存在，工具拒绝覆盖，保留远端当前对象。

`deploy` 保留生产就绪检查：`check:release` 在 `contentReady` / `releaseReady` 为 false 时仍拒绝。审阅部署需在另外授权的发布流程中使用已验证的目标；不要为放行审阅站修改就绪标志。`preflight(client)`、`Client`、`credential` 和 `wrangler` 保持供外部包装器调用的接口。凭据不进入仓库、日志或报告。

Worker 只读清单中的精确 R2 对象路径，仅接受 GET/HEAD，不提供任意键读取或列表接口。原图 ETag、修改时间与长度来自当前 R2 对象，匹配条件请求返回 304。原图、静态角色图与缩略图使用 `public, max-age=60, must-revalidate`，允许同 URL 更新生效。

## 目录

```text
docs/.vitepress/            # 配置、导航与可复用图片组件
docs/.vitepress/data/bunny/ # 当前页面数据与旧 URL/锚点映射
docs/characters/bunny/      # 主页、内页与跳转桩
docs/public/characters/     # 当前 -latest WebP 与派生标尺
docs/public/site/thumbs/    # 自动生成的 -latest 缩略图与索引
catalog/                    # 当前原图清单、测量数据与内部 ID 对照
tools/                      # 构建、完整性校验、本地预览与发布工具
tools/site_check/           # 构建后站点检查（check:site）
worker/                     # 静态站与受清单约束的 R2 入口
.release/                   # 本地原图（不进 Git）
```

软件保留原 [Apache-2.0 LICENSE](./LICENSE)。该许可不自动授予 Bunny 角色、美术、名称、商标及相关 IP 的转载、改编、再分发或商业使用权。
