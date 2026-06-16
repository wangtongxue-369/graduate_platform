# frontendv2 就业模块补齐与重构设计
日期：2026-06-16

主题：对齐当前 `frontend + backend` 已实现的就业模块完整能力，在 `frontendv2 + backend` 中补齐普通用户与管理员的就业板块，并在不照搬旧版页面布局的前提下，重做信息架构、布局组织、控件选型与操作层级。

## 1. 目标

本次设计只覆盖 `frontendv2` 的就业模块，不扩散到社区、考研、考公、留学等其他方向，也不借此改动就业后端接口契约。

本次设计的目标是：

1. 以当前 `frontend` 的就业模块和后端就业接口为唯一功能基线，完整补齐 `frontendv2` 中普通用户与管理员的就业能力。
2. 保留 `frontendv2` 现有壳层、主题变量、信息密度和页面语义，不复制旧版 `frontend` 的页面编排、表单上下结构和详情页布局。
3. 采用“主工作区常显 + 侧边工具收束 + 低频动作抽屉/弹窗化”的路线，把就业模块从预览页补齐为真实工作台。
4. 普通用户端形成“总览 -> 简历 -> 推荐 -> 投递 -> 招聘会”的闭环；管理员端形成“概览 -> 对象切换 -> 运营工作区”的闭环。
5. 在不新增后端接口的前提下，复用现有 `employmentApi` 和 `adminEmploymentApi` 完成全部真实数据读写、触发提醒、附件管理和状态维护。

## 2. 真实能力基线与当前缺口

本次设计只以下列真实实现为准：

- 旧版普通用户就业页：`frontend/src/pages/job/JobPage.jsx`
- 旧版招聘会页：`frontend/src/pages/job/CareerFairPage.jsx`
- 旧版招聘会详情页：`frontend/src/pages/job/CareerFairDetailPage.jsx`
- 旧版简历页：`frontend/src/pages/job/ResumePage.jsx`
- 旧版推荐页：`frontend/src/pages/job/JobRecommendPage.jsx`
- 旧版岗位详情页：`frontend/src/pages/job/JobPostingDetailPage.jsx`
- 旧版投递跟踪页：`frontend/src/pages/job/ApplicationTrackingPage.jsx`
- 旧版管理员就业页：`frontend/src/pages/admin/EmploymentManagementPage.jsx`
- 当前 `frontendv2` 就业页占位实现：`frontendv2/src/pages/student/job/JobStationPage.jsx`
- 当前 `frontendv2` 管理员就业占位实现：`frontendv2/src/pages/admin/AdminMainPage.jsx`
- 后端学生接口：`backend/src/main/java/com/graduateplatform/job/controller/EmploymentController.java`
- 后端管理员接口：`backend/src/main/java/com/graduateplatform/job/controller/AdminEmploymentController.java`
- 现有接口说明：`docs/employment-module-guide.md`
- 现有 API 封装：`frontend/src/lib/api.js`

### 2.1 旧版普通用户真实能力

旧版 `frontend` 已经覆盖以下普通用户能力：

- 就业主站入口总览
- 招聘会列表、筛选、详情、外链申请
- 就业提醒偏好保存
- 在线简历字段编辑、页面预览、导出 Word/PDF
- 简历附件上传、下载、替换、删除
- 岗位推荐筛选、匹配原因展示、岗位详情
- 站内就业提醒列表、标记已读、删除
- 从推荐或详情页把岗位带入投递跟踪
- 投递记录新增、编辑、删除、状态维护、面试节点维护
- 投递页查看当前简历附件状态并下载附件

### 2.2 旧版管理员真实能力

旧版管理员就业页已经覆盖以下管理员能力：

- 招聘会 CRUD、启停、分页筛选
- 岗位 CRUD、启停、分页筛选
- 从招聘会或岗位触发匹配站内提醒
- 查看用户简历附件安全元数据汇总
- 查看就业模块顶部统计数据

