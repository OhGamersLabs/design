# OhGamers Design Library

OhGamers 角色设计白皮书与正式终稿的文档站，目标地址为 <https://design.ohgamers.org>。使用 VitePress、通用 Markdown 和 Cloudflare Workers 静态资源；公开发布资产由 Worker 从已有的私有 R2 桶按精确清单读取。

首个公开角色为 Bunny 1.1.0，按五章组织 17 篇 Markdown 正文与 19 张透明网页终稿图。19 张原始 RGBA PNG、27 页白皮书 PDF 与原图包通过精确发布清单提供。不得使用本机旧版、候选稿或制作资料替代正式内容。

## 本地开发

使用 Node.js 22 或更高版本；部署工具及路由冲突测试另需 Python 3。

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

`npm run build` 用于构建和检查静态页面。正式部署前必须运行 `npm run check:release`，检查发布清单、网页图完整性与内容就绪状态；空清单及未就绪内容不得发布。Vite 固定覆盖到 6.4.3，以修复 VitePress 1.6.4 默认构建依赖的安全公告；版本锁定在 `package-lock.json`。

本机发布使用 `tools/cloudflare-local.py`，通过 `--credentials` 指向已有本机 env 文件、`--email` 提供对应邮箱。支持 `preflight`、`upload`、`dry-run`、`deploy` 和 `status`。工具只在子进程环境映射凭据，关闭 Wrangler 磁盘日志及遥测，不新建或传输凭据。

上传前将清单中的原始文件置于被 Git 忽略的 `.release/<id>/<version>/<filename>`，`filename` 与公开路径及 R2 键的最后一段相同。上传工具逐项核对本地哈希，并在上传后回读验证。`deploy` 会重新检查清单、构建静态页面和核实域名冲突。发布对象与代码按版本保留；1.1.0 更新保留既有 1.0.0 R2 对象与上一 Worker 版本作为回滚依据，历史对象不自动加入当前公开清单。

活动发布清单按角色选择一个版本。校验器读取该角色、版本的独立 manifest，逐项核对网页图片及公开原图、下载文件；上传器仅分页检查这些活动版本的 R2 前缀。保留的旧版目录不会自动加入公开清单。

## 目录与扩展

```text
docs/
  .vitepress/             # 站点配置、主题与可复用组件
  characters/
    bunny/                # Bunny 白皮书 Markdown 章节
  standards/              # 跨角色通用规范
  public/characters/      # 已批准的版本化网页 WebP
catalog/                  # 公开发布资产的精确清单
tools/                    # 构建、校验和发布工具
worker/                   # 静态站与受清单约束的 R2 读取入口
```

新增角色时，在 `docs/characters/<id>/` 下使用相同的章节结构。仅在正式内容经批准并准备完成后，将角色加入 `docs/.vitepress/config.mts` 的导航和侧栏；首页目前只展示 Bunny。跨角色要求放入 `docs/standards/`，角色专属说明保留在角色目录。

## 图片与文档

图片使用全局 `ReleaseImage` 组件，支持鼠标和键盘放大、适应屏幕与原始尺寸切换、Esc 关闭、恢复焦点及原图链接。`src` 与 `original` 仅接受站内绝对路径或 HTTPS 地址；正式资产应使用清单中声明的站内公开路径。

```vue
<ReleaseImage
  src="/characters/bunny/1.1.0/character-card.webp"
  alt="描述图片中需要读者理解的角色视图或细节"
  original="/media/bunny/1.1.0/character-card.png"
  caption="经批准的图注"
/>
```

网页 WebP 位于 `docs/public/characters/bunny/1.1.0/`。原 PNG、PDF 与原图 ZIP 使用 `/media/bunny/1.1.0/<文件名>`，公开资产清单位于 `/catalog/bunny/1.1.0/manifest.json`。下载路径必须存在于发布清单。网页以可阅读的 Markdown 章节组织内容，不用整页 PDF 截图代替正文。

## 发布边界

- 只接入迁移包中已批准公开的 19 张 Bunny 终稿图片、白皮书 PDF，以及明确批准的资产包。
- `catalog/releases.json` 是公开资产的唯一清单。每个活动版本的公开路径精确对应一个 R2 对象，附文件大小、MIME 和 SHA-256；不存在任意键读取或对象列表接口。
- 资产存放于 `ohgamers` 桶的 `x_ops/design/characters/<id>/releases/<version>/`。上传前检查既有对象：哈希相同则跳过，内容不同立即停止。REST 接口未明确承诺原子条件写，同一版本应串行发布；修改内容应使用新版本。
- R2 桶保持私有；公开入口仅暴露清单中的发布资产。原稿、制作过程、其他候选与私有资料不得加入仓库、构建输出或公开路径。
- Cloudflare 凭据只在本机进程内使用，不进入仓库、静态文件、日志或交付附件。
- 部署前核对 `design.ohgamers.org` 的 DNS 与服务绑定；如存在冲突，先报告，不覆盖已有服务。正式发布须完成实际 HTTPS 与桌面、手机浏览检查。

## 许可与角色权利

保留仓库原有的 [Apache-2.0 LICENSE](./LICENSE)，不修改其内容。该软件许可不自动代表 Bunny 或其他角色、美术、名称、商标及相关 IP 的使用授权。

公开展示与下载不等于授予转载、改编、再分发或商业使用权。详细资产授权仍待权利人确认；本仓库目前不新增 `ASSET-LICENSE`，也不通过说明文字授予额外角色或美术许可。
