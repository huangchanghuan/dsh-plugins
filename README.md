# DSH Plugins 插件目录

> **线上地址**：https://dsh-plugins.app.workbuddy.host/
> **appId**：`wbapp_NVdbf9G7GWE1BB58rJAgJv`（WorkBuddy 静态托管）

[English](#english) | 简体中文

DeepSeek Harness（DSH）插件生态的**中英双语全量目录站**：收录 1113 个社区插件，支持关键词搜索、语言/许可证筛选、星标/更新时间排序、URL 状态分享、一键复制安装命令。每个插件都有**站内详情页**（中英各一页），页面不引用任何外部聚合站，仅保留各插件自己的上游 GitHub 仓库链接。

## 项目结构

```
dsh-plugins.app.workbuddy.host/   ← 本仓库（项目根）
├── catalog/plugins.json          ← 插件目录数据（单一事实源，每日自动更新）
├── assets/llms.txt               ← llms.txt 模板（带 __COUNT__ 占位符）
├── scripts/
│   ├── gen_site.py               ← 站点生成器（深海鲸皮肤）：catalog → dist-wb/
│   └── sync-catalog.mjs          ← 数据同步机器人：GitHub topic:dsh-plugin → catalog
├── tests/                        ← 站点/数据完整性测试
├── dist-wb/                      ← 构建产物（gitignore，WorkBuddy 发布此目录）
├── docs/DEPLOY.md                ← 构建与发布指南
└── LICENSE                       ← MIT License
```

## 快速开始

```bash
npm install   # 仅数据同步/测试需要
npm run build
```

构建产物（dist-wb/）包含：中英双语首页（深海鲸皮肤）、每个插件的站内详情页（`plugins/<owner>/<repo>.html`，中英各一）、about / privacy 双语页、`llms.txt` + `llms-full.txt`、`sitemap.xml`、`feed.xml`、`robots.txt`。

## 发布

WorkBuddy 静态托管发布 `dist-wb/` 目录。WorkBuddy 每日定时任务自动执行：拉取本仓库最新源码 → 构建 `dist-wb/` → 重新发布。详见 [docs/DEPLOY.md](docs/DEPLOY.md)。

## 数据更新

GitHub Actions 每天北京时间 09:17 自动运行数据同步（`npm run sync`）：发现 GitHub `topic:dsh-plugin` 仓库、校验插件补丁真伪、更新 `catalog/plugins.json`，有变化时自动提交。也可在 Actions 页面手动触发。

## 插件数据

- [catalog/plugins.json](catalog/plugins.json)：机器可读全量目录
- 插件地址与介绍来自各插件上游公开 GitHub 仓库；收录不代表官方背书、安全审计或运行兼容
- `NOASSERTION` 表示 GitHub API 未识别到明确许可证
- 插件版权与许可证归各上游项目所有

## English

Bilingual (zh/en) directory site for the DeepSeek Harness plugin ecosystem — 1113 community plugins with search, filtering, sorting, copy-install commands, and per-plugin detail pages on this site. Data lives in `catalog/plugins.json` and is refreshed daily by GitHub Actions. Build with `npm run build`; see `docs/DEPLOY.md` for deployment.