### 2.3 后端真实能力边界

后端就业模块当前已支持：

- 招聘会列表/分页/详情
- 岗位列表/分页/详情
- 当前用户就业偏好读取与保存
- 当前用户在线简历读取与保存
- 当前用户简历附件上传、下载、删除
- 在线简历导出 Word/PDF
- 岗位推荐读取
- 当前用户投递记录 CRUD
- 当前用户站内提醒列表、标记已读、删除
- 管理员招聘会 CRUD
- 管理员岗位 CRUD
- 管理员简历附件状态只读汇总
- 管理员手动触发提醒

本次前端补齐不得假设新的后端接口存在。

### 2.4 当前 frontendv2 的缺口

当前 `frontendv2` 就业模块存在以下问题：

1. 学生端五个页面都塞在 `frontendv2/src/pages/student/job/JobStationPage.jsx` 单文件中，已经是预览页结构，不适合继续叠加真实交互。
2. 就业主站、简历、推荐、投递、招聘会页面大多是只读预览，缺失真实保存、创建、编辑、删除、导出、上传和详情交互。
3. 推荐页未打通岗位详情抽屉、通知已读、加入投递跟踪确认流程。
4. 投递页仍停留在时间线预览，没有真实新增/编辑抽屉、状态分组工作区和删除确认。
5. 招聘会页还没有把“提醒偏好维护”做成真实可用工具层。
6. 管理员 `/admin/employment` 仍是通用后台占位页，不具备任何真实就业治理能力。

## 3. 核心设计方向

本次采用已确认的 **A. 推进台型 / Workflow Console** 方向。

学生端与管理员端统一遵循“数据密集，但只让当前任务上屏”的原则。参考 `ui-ux-pro-max` 推荐的 `Data-Dense + Drill-Down` 模式，但视觉上不切换到另一套全新品牌语言，而是继续复用 `frontendv2` 当前的玻璃纸面、浅深色主题变量、圆角与 `PageIntro` 节奏。

具体设计结论如下：

- 学生端：主区永远保留当前任务内容，侧边栏只保留筛选、提醒、附件状态、偏好摘要等工具信息。
- 管理员端：不再做“旧版表单 + 列表 + 表单 + 列表”的并排堆叠，而是改为“顶部指标 + 对象切换 + 左侧数据源列表 + 右侧编辑/说明工作区”。
- 低频或打断性动作进入抽屉/弹窗，而不是一直占据页面。
- 详情能力不再依赖旧版的独立详情页布局，而是通过抽屉承载真实详情。

## 4. 路由与页面结构

### 4.1 学生端保留现有路由骨架

继续使用以下 `frontendv2` 路由，不新增新的公开独立详情页：

- `/station/job`
- `/station/job/resume`
- `/station/job/recommendations`
- `/station/job/applications`
- `/station/job/fairs`

说明：

- 招聘会详情和岗位详情不再做独立整页，而改为页内详情抽屉。
- 从推荐页进入投递跟踪时，仍允许使用 URL 查询参数预填草稿，保证刷新后上下文不丢失。
- 页面间跳转仍保留 `PageIntro` 路径面包屑与站内壳层一致性。

### 4.2 管理员端保留单入口

管理员端继续使用：

- `/admin/employment`

但页面职责改为真实就业运营工作台，而不是通用后台占位页。

## 5. 学生端页面职责与布局

## 5.1 `/station/job` 就业主站

页面职责：

- 展示当前求职推进状态，而不是只做模块预告
- 汇总简历、投递、招聘会、通知四类真实摘要
- 给出下一步可执行动作入口

页面布局：

- 顶部 `PageIntro`：强调“先看推进概况，再进入对应工作区”
- 主区第一屏为四张关键状态卡：
  - 简历完成度
  - 待跟进行动数
  - 最近面试/招聘会节点
  - 未读就业提醒数
