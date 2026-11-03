# 4Seas Homepage Agent Instructions

This repository is the static production homepage for `https://4seas.xyz/`.

GitHub `4seas-community/homepage` is the only development source of truth.
Gitea `4Seas/homepage` is a downstream operational copy. Never develop on or
force-push Gitea. Before a production release, GitHub `main`, local `main`, and
Gitea `main` must resolve to the same commit.

Before any production deployment, read and follow [DEPLOYMENT.md](DEPLOYMENT.md)
completely. Use the repository's operator scripts; if the `4seas-remote-ops`
skill is installed, follow its additional safety gate as well. The deployment
guide is mandatory even for one-line HTML changes.

Key rules:

- Run `node --test tests/*.test.mjs` and preview locally before proposing a release.
- Compare the release payload with the active server release. Only intended production files may differ.
- Obtain an explicit execution-card confirmation immediately before the first production mutation.
- Use `scripts/ssh-244.sh`; never weaken host-key or user-key checks.
- Use `scripts/sync-gitea.sh` for GitHub-to-Gitea synchronization. It must remain fast-forward-only.
- A GitHub or Gitea push is not permission to deploy. Generate a release plan and obtain explicit human approval.
- Never edit `/opt/4seas-home/current` or an active release in place.
- Create a new UTC-named release and switch `current` atomically.
- The homepage is reported as `legacy` by `4seas-site`. Do not enable, disable, recreate, or otherwise work around that boundary.
- Preserve the previous release as the rollback point. Do not delete releases during deployment.
- Validate from both the server and an independent local client. Roll back immediately if any required validation fails.
- When CSS or JavaScript changes, version its URL in `index.html` so Cloudflare cannot serve the previous asset for up to seven days.

The production payload allowlist is: `404.html`, `favicon.ico`, `index.html`, `css/`, `images/`, `js/`, `longevity/`, `coliving-community/`, and `RELEASE-MANIFEST.txt`. Tests, Git metadata, documentation, environment files, and credentials must never be included.

## 公共 Header / Footer / 404（编码前必读）

修改公开页面或新增系统前，必须先阅读[公共组件协作规范](site-chrome/CONTRIBUTING.zh-CN.md)。
公共页头、页脚、语言入口和404只使用 `@4seas/site-chrome`，唯一源码在
`4seas-community/homepage/site-chrome/`。不复制模板、另建菜单、隐藏语言入口、
覆盖公共断点或手改生成文件。每页只渲染一套公共组件，保留语言路由与查询参数。
公共规则变更从共享源码发起，更新固定版本与锁文件，验证正常页、404及桌面/手机。
原有业务、后台、生产发布和数据权限边界继续有效。
