# frontendv2 题库模块补齐与重构设计
日期：2026-06-15

主题：对齐当前 `frontend + backend` 已经实现的题库完整能力，在 `frontendv2 + backend` 中补齐普通用户与管理员的题库模块，并在不照搬旧版页面布局的前提下，重做信息架构、页面职责、交互组织与治理工作台。

## 1. 目标

本次设计只解决 `frontendv2` 的题库模块，不扩散到社区、考研、考公、就业等其他模块，也不借此重写后端题库接口。

本次设计的目标是：

1. 以当前 `frontend` 已跑通的题库功能路线和后端 `questionbank` 模块为唯一能力基线，完整补齐 `frontendv2`。
2. 采用“入口页分流 + 功能子页闭环”的信息架构，让题库首页、题库详情、练习会话、历史、错题、统计、后台治理各自承担清晰职责。
3. 游客可浏览题库目录、单题库详情和题目预览，但所有个人训练数据能力必须登录后才能进入。
4. 历史记录、错题本、统计分析作为题库模块独立子页存在，`/settings/practice` 只保留摘要和跳转入口，不再承载主流程。
5. 管理员端从旧版“表格堆叠页”升级为“题库治理总台 + 单题库工作区”，覆盖题库 CRUD、题目 CRUD、批量导入、批量更新、启停与版本快照。
6. 继续复用 `frontend/src/lib/api.js` 中现有 `practiceApi` 与 `adminQuestionBankApi`，优先通过前端模块化重构完成这次升级。

## 2. 真实能力基线

本设计只以下列真实实现为准：

- 旧版前端题库页面：`frontend/src/pages/PracticePage.jsx`
- 旧版练习会话页：`frontend/src/pages/PracticeDetailPage.jsx`
- 旧版练习历史页：`frontend/src/pages/PracticeHistoryPage.jsx`
- 旧版错题本页：`frontend/src/pages/WrongQuestionPage.jsx`
- 旧版统计页：`frontend/src/pages/PracticeStatisticsPage.jsx`
- 旧版管理员题库页：`frontend/src/pages/admin/AdminQuestionBankPage.jsx`
- 旧版管理员题目页：`frontend/src/pages/admin/AdminQuestionsPage.jsx`
- 当前 `frontendv2` 题库占位页：`frontendv2/src/pages/practice/PracticeDirectoryPage.jsx`
- 当前 `frontendv2` 管理员题库占位页：`frontendv2/src/pages/admin/AdminMainPage.jsx`
- 后端题库模块说明：`backend/src/main/java/com/graduateplatform/questionbank/README.md`
- 当前题库接口封装：`frontend/src/lib/api.js`

### 2.1 旧版普通用户真实能力

旧版 `frontend` 已经覆盖以下题库能力：

- 题库目录与多维筛选
- 章节练习、随机练习、模拟练习
- 练习会话创建、续答、逐题暂存、交卷
- 单选、多选、判断、主观题作答
- 交卷后成绩结果、错题列表、答案与解析回放
- 练习历史分页与筛选
- 错题本分页、筛选、批量重练、全量重练
- 统计分析，包含粒度切换、趋势图与高频错点

### 2.2 后端真实能力边界

后端 `questionbank` 模块已经支持：

- 公共题库列表、题库筛选项、题目预览
- `chapter` / `random` / `mock` / `wrong_retry` 四种练习模式
- 会话创建、会话读取、逐题暂存、交卷
- 错题本分页、错题重练
- 统计分析 `day/week/month`
- 练习历史分页
- 管理员题库 CRUD、题目 CRUD、状态切换
- 题目 JSON 批量导入、文件导入、批量更新
- 题目版本快照查询
- 题库与题目软删除/停用

### 2.3 当前 frontendv2 的缺口

当前 `frontendv2` 仅有题库目录预览、题库预览页、管理员题库治理占位文案和设置页中的练习摘要，缺少真正闭环：

- 没有真实题库数据接线
- 没有题目预览页与模式选择页
- 没有练习会话页
- 没有历史、错题本、统计子页
- 没有管理员题库总台与单题库工作区
- 没有对错题重练、会话续答、快照查看等完整状态流的支撑

## 3. 核心产品方向

本次方案采用 `Atlas Loop` 路线：把题库做成一个“浏览入口清晰、训练闭环明确、后台治理聚焦”的模块，而不是继续演化为单页混合工作台。

### 3.1 普通用户方向

普通用户题库模块围绕“先选库，再训练，再复盘”展开：

- 首页负责发现与分流
- 单题库页负责预览与配置
- 会话页负责答题
- 历史、错题、统计各自独立，承担复盘能力