- 主区第二屏为四张真实模块入口卡：
  - 简历中心
  - 岗位推荐
  - 投递跟踪
  - 招聘会目录
- 右侧工具栏保留两个工具卡：
  - 今日推进建议
  - 最近提醒摘要

显示策略：

- 常显：摘要卡、模块入口、最近提醒摘要
- 不做：巨大静态预览块、无操作意义的宣传式介绍板

## 5.2 `/station/job/resume` 简历中心

页面职责：

- 维护结构化在线简历
- 维护当前简历附件
- 支持预览和导出

页面布局：

- 顶部摘要条显示：
  - 目标岗位
  - 意向城市/行业
  - 附件状态
- 主工作区采用“编辑 / 预览”分段切换
- 编辑态主区采用“分节导航 + 表单卡片”结构
  - 分节导航：求职定位、教育经历、项目经历、实习经历、能力与总结
  - 桌面端为纵向分节导航
  - 中小屏收敛为折叠节卡片
- 预览态主区为单页简历排版预览，不常显
- 右侧工具卡包含：
  - 当前附件状态
  - 上传/替换入口
  - 下载附件
  - 删除附件
  - 导出菜单按钮：Word / PDF
  - 最近保存状态

控件选型：

- 编辑/预览：分段切换按钮
- 简历字段：分组表单
- 附件上传：带文件限制提示的文件选择控件
- 导出：单按钮下拉菜单
- 删除附件：确认弹窗

显示策略：

- 常显：结构化编辑表单、附件状态、导出入口
- 抽屉：不需要
- 弹窗：删除附件确认

功能要求：

- 保存在线简历
- 读取当前附件安全元数据
- 上传、替换、下载、删除附件
- 导出 Word/PDF
- 保留无真实 token 时的预演提示，但所有写操作仅在真实账号下开放

## 5.3 `/station/job/recommendations` 推荐工作区

页面职责：

- 查看真实岗位推荐结果
- 查看匹配原因
- 维护推荐筛选条件
- 管理就业提醒
- 从岗位进入投递跟踪

页面布局：

- 主区顶部摘要条显示：
  - 推荐数量
  - 当前最高匹配分
  - 未读提醒数
- 主区主体为岗位卡流，卡片展示：
  - 公司 / 岗位
  - 城市 / 行业 / 企业类型 / 岗位类型
  - 薪资
  - 匹配分
  - 匹配原因标签
  - 外链投递可用性
- 右侧工具栏分两卡：
  - 快速筛选卡
  - 就业提醒卡

控件选型：

- 快速筛选常显字段：
  - 关键词
  - 城市
  - 行业
  - 只看可直接投递
- 高级筛选收纳在可展开区域：
  - 岗位类型
  - 企业类型
  - 学历要求
  - 专业关键词
  - 技能标签
  - 薪资范围
- 就业提醒列表每条提供：
  - 打开关联对象
  - 标记已读
  - 删除

详情与动作策略：

- 点击岗位卡或“查看详情”打开岗位详情抽屉
- 抽屉内展示完整岗位字段与外链投递按钮
- “加入投递跟踪”先进入确认弹窗
- 确认后跳转到 `/station/job/applications`，并通过查询参数预填岗位快照，自动打开新增投递抽屉

显示策略：

- 常显：推荐卡流、快速筛选、提醒摘要
- 抽屉：岗位详情
- 弹窗：加入投递跟踪确认、删除提醒确认

功能要求：

- 打通 `employmentApi.recommendations`
- 打通 `employmentApi.posting`
- 打通 `employmentApi.notifications`
- 支持 `markNotificationRead`
- 支持 `deleteNotification`

## 5.4 `/station/job/applications` 投递跟踪工作区

页面职责：

- 管理真实投递记录
- 维护状态推进、面试节点和结果备注
- 查看当前附件状态
- 接收推荐页/岗位详情页带入的预填快照

