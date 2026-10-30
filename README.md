# OhGamers Design Library

OhGamers 角色设计资料站，使用 VitePress 1.6.4、Vue 3 与版本化图像清单，按主页、内页、历史档案与跳转桩组织角色参考。Bunny 当前版本为 **3.1.0 本地修订**。

`catalog/releases.json` 的 `contentReady: false` 与 `docs/characters/bunny/index.md` 的 `releaseReady: false` 表示本地审阅状态，不构成生产发布、工程认证或艺术终稿批准。

## 站点结构

- 主页 `/characters/bunny/`：最新、身份与画风、身体基准、衣层由内到外、表情、武器与携行、动作与场景、下载入口。
- 内页：衣层页（身体、上衣与短裤、袜装、鞋靴、手部、腿带、橙色夹克、裤腰皮带、护目镜）和参考页（双匕首、图面尺寸、画风与配色、使用检查、下载）。
- 历史档案 `/characters/bunny/archive`：已取代的设计稿、变更记录、旧尺寸。
- 跳转桩：旧 URL 保留为不进搜索和导航的页面，按 `docs/.vitepress/data/bunny/anchor-map.json` 跳到新位置；旧锚点在原页找不到时也按这张表跳转。

页面数据在 `docs/.vitepress/data/bunny/`，包括主页、衣层、下载、档案、名称、锚点映射等 JSON。

## 本地运行

使用 Node.js 22 或更高版本，以及装有 Pillow 的 Python 3.10 或更高版本。

```sh
npm ci
npm test
npm run build
npm run check:local
python3 tools/local-preview.py --port 4173
```

打开 <http://127.0.0.1:4173/characters/bunny/>。这个预览同时提供构建页面和清单精确映射的原图；`npm run dev` 可用于正文与组件开发，但 VitePress 自带服务器不提供 `.release` 中的媒体。编辑后重新 `npm run build`，刷新预览即可。

## 图像与原图

- 当前网页图：`docs/public/characters/bunny/3.1.0/`。
- 当前 PNG 与原图包：被 Git 忽略的 `.release/bunny/3.1.0/`。
- 恢复时保留的 3.0.0 原始 PNG：`.release/bunny/3.0.0/`。
- 原始手稿网页图：`docs/public/characters/origins/1.0.0/`，PNG 在 `.release/origins/1.0.0/`。
- 旧版 1.0.0 / 1.1.0 清单（`catalog/bunny/`）与 1.1.0 网页图（`docs/public/characters/bunny/1.1.0/`）仍然保留，只作追溯，不是现行版本。
- 精确大小、SHA-256、图像尺寸与下载入口：`catalog/<角色>/<版本>/manifest.json` 及其 `docs/public/catalog/` 副本。

原图通过 `/media/<角色>/<版本>/<文件名>` 提供。PNG、ZIP 不加入 Git；新克隆仓库必须恢复对应 `.release` 文件后，才能通过 `npm run check:local` 和访问本地原图。清单内的 Bunny 3.1.0 与 origins 1.0.0 原图及资料包 ZIP 已按清单路径上传 R2，供审阅站点 design.ohgamers.org 读取。网页 WebP、正文与清单均纳入代码审查。`ReleaseImage` 保持点击/键盘放大、原始尺寸切换、Esc 关闭、焦点恢复与原图链接。

新增或替换一张修订图时，把真实 PNG 放入当前 `.release`，把对应 WebP 放入 `docs/public/characters`；在 `catalog/bunny/3.1.0/source-map.json` 补上这张图的来源条目（写 `baseline_sha256`，没有基线时写 `"no_baseline": true`），在 `docs/.vitepress/data/bunny/asset-names.json` 补上中文名，更新页面，然后在已有 Pillow 的 Python 环境执行：

```sh
python3 tools/build-local-catalog.py
python3 tools/build-thumbs.py
npm run check:local
npm run build
npm run check:site
```

`build-local-catalog.py` 仅重建本地草稿清单与 PNG ZIP，不上传或部署；图在 `source-map.json` 里没有来源条目时直接报错。`build-thumbs.py` 按清单重建 `docs/public/site/thumbs/` 下的缩略图与索引，`npm run build` 不会代跑。`check:local` 校验所有网页图、原始媒体和下载包的真实字节、大小与哈希；资料齐全不等于制作验证完成。`check:site` 的 A5 规则按 `tools/site_check/frozen-hashes.json` 冻结了本次重做时的网页图（WebP、SVG）、原始手稿 PNG 与 `catalog/bunny/3.1.0` 测量数据的哈希，并拒绝 3.1.0 中未登记的新 WebP 文件名；换图或加图时须同时更新这份冻结表。

## 检查与发布边界

`npm test` 运行网关、发布版本、Bunny 站点数据与组件辅助函数、搜索结果渲染、身体与衣物测量数据、站点检查及其他 Python 工具测试。`npm run build` 校验清单结构并构建静态站。`npm run check:local` 专门验证当前本地草稿；`npm run check:release` 继续拒绝未就绪资料，不因本地预览成功而自动放行生产。

先运行 `npm run build`，再运行 `npm run check:site`。站点检查读取 `docs/.vitepress/dist` 中构建好的站点，检查链接与锚点、旧 URL 与锚点映射、现行页与档案页用图、禁用词、版本号、图注、下载组、配色、外部资源、搜索索引等规则。除构建结果外，它还读取清单、页面数据和 `.release` 原图，新克隆要先恢复 `.release`。`python3 tools/check-site.py --rules R1,R2` 只跑指定规则，`--pages /characters/bunny/weapon` 只限制按页面扫描的规则（A5、D1、D2、R6、R8、R12b 始终检查全仓）；有失败时逐条输出「规则 页面: 原因」并以非零退出。

Cloudflare Worker 仅允许读取清单中的精确 R2 对象路径，不提供任意键读取或列表接口。`tools/cloudflare-local.py` 是生产上传与部署工具：它的 `upload` 与 `deploy` 都先运行 `check:release`，只用于另行授权的生产发布，凭据不写入仓库与日志。审阅版站点已部署到 design.ohgamers.org，清单内原图与资料包已上传 R2；这次审阅部署在仓库外执行：先运行该工具的 `preflight`，再直接 `wrangler deploy`；原图用仓库外脚本按清单路径上传，资料包 ZIP 用 `wrangler r2 object put` 上传。仓库中的 `contentReady` 与 `releaseReady` 都仍为 `false`，`check:release` 仍拒绝，审阅部署不等于生产发布；不得靠把它们改成 `true` 来放行审阅部署。后续发布前仍需核对目标、原图完整性、当前及回滚版本与实际 HTTPS 行为。

## 目录

```text
docs/.vitepress/            # 配置、导航与可复用图片组件
docs/.vitepress/data/bunny/ # 页面数据与锚点映射
docs/characters/bunny/      # 主页、内页、历史档案与跳转桩
docs/public/characters/     # 版本化网页 WebP
docs/public/site/thumbs/    # 缩略图与索引（tools/build-thumbs.py 生成）
catalog/                    # 版本清单与当前允许路径
tools/                      # 构建、完整性校验与本地预览
tools/site_check/           # 构建后站点检查（check:site）
worker/                     # 静态站与受清单约束的 R2 入口
.release/                   # 本地原图与下载包（不进 Git）
```

软件保留原 [Apache-2.0 LICENSE](./LICENSE)。该许可不自动授予 Bunny 角色、美术、名称、商标及相关 IP 的转载、改编、再分发或商业使用权。