### 3.2 管理员方向

管理员题库模块围绕“先发现问题，再进入单库治理”展开：

- 题库总台负责筛选、统计、发现待处理项
- 单题库工作区负责具体编辑与批量操作
- 版本快照作为深层信息面板，不挤占主操作区

### 3.3 游客方向

游客不是空白状态，也不是完全禁用：

- 可浏览题库目录
- 可进入单题库详情
- 可看题目预览
- 不能创建会话、查看个人历史、错题本和统计

## 4. 信息架构与路由

## 4.1 普通用户路由

推荐补齐以下题库路由：

- `/practice`
- `/practice/banks/:bankId`
- `/practice/sessions/:sessionId`
- `/practice/history`
- `/practice/wrong-questions`
- `/practice/statistics`

说明：

- `/practice` 保留为题库模块总入口
- `/practice/banks/:bankId` 承担单题库详情、题目预览与模式配置
- `/practice/sessions/:sessionId` 承担真实会话，不再继续沿用旧版 `/practice/:id?sessionId=` 的混合表达
- 历史、错题、统计全部挂在 `/practice` 下，保持题库模块主流程自洽
- `/settings/practice` 改为个人摘要页，只做最近练习和快捷入口

## 4.2 管理员路由

推荐补齐以下治理路由：

- `/admin/question-banks`
- `/admin/question-banks/:bankId`
- `/admin/questions/:questionId/snapshots`

说明：

- `/admin/question-banks` 是题库治理总台
- `/admin/question-banks/:bankId` 是单题库工作区
- 快照默认可先做抽屉/侧板查看；若内容过重，则支持继续跳转到独立快照页

## 4.3 设置页路由角色

`/settings/practice` 只保留：

- 最近练习摘要
- 最近错题提醒
- 进入历史、错题本、统计的跳转入口

不再放完整题库流程，不与 `/practice/*` 抢角色。

## 5. 页面职责设计

## 5.1 `/practice` 题库总入口

页面职责：

- 展示题库模块总览
- 提供方向、科目、章节、题型、难度、年份筛选
- 展示题库卡片列表
- 给出登录后能力入口：历史、错题本、统计
- 登录用户可看到最近训练摘要和累计数据摘要

页面结构：

- 顶部 `PageIntro`：强调“先选题库，再进入训练闭环”
- 第一屏左侧为筛选器，右侧为题库模块摘要卡
- 第二屏为题库列表卡片区
- 第三屏为登录用户专属摘要：最近训练、错题提醒、统计入口

设计原则：

- 首页不直接答题
- 首页不堆满历史明细
- 首页只做分流，不做大杂烩

## 5.2 `/practice/banks/:bankId` 单题库详情页

页面职责：

- 展示题库基础信息
- 展示章节、题型、难度、年份等二次过滤
- 展示题目预览
- 提供模式选择与开始练习入口
- 对游客给出登录引导，而不是静默禁用

页面结构：

- 顶部为题库主卡：题库名称、方向、科目、难度、题量、章节数、支持模式
- 主区为题目预览列表，按题目类型与章节组织
- 侧栏为模式配置器：`chapter` / `random` / `mock`
- 辅助区给出“去历史”“去错题”“去统计”的跨页入口，但不承载完整内容

交互原则：

- 题目预览可公开浏览
- 开始练习需要登录
- 用户从错题本重建会话时，可直接跳过本页，进入会话页

## 5.3 `/practice/sessions/:sessionId` 练习会话页

页面职责：

- 展示真实练习会话
- 支持逐题导航与续答
- 支持答案暂存与交卷
- 交卷后展示结果、错题与解析

页面结构：

- 左侧或顶部为会话状态条：模式、进度、已答数、剩余题数、提交状态
- 主区为当前题目作答区
- 辅助区为题号导航、标记、结果摘要

题型控件要求：

- 单选：选项按钮组
- 多选：可切换式选项组，前端统一拼接答案字符串
- 判断：二元选项控件
- 主观题：文本区域，失焦或显式保存时暂存

关键状态：

- 新会话创建
- 已有会话续答
- 正在暂存答案
- 已提交会话回放
- 无权限或会话不存在

设计原则：

- 会话页只做答题与回看
- 不再把题库筛选与历史记录混进来
- 结果态和作答态要明显区分

## 5.4 `/practice/history` 练习历史页

页面职责：

- 展示用户已提交练习历史
- 支持分页与筛选
- 支持从历史记录进入会话回放

页面结构：