页面布局：

- 顶部摘要条显示：
  - 投递总数
  - 当前附件状态
  - 近期待跟进数量
- 主区主体改为“状态分组看板”，而不是旧版大表单上方 + 列表下方
- 状态分组建议为四条泳道：
  - 待开始：`TODO`
  - 已投递推进中：`APPLIED` `SCREENING` `WRITTEN_TEST`
  - 面试中：`FIRST_INTERVIEW` `SECOND_INTERVIEW` `HR_INTERVIEW` `FINAL_INTERVIEW`
  - 已有结果：`OFFER` `ACCEPTED` `DECLINED` `REJECTED` `WITHDRAWN` `CLOSED`
- 每张投递卡展示：
  - 公司 / 岗位
  - 当前状态
  - 投递时间
  - 下一步时间
  - 关键备注
- 右侧工具栏保留：
  - 过滤条件卡
  - 当前简历附件状态卡
  - 即将到来的后续动作卡

控件选型：

- 新增投递：主按钮
- 新增/编辑：右侧抽屉表单
- 状态筛选：分段按钮
- 关键词筛选：搜索框
- 固定枚举项：
  - 投递状态：`select`
  - 面试轮次：`select`
  - 面试方式：`select`
- 可自定义文本：
  - 投递渠道：文本输入 + datalist 建议
- 删除记录：确认弹窗

抽屉表单结构：

- 基本信息
- 岗位快照
- 投递安排
- 面试安排
- 结果与备注

预填策略：

- 若 URL 中存在 `jobPostingId`、`companyName`、`jobTitle` 等查询参数，则页面初始化后自动打开“新增投递”抽屉
- 已有关联岗位快照作为默认值允许用户再编辑

显示策略：

- 常显：状态看板、筛选条件、附件状态
- 抽屉：新增/编辑投递
- 弹窗：删除确认、发现重复投递时的继续确认

功能要求：

- 打通投递记录 CRUD
- 打通当前简历附件下载
- 兼容后端“岗位被管理员修改后仍保留历史快照”的行为

## 5.5 `/station/job/fairs` 招聘会目录工作区

页面职责：

- 浏览招聘会
- 维护筛选条件
- 查看详情并跳转外链
- 维护就业提醒偏好

页面布局：

- 顶部摘要条显示：
  - 当前结果数
  - 偏好城市/行业摘要
  - 岗位/薪资偏好摘要
- 主区主体为招聘会目录流，每条展示：
  - 标题
  - 企业 / 城市 / 行业 / 地点
  - 开始时间 / 截止时间
  - 当前状态标签
  - 申请状态标签
- 右侧工具栏保留两卡：
  - 招聘会筛选卡
  - 偏好摘要卡

控件选型：

- 常显筛选：
  - 城市
  - 行业
  - 关键词
  - 是否包含过期招聘会
- 偏好摘要卡只常显摘要，不常显完整表单
- 点击“编辑提醒偏好”后打开偏好编辑弹窗
- 偏好编辑字段：
  - 城市
  - 行业
  - 岗位类型
  - 薪资范围
  - 企业类型

详情与动作策略：

- 点击招聘会卡打开详情抽屉
- 抽屉展示完整字段和外链报名按钮
- 偏好保存走弹窗表单，保存后刷新摘要卡

显示策略：

- 常显：目录流、筛选卡、偏好摘要
- 抽屉：招聘会详情
- 弹窗：偏好编辑、删除低频提醒时的确认复用通用弹窗

功能要求：

- 打通招聘会列表与详情
- 打通偏好读取与保存
- 明确区分“浏览筛选条件”和“提醒偏好”

## 6. 管理员端页面职责与布局

## 6.1 `/admin/employment` 就业运营工作台

页面职责：

- 展示就业运营总体指标
- 在同一入口内切换治理对象
- 对招聘会、岗位、提醒触达、简历状态进行集中治理

