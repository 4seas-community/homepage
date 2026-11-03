# 公共 Header / Footer / 404 协作规范

适用于工程师、Codex和其他AI编码工具。改公开页面或新增系统前必须阅读本文件；各仓库的AGENTS.md和README均提供入口。

## 唯一维护位置

唯一源码：GitHub `4seas-community/homepage` 的 `site-chrome/`，包名 `@4seas/site-chrome`。官网、Longevity、Coliving介绍、Event、Booking、Residency、CoLivingOS公开页面（包括长寿月）及其404共用。

- `config.js`：菜单顺序、名称、目的地、品牌和公共链接。
- `index.js`：同一棵Header/Footer/404组件树；`react.js`：React适配。
- `language.js`、`interaction.js`：语言控件与公共交互。
- `not-found.js`：404文案；`style.css`、`assets/`：公共外观与资产。
- `scripts/generate-site-chrome.mjs`：生成静态输出。

业务仓库只保留薄的路由适配器，传入部署前缀、当前路径、语言链接和必要的页脚版本号。后台操作栏和业务二级导航仍由各应用维护。旧coliving仓库不是当前/coliving申请应用，当前申请系统是CoLivingOS。GitHub是开发源，Gitea是运维下游。

## 必须遵守

1. 不复制或重写Header、Footer、404，不从旧副本恢复独立模板，不通过本地CSS隐藏语言入口或覆盖公共断点、顺序。公共行为必须回到唯一源码修改。
2. 菜单固定为 **Longevity / Coliving / Residency / Event / Zuzalu / Space**，不含About。改顺序时同步修改唯一配置、本规范与现有回归检查。Event内部key仍为events，地址仍是/event。
3. 每页恰好一个公共Header、一个Footer、一个页头语言入口，不能在父布局与页面重复渲染；404正文不能另放语言按钮。缺少语言配置时也不能让入口消失。
4. 有译文的系统提供真实语言路由，保留当前页面、部署前缀和查询参数，尤其验证/收据凭证。无译文的旧正文不能冒充已翻译；查询参数语言只用于公共界面和404。
5. 大于900px展开菜单，900px及以下折叠；展开列表在菜单按钮下。检查键盘、Escape、焦点返回、语言切换、资产和手机横向溢出。
6. Coliving菜单进/coliving-community/介绍页，申请按钮进/coliving/en/start或对应语言申请路径，不混用。
7. 404使用同一NotFound，保留原地址并返回真实HTTP404，不能变成200假错误页。保留中英泰文案、单一h1和恢复入口；所在布局只提供一次Header/Footer。
8. 不手改生成的HTML/CSS/JS/资产；发布样式或脚本变化时更新package.json与config.js的VERSION，再生成带新缓存版本的输出。

## 新页面和新系统

先查父布局是否已有公共组件。使用 `@4seas/site-chrome/react` 的Header、Footer、NotFound及包样式，设置正确assetBase与语言路由。开发/构建前运行 `4seas-chrome-assets public/site-chrome`，资产本地部署，不运行时远程抓组件。新仓库的AGENTS和README必须加入本规范入口，并纳入验证清单。

## 更新与提交

1. 读取仓库AGENTS、本规范与本地适配说明；核对最新GitHub main，保留他人工作。不能用整个设计预览覆盖正式源码。
2. 在homepage修改公共源码并更新版本，运行 `npm run chrome:generate`、`npm test`、`npm run chrome:check`。生成输出漂移检查必须通过。
3. 四个消费者锁定同一完整Git提交SHA并更新各自锁文件。禁止浮动分支依赖，不直接编辑node_modules。
4. 按仓库要求跑锁定安装、测试、类型检查和构建；CoLivingOS运行 `pnpm run check:all`，不能通过跳过安全/约定检查制造成功。
5. 各受影响系统实际查看正常页与404：组件数量、一个语言入口、顺序、三语切换、路径/查询保留、HTTP404、桌面与手机。跨系统升级需核对安装文件和源一致，不能只看外观。
6. 更新原PR或协调PR，写清共享源SHA、消费者SHA、真实验证、未运行测试与原因，附桌面/手机截图。缺环境导致没运行的测试不能写成通过。
7. 先合并homepage源PR并保留固定提交，再合并消费者。若源PR squash/rebase，消费者须改锁最终main提交并重新验证。之后按各系统原有发布流程执行。

代码提交、推送、PR或合并均不是生产发布授权。Cloudflare预览/发布、Gitea同步、244操作、线上数据库仍遵守各仓库原有权限与审批；本规范不取代它们。

## 本地预览

静态页用 `npm run preview -- --port 4200`，不要用只显示Python默认报错的普通http.server验收404。独立设计预览也必须在生成结束后接入同一共享源码，不能成为另一套维护来源。