- 顶部筛选条：模式、方向、科目、起止日期
- 主区为历史记录列表或表格
- 每条记录包含：题库名、模式、得分、正确率、提交时间、用时
- 行内提供“查看详情”动作，跳入对应 `sessionId`

设计原则：

- 这是复盘页，不是开始练习页
- 不在此页重新创建练习
- 分页与后端 page=1 起点保持一致

## 5.5 `/practice/wrong-questions` 错题本页

页面职责：

- 展示错题列表
- 支持筛选、批量勾选、局部重练、全量重练

页面结构：

- 顶部筛选区：方向、科目、章节、最少错误次数
- 工具栏：全选、本页重练、选中重练、当前筛选全部重练
- 主区为错题卡片或紧凑列表
- 每项展示：题干摘要、方向、科目、章节、知识点、错误次数、最近错误时间、最近作答

设计原则：

- 错题本是独立工作页，不塞回首页
- 重练动作先组装错题 ID，再调用 `rebuild-session`
- 分页与后端 page=0 起点保持一致

## 5.6 `/practice/statistics` 统计分析页

页面职责：

- 展示用户练习统计
- 支持粒度切换
- 同时展示趋势和高频错点

页面结构：

- 顶部摘要卡：练习次数、平均正确率、总时长
- 粒度切换：`day / week / month`
- 趋势图区域：练习次数与正确率双轴趋势
- 高频错点区域：柱状图 + 列表降级视图

设计原则：

- 这是诊断页，不是流水账
- 图表优先，但要保留文本/表格降级
- 对 `averageAccuracy = null` 的周期开窗要保留语义，不强行显示为 0

## 5.7 `/admin/question-banks` 题库治理总台

页面职责：

- 展示题库治理概览
- 提供题库筛选、状态统计、导入入口、待处理提示
- 进入单题库工作区

页面结构：

- 顶部治理摘要：题库总数、启用数、停用数、题目总量、最近导入异常
- 工具条：新建题库、快速筛选、导入说明
- 主区为题库卡片列表或紧凑行列表
- 每张卡至少展示：名称、方向、科目、难度、题量、状态、更新时间

设计原则：

- 总台先帮助管理员定位问题
- 不在这里直接堆满题目编辑表单
- 不照搬旧版后台大表格

## 5.8 `/admin/question-banks/:bankId` 单题库工作区

页面职责：

- 管理单个题库与其题目
- 承担题库编辑、题目分页、题目编辑、批量导入、批量更新、状态切换、快照查看

页面结构：

- 左侧或顶部信息栏：题库基础信息、启停、描述、快捷动作
- 主区：题目列表，支持分页、搜索、勾选、状态展示
- 右侧或抽屉：新建/编辑题目表单
- 辅助抽屉：批量导入、批量更新、版本快照

必须覆盖的能力：

- 题库创建、编辑、软删除、启停
- 题目创建、编辑、软删除、启停
- JSON 批量导入
- 文件导入
- 批量更新章节/难度/状态
- 查看题目快照

设计原则：

- 单库页是编辑台，不是海报页
- 主列表保持可扫读
- 重操作进入抽屉或侧板，不打断主上下文

## 6. 组件与模块拆分

推荐在 `frontendv2` 新增独立题库模块：

- `src/pages/practice/*`
- `src/components/practice/*`
- `src/hooks/practice/*`
- `src/lib/practice/*`
- `src/pages/admin/question-banks/*` 或保持现有 admin 目录下的 practice 子模块

### 6.1 组件建议

普通用户组件：

- `PracticeBankFilters`
- `PracticeBankCard`
- `PracticeModeConfigurator`
- `PracticeQuestionPreviewList`
- `PracticeSessionBoard`
- `PracticeQuestionNavigator`
- `PracticeResultPanel`
- `WrongQuestionToolbar`
- `PracticeStatisticsCards`

管理员组件：

- `QuestionBankGovernanceCard`
- `QuestionBankMetaPanel`
- `QuestionListTable`
- `QuestionEditorDrawer`
- `QuestionBatchImportPanel`
- `QuestionBatchUpdatePanel`
- `QuestionSnapshotDrawer`

### 6.2 逻辑建议

推荐抽离的逻辑：

- 题目选项解析
- 主观题类型判断
- 会话数据标准化
- 分页结构兼容
- 时间/时长格式化
- 题目状态与难度映射

## 7. 数据流与状态策略

## 7.1 前端 API 策略

继续复用：

- `practiceApi`
- `adminQuestionBankApi`

必要时只新增前端整形层，不新增平行 API。

## 7.2 普通用户状态流

游客流：