页面布局：

- 顶部 `PageIntro`：强调“先切换治理对象，再处理当前工作区”
- 第一屏常显指标卡：
  - 招聘会总数
  - 启用招聘会数
  - 岗位总数
  - 启用岗位数
  - 已上传简历附件人数
- 第二屏为对象切换带数量的分段标签：
  - 招聘会
  - 岗位
  - 提醒触达
  - 简历状态
- 第三屏为当前对象工作区

## 6.2 招聘会治理工作区

工作区结构：

- 左侧：招聘会列表与筛选
- 右侧：持久编辑面板

左侧列表职责：

- 搜索关键词
- 筛选启用状态
- 分页浏览
- 选择一条记录进入编辑态
- 行内动作：
  - 编辑
  - 触发提醒
  - 删除

右侧编辑面板职责：

- 新建招聘会
- 编辑当前招聘会
- 显示字段校验提示
- 保存或取消编辑

控件选型：

- 列表筛选：搜索框 + 状态分段按钮
- 是否启用：开关或分段切换
- 时间：`datetime-local`
- 描述：`textarea`
- 删除：确认弹窗
- 触发提醒：确认弹窗

显示策略：

- 桌面端：右侧持久编辑面板常显
- 中小屏：编辑面板自动降级为抽屉

## 6.3 岗位治理工作区

工作区结构与招聘会治理一致：

- 左侧：岗位列表与筛选
- 右侧：持久编辑面板

字段覆盖：

- 岗位名称
- 公司
- 城市
- 行业
- 企业类型
- 岗位类型
- 薪资范围
- 学历要求
- 专业关键词
- 技能标签
- 申请链接
- 描述
- 启用状态

行内动作：

- 编辑
- 触发提醒
- 删除

交互要求：

- 当后端因岗位被引用而将删除处理为停用时，前端只负责正确显示后端返回消息并刷新列表
- 不自行推断比后端更强的删除规则

## 6.4 提醒触达工作区

该工作区不是新数据源，而是对现有招聘会/岗位触发提醒能力的聚焦编排层。

工作区结构：

- 左侧：提醒源列表
  - 数据来源于当前已启用的招聘会与岗位
  - 可切换“招聘会源 / 岗位源”
  - 可按关键词过滤
- 右侧：提醒触发说明面板
  - 显示选中源对象的关键字段
  - 展示后端匹配规则说明
  - 展示上一次触发结果消息
  - 提供“立即触发提醒”按钮

说明：

- 后端当前没有“匹配用户预览”接口，因此前端不虚构命中名单
- 触发后只展示后端返回的 `createdCount` 与 `skippedDuplicateCount`
- 招聘会/岗位列表中的“触发提醒”快捷动作继续保留
- 该工作区的价值是把提醒操作从对象 CRUD 中抽离出来，降低管理认知切换成本

显示策略：

- 常显：提醒源列表、规则说明
- 弹窗：最终触发确认

## 6.5 简历状态工作区

工作区结构：

- 左侧：用户简历附件状态列表
- 右侧：安全元数据详情面板或抽屉

列表字段：

- 用户姓名
- 邮箱
- 学号
- 学校 / 专业
- 是否已上传
- 文件名
- 文件大小
- 文件类型
- 上传时间

交互约束：

- 只读
- 不提供下载
- 不提供上传/替换/删除
- 不展示 COS key、签名 URL、对象地址

显示策略：

- 常显：列表、筛选状态
- 抽屉：某一位用户的安全元数据详情

## 7. 显示策略总表

### 7.1 必须常显

- 学生端各页顶部摘要卡
- 当前筛选条件摘要
- 当前附件状态
- 当前未读提醒摘要
- 招聘会偏好摘要
- 管理员对象切换条
- 管理员当前对象主列表

### 7.2 使用抽屉

- 岗位详情
- 招聘会详情
- 投递新增/编辑表单
- 管理员中小屏的招聘会/岗位编辑器
- 简历状态详情

