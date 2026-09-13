# 构建与发布指南

本仓库是 DSH Plugins 插件目录站的**单一事实源**：数据机器人每日更新 `catalog/plugins.json`，由 `scripts/gen_site.py`（深海鲸皮肤）生成完整静态站。

## 数据自动更新（GitHub Actions）

- `.github/workflows/sync.yml`：每天北京时间 09:17（cron `17 1 * * *` UTC）自动运行
  1. `npm run sync`：搜索 GitHub 上 `topic:dsh-plugin` 的仓库，逐仓库校验补丁文件真伪，重写 `catalog/plugins.json` 与 `docs/PLUGINS*.md`
  2. `npm run check`：校验目录完整性
  3. 有变化才自动 commit，无变化不产生提交
- 也可在 Actions 页面手动触发（workflow_dispatch）

## 构建静态站（dist-wb/）

```bash
python scripts/gen_site.py --out dist-wb --site https://dsh-plugins.app.workbuddy.host/
# 或
npm run build
```

- 读取 `catalog/plugins.json`，生成完整双语静态站到 `dist-wb/`（构建时自动清空输出目录）：
  - `index.html`（中文首页）/ `en.html`（英文首页）— 深海鲸皮肤，搜索/筛选/排序/卡片与横条视图/URL 状态同步
  - 每个插件的**站内详情页**（`plugins/<owner>/<repo>.html` 中英各一页），首页点击插件进入详情页而非 GitHub
  - `about.html` / `privacy.html`（中英）
  - `sitemap.xml`（含全部页面与 hreflang）/ `feed.xml` / `robots.txt`
  - `llms.txt`（带 UTF-8 BOM）/ `llms-full.txt`（全量插件清单与详情页链接）
- 所有站内链接使用根绝对路径 + `.html` 后缀（WorkBuddy 静态托管不做 clean-URL 重写）
- `--site` 参数控制站点绝对域名；`--catalog` 可指向其他目录数据

## 本地预览与测试

```bash
python scripts/gen_site.py --out dist-wb
cd dist-wb && python -m http.server 8080   # 浏览器访问 http://localhost:8080
npm test          # 站点完整性测试（详情页齐全/内链无 404/sitemap/llms BOM 等）
npm run check     # catalog 数据完整性
```

## 发布（WorkBuddy 静态托管）

- 应用：`dsh-plugins.app.workbuddy.host`（appId `wbapp_NVdbf9G7GWE1BB58rJAgJv`）
- 发布目录：仓库内 `dist-wb/`（构建产物，不入 git）
- WorkBuddy 每日定时任务自动执行：`git pull` → 构建 `dist-wb/` → 重新发布

## 数据来源与许可

- 本项目以 MIT License 发布，详见 [LICENSE](../LICENSE)；插件元数据来自各插件上游公开 GitHub 仓库
