# Longevity 首次上线交接 · 2026-10-17

本次由工程师上线。PR、推送与合并均不代表生产发布授权；仍按 [DEPLOYMENT.md](DEPLOYMENT.md) 生成执行卡并确认。本文件不是已执行的生产记录。

## 本次上线范围

- 新增 `https://4seas.xyz/longevity/`：始终默认英文，不记忆、不按偏好跳转（2026-10-17 修正）。
- 英文 `/longevity/en/`、中文 `/longevity/zh/`、泰语 `/longevity/th/`；切换顺序 EN / 中文 / ไทย，保留所在区块和查询参数。
- 包含 Longevity Month、日常实践、八项检测、睡眠房间与睡眠教练、Peptide、个人与社区数据中心、活动日历、建设与参与方式。
- 咨询统一指向 `https://linktr.ee/ZuzaluLongevityChiangMai`。
- 现有官网首页仅增加一个 Longevity 导航入口；完整首页设计新版仍是本地评审稿，不在此 PR。
- 沿用当前主分支隐藏共居宣传的安排：不发布共居/Canteen 内页；相关行动入口改为参与或餐食咨询。已公开的 Residency 主导航保留。
- Host 内页暂不发布，使用源系统里的公开 Sola 个人主页。
- 页面没有健康数据上传、采集、登录、支付或医疗预约后台。数据中心为服务介绍，活动列表为公开展示数据。

## 已确认的 2026 日期

| 日期 | 活动 |
| --- | --- |
| 11 月 30 日 | Longevity Month Opening |
| 12 月 24–25 日 | Nomad Market |
| 12 月 26–27 日 | ETHChiangmai @ Longevity Hackathon 2026 & Conference |
| 12 月 28 日 | Longevity Summit |

不再使用旧 deck 的 11 月 23 日开幕、12 月 20 日结束日期，也不将这组活动写成固定四周课程。

## 本地审阅

```bash
node --test tests/*.test.mjs
python3 -m http.server 4198 --bind 127.0.0.1
```

另开终端，在仓库根目录验证所有独立页与资源：

```bash
python3 scripts/validate-longevity.py --base-url http://127.0.0.1:4198/
```

打开 `/longevity/` 与三语路径，在桌面和手机宽度检查导航、文字换行、Peptide 图片无留白、睡眠教练标题、底色与页脚。检查语言切换、回到首页、Linktree、活动搜索/分类/往期/更多以及 Host 链接。

自动化检查覆盖本地资源路径、日期、语言顺序、嵌套语言路径、偏好存储被禁用、活动加载/筛选/分页/失败状态及公开字段。浏览器预览工具此前被 URL 安全策略拦截，因此没有完成桌面/手机截图验收；工程师需补做这一步后再发布。

## 合并与发布

1. 审核 PR 和 CI，通过后合并到 GitHub `main`。
2. 工程师使用自己的专用 SSH 账号、密钥和预期指纹，按 README 设置三项 `FOURSEAS_*` 变量。不得共享密钥或绕过固定主机指纹检查。
3. 更新本地主分支，检查并快进同步 Gitea，再生成发布计划：

```bash
git switch main
git pull --ff-only origin main
./scripts/sync-gitea.sh --check
./scripts/sync-gitea.sh --apply
./scripts/release-244.sh plan
```

4. 检查计划的完整文件差异：预期只有官网首页一条导航入口、新 `longevity/` 内容和本次发布清单。原有 `css/`、`js/`、`images/`、`404.html` 不应产生内容变化。脚本和文档不得进入发布包。
5. 核对现有 legacy 静态站点是否能服务嵌套目录；不为这次发布修改或启停 `4seas-site`。若路由无法支持 `/longevity/`，停止并单独审阅路由变更。
6. 展示计划生成的执行卡，记录实际旧版本回退路径、目标目录、包 SHA-256 和差异，经负责人确认后，执行卡上输出的精确 apply 命令。不要预先填写一个猜测的旧版本或校验值。
7. 脚本会从服务器和工程师电脑分别检查所有新页面与本地资源的 HTTP 状态与 SHA-256；任何必要检查失败应回退。

## 上线验收

- 现有首页正常，菜单 Longevity 可到达新页。
- 四个入口均 HTTP 200：`/longevity/`、`/longevity/en/`、`/longevity/zh/`、`/longevity/th/`。
- `/longevity/` 始终是英文；语言只由网址决定，不读写本地存储。
- 图片完整；版本化的 CSS/JS/日历 JSON 为本次内容，不能仅凭 HTTP 200 判断缓存正确。
- 重要日期、Conference 大写、Nomad Market 命名、八项检测顺序、睡眠教练、Peptide 与隐私内容正确。
- 活动公开快照时间写在 `longevity/assets/longevity-events.json` 的 `asOf` 中（本次为 2026-10-17）。页面会随时间划分往期/即将举行，但不会自动从 Sola 同步新增活动；实时安排入口仍到现有活动系统。后续更新应另做提交并升级 JSON 版本号。
- 不应有本地地址、设计稿 `.html` 路径或未发布 Host/Canteen/共居链接。
- 独立终端运行 `python3 scripts/validate-longevity.py`；浏览器做一次桌面和手机宽度人工验收。
- 保存实际发布包、提交号、校验值、旧/新版本路径和 Nginx 重载记录。

## 回退

沿用执行卡里记录的实际旧版本。脚本对切换后的必要检查失败执行回退；人工验收发现问题同样先回退，不在活动目录现场修改页面。使用 `scripts/ssh-244.sh`，在 `/opt/4seas-home/` 同一文件系统创建指向旧版本的临时链接，再原子替换 `current`，检查并重载 Nginx。确认旧首页恢复，保留新旧两个版本。

目前没有读取生产 active release、同步 Gitea、执行发布计划、上传发布包或切换生产版本。最终发布包应在 PR 合并、三端 main 对齐后由发布脚本生成；本次不提供绕过该流程的预生成生产包。