### 7.3 使用弹窗

- 删除附件确认
- 删除投递确认
- 删除提醒确认
- 删除招聘会/岗位确认
- 加入投递跟踪确认
- 提醒偏好编辑
- 管理员触发提醒确认
- 重复投递继续确认

## 8. 控件与交互选型原则

1. 高频切换状态使用分段按钮，不使用过重的顶部多层标签。
2. 高维度筛选采用“常显快速筛选 + 折叠高级筛选”，避免右栏被长表单填满。
3. 结构化编辑使用分节卡片，不做单个超长表单。
4. 详情信息通过抽屉承接，避免跳出当前工作流。
5. 破坏性动作全部二次确认。
6. 固定枚举优先 `select`，自由补充字段用输入框或 datalist 建议，不引入额外复杂自定义控件。

## 9. 前端模块拆分建议

本次补齐不应继续在 `JobStationPage.jsx` 单文件上叠加。

建议拆分如下：

- `frontendv2/src/pages/student/job/JobStationOverviewPage.jsx`
- `frontendv2/src/pages/student/job/JobResumePage.jsx`
- `frontendv2/src/pages/student/job/JobRecommendationsPage.jsx`
- `frontendv2/src/pages/student/job/JobApplicationsPage.jsx`
- `frontendv2/src/pages/student/job/JobFairsPage.jsx`
- `frontendv2/src/pages/admin/AdminEmploymentPage.jsx`
- `frontendv2/src/components/job/*`
- `frontendv2/src/hooks/job/*`
- `frontendv2/src/lib/job/*`

建议组件：

- `JobSummaryStrip`
- `JobWorkspaceEntryCard`
- `JobResumeSectionNav`
- `JobResumeAttachmentCard`
- `JobRecommendationFilters`
- `JobNotificationPanel`
- `JobPostingDetailDrawer`
- `JobApplicationEditorDrawer`
- `JobFairDetailDrawer`
- `JobPreferenceModal`
- `AdminEmploymentTabs`
- `AdminEmploymentSourceList`
- `AdminEmploymentEditorPanel`
- `AdminEmploymentTriggerPanel`
- `AdminResumeStatusDrawer`
- `EmploymentConfirmModal`

逻辑层建议抽离：

- 接口响应整形
- 投递状态分组映射
- 时间/文件大小格式化
- URL 查询参数预填解析
- 通知读写状态更新
- 管理员筛选与分页整形

## 10. API 映射

### 10.1 学生端

| 能力 | API |
| --- | --- |
| 招聘会列表 | `employmentApi.fairs(params)` |
| 招聘会详情 | `employmentApi.fairDetail(id)` |
| 岗位推荐 | `employmentApi.recommendations(params, token)` |
| 岗位详情 | `employmentApi.postingDetail(id)` |
| 就业偏好读取 | `employmentApi.preference(token)` |
| 就业偏好保存 | `employmentApi.savePreference(payload, token)` |
| 在线简历读取 | `employmentApi.resume(token)` |
| 在线简历保存 | `employmentApi.saveResume(payload, token)` |
| 附件上传 | `employmentApi.uploadResumeFile(file, token)` |
| 附件下载 | `employmentApi.downloadResumeFile(token)` |
| 附件删除 | `employmentApi.deleteResumeFile(token)` |
| 简历导出 | `employmentApi.exportResume(format, token)` |
| 投递列表 | `employmentApi.applications(token)` |
| 新增投递 | `employmentApi.createApplication(payload, token)` |
| 编辑投递 | `employmentApi.updateApplication(id, payload, token)` |
| 删除投递 | `employmentApi.deleteApplication(id, token)` |
| 提醒列表 | `employmentApi.notifications(token)` |
| 提醒已读 | `employmentApi.markNotificationRead(id, token)` |
| 提醒删除 | `employmentApi.deleteNotification(id, token)` |

