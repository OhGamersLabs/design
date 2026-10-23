# OhGamers Design Library

OhGamers 角色设计资料站，使用 VitePress 1.6.4、Vue 3 与版本化图像清单。Bunny 当前工作版本为 **3.1.0 本地修订**：恢复线上 3.0.0 的19个阅读页面、现行展示图与原始 PNG，加入本轮实际完成的修订图。历史武器尺寸单独保留，不混入当前标准。

`catalog/releases.json` 的 `contentReady: false` 与页面 `releaseReady: false` 表示本地审阅状态；恢复与修订均不构成生产发布、工程认证或艺术终稿批准。原有 1.0.0 / 1.1.0 资料保留在版本目录，旧章节入口转向对应现行页面。

## 本地运行

使用 Node.js 22 或更高版本与 Python 3。

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
- 精确大小、SHA-256、图像尺寸与下载入口：`catalog/<角色>/<版本>/manifest.json` 及其 `docs/public/catalog/` 副本。

原图通过 `/media/<角色>/<版本>/<文件名>` 提供。PNG、ZIP 不加入 Git，也未上传 R2；新克隆仓库必须恢复对应 `.release` 文件后，才能通过 `npm run check:local` 和访问本地原图。网页 WebP、正文与清单均纳入代码审查。`ReleaseImage` 保持点击/键盘放大、原始尺寸切换、Esc 关闭、焦点恢复与原图链接。

新增或替换一张修订图时，把真实 PNG 放入当前 `.release`，把对应 WebP 放入 `docs/public/characters`，更新页面，然后在已有 Pillow 的 Python 环境执行：

```sh
python3 tools/build-local-catalog.py
npm run check:local
npm run build
```

此工具仅重建本地草稿清单与 PNG ZIP，不上传或部署。`check:local` 校验所有网页图、原始媒体和下载包的真实字节、大小与哈希；资料齐全不等于制作验证完成。

## 身体比例修订状态

身体页优先展示「v2 · 手绘线稿与赛璐璐修订」，保留已完成局部形体修订的腰腿关系、胸臀轮廓和纤细体型，调整为清楚线稿、平涂主色与硬边阴影。页面分别提供原局部修订到赛璐璐稿的画风对照，以及原 v2 比例底子到当前稿的等高三视对照。三张 v2 相关 PNG 全部保留，来源清单与下载清单记录状态、来源哈希及适用边界。穿戴层与尺寸未同步，其他既有图未逐张重绘；原01与对应尺寸板保留为沿革资料，不能直接套用于当前 v2 稿。

## 本轮修订边界

当前16格表情以现行身份绘制，旧2.1表情折叠为历史参考。红护环定义开合与穿戴；鞋带收尾、屈髋腿带与穿戴动作以实际补图为准。每项的适用范围写在对应页面。

武器实握、收纳座接口/取出动作，以及原稿持锯姿势角色卡仍未补齐；现有紧凑外形与水平收纳图继续标记为结构参考。没有把未生成的图、尺寸推测或文字方案当成已完成修订。

## 检查与发布边界

`npm test` 运行既有网关、发布版本及 Python 工具测试。`npm run build` 校验清单结构并构建静态站。`npm run check:local` 专门验证当前本地草稿；`npm run check:release` 继续拒绝未就绪资料，不因本地预览成功而自动放行生产。

Cloudflare Worker 仅允许读取清单中的精确 R2 对象路径，不提供任意键读取或列表接口。现有 `tools/cloudflare-local.py` 继续用于另行授权的上传/部署，凭据不写入仓库与日志。本轮未上传 R2、未改线上服务。后续发布前仍需核对目标、原图完整性、当前及回滚版本与实际 HTTPS 行为。

## 目录

```text
docs/.vitepress/           # 配置、导航与可复用图片组件
docs/characters/bunny/     # 当前19个阅读页面与历史入口
docs/public/characters/   # 版本化网页 WebP
catalog/                  # 版本清单与当前允许路径
tools/                    # 构建、完整性校验与本地预览
worker/                   # 静态站与受清单约束的 R2 入口
.release/                 # 本地原图与下载包（不进 Git）
```

软件保留原 [Apache-2.0 LICENSE](./LICENSE)。该许可不自动授予 Bunny 角色、美术、名称、商标及相关 IP 的转载、改编、再分发或商业使用权。