- `/practice`
- `/practice/banks/:bankId`
- 预览题目
- 点击开始练习时出现登录引导

登录用户流：

- 进入 `/practice`
- 筛选题库
- 进入 `/practice/banks/:bankId`
- 选择模式并创建会话
- 跳转 `/practice/sessions/:sessionId`
- 暂存答案
- 交卷
- 进入结果态
- 再进入历史 / 错题 / 统计

错题回流：

- `/practice/wrong-questions`
- 勾选错题
- 调用 `rebuild-session`
- 跳入 `/practice/sessions/:sessionId`

历史回放：

- `/practice/history`
- 打开某条记录
- 进入已提交会话回放态

## 7.3 管理员状态流

- `/admin/question-banks`
- 选中题库进入单库工作区
- 编辑题库元信息
- 维护题目列表
- 批量导入或批量更新
- 查看某题快照

## 7.4 降级与错误策略

必须覆盖以下情况：

- 未登录访问训练能力：给明确登录引导
- 会话不存在：给错误提示和返回入口
- 会话无权限：给提示并返回目录或历史
- 已提交会话再次保存：提示会话已结束
- 错题本为空：给“去练习”入口
- 历史为空：给“去开始第一次练习”入口
- 统计为空：解释为暂无训练数据，不显示报错
- 管理员导入部分成功：展示成功数、失败数和逐项错误

## 8. 关键业务规则对齐

前端必须明确对齐后端规则：

1. `chapter` / `random` / `mock` / `wrong_retry` 四种模式要完整映射。
2. 游客只能访问公开题库浏览接口，`/api/practice/**` 必须登录。
3. 错题本与管理员分页从 0 开始，历史分页从 1 开始。
4. 题库或题目停用后，公共可练列表自动隐藏，但历史和错题回放仍可依赖快照数据展示。
5. 主观题不计入自动判分时，前端结果视图不能误标为错误。
6. 历史详情必须回放原会话，不得误触发“新建会话”。

## 9. 测试策略

本次优先补 `frontendv2` 页面级与路由级测试，随后再做浏览器验证。

### 9.1 必测场景

普通用户：

1. 游客可以打开 `/practice` 和 `/practice/banks/:bankId`
2. 游客点击开始练习会被拦截
3. 登录用户可以从题库详情创建会话并跳入会话页
4. 会话页能区分新建会话与已有会话续答
5. 历史页、错题页、统计页能正确读取远端数据
6. 从历史进入时是回放，不是重开
7. 从错题本重建会话能正确跳转

管理员：

1. 管理员可进入 `/admin/question-banks`
2. 可进入单题库工作区
3. 题库编辑、状态切换、删除动作路由与交互正确
4. 题目批量导入、批量更新、快照查看具备基础交互测试

### 9.2 技术验证

- `frontendv2`：`npm test`
- `frontendv2`：`npm run build`
- 如条件允许，再跑一轮本地浏览器验证普通用户与管理员完整路线

## 10. 分阶段实施建议

### Phase A

- 补齐题库模块路由
- 重写 `/practice` 和 `/practice/banks/:bankId`
- 改造 `/settings/practice` 为摘要页

### Phase B

- 实现 `/practice/sessions/:sessionId`
- 打通新建会话、续答、暂存、交卷、结果态

### Phase C

- 实现 `/practice/history`
- 实现 `/practice/wrong-questions`
- 实现 `/practice/statistics`

### Phase D

- 实现 `/admin/question-banks`
- 实现 `/admin/question-banks/:bankId`
- 打通题库、题目、批量导入、批量更新、快照查看

### Phase E

- 回归测试
- 本地浏览器验证
- 收敛视觉细节与文案

## 11. 设计结论

本次不是把旧版题库页原样复制到 `frontendv2`，而是：

1. 保留旧版和后端已经验证过的完整功能边界。
2. 用 `frontendv2` 当前主站式布局语言重组题库模块。
3. 把题库浏览、题目预览、答题会话、历史复盘、错题重练、统计分析拆成职责清晰的独立页面。
4. 把管理员端从旧版大表格页升级为治理总台与单库编辑台。
5. 通过清晰路由和模块拆分，为后续实现和维护降低复杂度。

## 12. 本次假设

1. 仓库根目录当前未找到 `CLAUDE.md`，本设计基于现有代码、`AGENTS.md` 指令和后端模块文档推进。
2. 练习会话新路由采用 `/practice/sessions/:sessionId`，允许在实现阶段做兼容跳转，而不是继续依赖旧版查询参数表达。
3. 统计、历史、错题的主要内容页归属题库模块；设置页只保留摘要入口。