### 10.2 管理员端

| 能力 | API |
| --- | --- |
| 招聘会列表/分页 | `adminEmploymentApi.fairs(params, token)` |
| 新增招聘会 | `adminEmploymentApi.createFair(payload, token)` |
| 编辑招聘会 | `adminEmploymentApi.updateFair(id, payload, token)` |
| 删除招聘会 | `adminEmploymentApi.deleteFair(id, token)` |
| 岗位列表/分页 | `adminEmploymentApi.jobs(params, token)` |
| 新增岗位 | `adminEmploymentApi.createJob(payload, token)` |
| 编辑岗位 | `adminEmploymentApi.updateJob(id, payload, token)` |
| 删除岗位 | `adminEmploymentApi.deleteJob(id, token)` |
| 简历状态列表 | `adminEmploymentApi.resumes(token)` |
| 触发提醒 | `adminEmploymentApi.triggerNotification(payload, token)` |

## 11. 状态、权限与异常策略

### 11.1 权限

- 学生端读写操作均要求真实登录账号
- 管理员端页面要求管理员身份
- 简历状态页严格只读

### 11.2 预演与降级

- 延续 `frontendv2` 当前 `previewDataNotice` / `remoteDataNotice` / `fallbackDataNotice` 的体验框架
- 无真实 token 或接口异常时，可显示只读预演或降级数据提示
- 但写操作按钮必须在提示层明确说明“仅真实账号可操作”

### 11.3 错误处理

- 上传、导出、保存、删除、触发提醒均显示明确反馈
- 空状态文案要指向下一步动作，而不是停留在空描述
- 对于后端已定义的业务校验错误，前端直接透传消息，不二次改写业务含义

## 12. 测试与验证

至少覆盖以下验证点：

### 12.1 学生端页面测试

- 就业主站能读取真实摘要并展示模块入口
- 简历页支持编辑/预览切换、附件状态展示和导出入口
- 推荐页仅在侧栏保留筛选与提醒，岗位详情走抽屉
- 推荐页可标记已读、删除提醒，并能把岗位带入投递页
- 投递页以状态看板展示，新增/编辑走抽屉
- 招聘会页只常显筛选与偏好摘要，完整偏好编辑走弹窗

### 12.2 管理员端页面测试

- `/admin/employment` 不再渲染通用占位页
- 对象切换条存在且可切换四个工作区
- 招聘会和岗位工作区在桌面端使用列表 + 右侧编辑面板
- 中小屏编辑器可降级为抽屉
- 简历状态工作区保持只读，不出现下载或删除按钮
- 提醒触发支持确认后执行并展示后端返回结果

### 12.3 集成验证

- 路由加载通过
- 表单保存/删除/触发提醒流程通过
- `npm test` 相关页面测试通过
- `npm run build` 通过
- 实现完成后使用本地浏览器做一次就业模块真实交互核验

## 13. 明确不做的事项

本次设计不包含：

- 新增后端接口
- 简历附件解析
- 多版本简历库
- 平台内自动投递
- 管理员下载学生简历附件
- 新建独立岗位详情页或招聘会详情页
- 改造整个 `frontendv2` 的全局主题系统

## 14. 成功标准

满足以下条件即可视为本次设计成功：

1. `frontendv2` 就业模块普通用户与管理员能力与旧版功能基线对齐。
2. 学生端各页不再是预览页，而是可完成真实数据闭环的工作区。
3. 管理员 `/admin/employment` 不再是通用占位页，而是实际可治理招聘会、岗位、提醒触达和简历状态的运营台。
4. 详情、低频编辑和破坏性动作都被放入更合理的抽屉/弹窗层级，没有再回到旧版“所有东西都铺在页面上”的结构。
5. 页面仍保持 `frontendv2` 的现有壳层与主题语言，不会看起来像从旧版直接搬运过来的另一套站点。
