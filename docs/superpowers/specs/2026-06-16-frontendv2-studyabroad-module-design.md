# frontendv2 留学模块补齐与重构设计

日期：2026-06-16

主题：对齐当前 `frontend + backend` 已实现的留学模块完整能力，在 `frontendv2 + backend` 中补齐普通用户与管理员的留学板块，并在不照搬旧版页面布局的前提下，重做信息架构、布局组织、控件选型与操作层级。

## 1. 目标

本次设计只覆盖 `frontendv2` 的留学模块，不扩展到社区、考研、考公、就业等其他方向，也不借此改动留学后端接口契约。

本次设计的目标是：

1. 以当前 `frontend` 留学模块和后端留学接口为唯一功能基线，完整补齐 `frontendv2` 中普通用户与管理员的留学能力。
2. 保留 `frontendv2` 现有的壳层、路由语义、配色变量和页面节奏，不复制旧版 `frontend` 的表单堆叠方式、列表排布和详情页结构。
3. 采用“总览调度台 + 深度子页 + 抽屉/弹窗低频操作”的结构，把留学模块从预览页补齐为真实可用的工作台。
4. 普通用户侧形成“总览 -> 项目目录/案例判断 -> 申请推进 -> 时间线 -> 材料 -> 经验沉淀”的闭环；管理员侧形成“总览 -> 对象切换 -> 深度管理子页”的闭环。
5. 在不新增后端接口的前提下，复用现有 `studyAbroadApi` 与 `adminStudyAbroadApi` 完成全部真实数据读写、附件操作、内容管理与统计展示。

## 2. 功能基线与当前缺口

本次设计只以下列真实实现为准：

- 旧版普通用户页面：
  - `frontend/src/pages/studyabroad/StudyAbroadPage.jsx`
  - `frontend/src/pages/studyabroad/SchoolDirectoryPage.jsx`
  - `frontend/src/pages/studyabroad/AdmissionCasesPage.jsx`
  - `frontend/src/pages/studyabroad/ApplicationsPage.jsx`
  - `frontend/src/pages/studyabroad/TimelinePage.jsx`
  - `frontend/src/pages/studyabroad/SAMaterialsPage.jsx`
  - `frontend/src/pages/studyabroad/ExperiencePage.jsx`
- 旧版管理员页面：
  - `frontend/src/pages/admin/AdminStudyAbroadPage.jsx`
- 当前 `frontendv2` 留学页面：
  - `frontendv2/src/pages/student/studyabroad/StudyAbroadStationPage.jsx`
- 后端用户接口：
  - `backend/src/main/java/com/graduateplatform/studyabroad/controller/StudyAbroadController.java`
- 后端管理员接口：
  - `backend/src/main/java/com/graduateplatform/admin/controller/AdminStudyAbroadController.java`
- 当前前端 API 封装：
  - `frontend/src/lib/api.js`

### 2.1 旧版普通用户真实能力

旧版 `frontend` 已经覆盖以下普通用户能力：

- 留学主站总览入口
- 院校项目目录分页浏览与筛选
- 录取案例分页浏览、筛选、匿名提交、本人删除
- 申请项目 CRUD
- 时间线节点 CRUD 与状态切换
- 材料清单 CRUD
- 材料附件上传、下载、删除
- 留学经验分页浏览、筛选、发布、编辑、删除

### 2.2 旧版管理员真实能力

旧版管理员留学页已经覆盖以下管理员能力：

- 留学后台统计概览
- 院校项目分页筛选、创建、编辑、删除
- 录取案例分页筛选、删除
- 留学经验分页筛选、删除

### 2.3 后端真实能力边界

后端留学模块当前已支持：

- `GET /api/studyabroad/schools/page`
- `GET /api/studyabroad/admission-cases/page`
- `POST /api/studyabroad/admission-cases`
- `DELETE /api/studyabroad/admission-cases/{id}`
- `GET /api/studyabroad/experiences`
- `GET /api/studyabroad/experiences/page`
- `POST /api/studyabroad/experiences`
- `PUT /api/studyabroad/experiences/{id}`
- `DELETE /api/studyabroad/experiences/{id}`
- `GET /api/studyabroad/applications`
- `POST /api/studyabroad/applications`
- `PUT /api/studyabroad/applications/{id}`
- `DELETE /api/studyabroad/applications/{id}`
- `GET /api/studyabroad/timeline`
- `POST /api/studyabroad/timeline`
- `PUT /api/studyabroad/timeline/{id}`
- `DELETE /api/studyabroad/timeline/{id}`
- `GET /api/studyabroad/materials`
- `POST /api/studyabroad/materials`
- `PUT /api/studyabroad/materials/{id}`
- `DELETE /api/studyabroad/materials/{id}`
- `POST /api/studyabroad/materials/{id}/attachments`
- `GET /api/studyabroad/materials/{materialId}/attachments/{attachmentId}/download`
- `DELETE /api/studyabroad/materials/{materialId}/attachments/{attachmentId}`
- `GET /api/admin/studyabroad/dashboard`
- `GET /api/admin/studyabroad/schools`
- `POST /api/admin/studyabroad/schools`
- `PUT /api/admin/studyabroad/schools/{id}`
- `DELETE /api/admin/studyabroad/schools/{id}`
- `GET /api/admin/studyabroad/admission-cases`
- `DELETE /api/admin/studyabroad/admission-cases/{id}`
- `GET /api/admin/studyabroad/experiences`
- `DELETE /api/admin/studyabroad/experiences/{id}`

本次前端补齐不得假设新的后端接口存在。

### 2.4 当前 frontendv2 的缺口

当前 `frontendv2` 留学模块存在以下问题：

1. 所有学生留学页面都塞在 `StudyAbroadStationPage.jsx` 单文件中，结构偏预览页，不适合继续叠加真实交互。
2. 当前总览、项目目录、案例、申请、时间线、材料页面大多是只读浏览，缺失真实创建、编辑、删除与附件操作。
3. `frontendv2` 还没有独立的留学经验页面，经验能力缺失。
4. `frontendv2` 还没有管理员留学总览页和留学管理子页。
5. 当前页面虽然做了 `preview / remote / fallback` 机制，但写入型能力没有完成真实落地。

## 3. 核心设计方向

本次采用已确认的 **Command Deck** 方向。

这意味着：

- 普通用户主站是“推进优先的双模式工作台”，默认先看申请推进，再暴露项目目录和案例判断入口。
- 管理员后台是“总览调度页 + 独立子页”的混合结构，而不是一个把所有内容硬塞在一起的标签页。
- 高频浏览信息保持常显；低频编辑、删除确认、内容提交与附件操作尽量进入抽屉或弹窗。

参考 `ui-ux-pro-max` 的建议，本次视觉和信息密度采用：

- 模式：`data-dense dashboard`
- 主题方向：`editorial command deck`
- 关键词：冷静、专业、档案感、跨境申请工作台

但不直接照搬通用 SaaS 仪表盘视觉，而是转译为适合“留学申请推进”的界面语言。

## 4. 视觉与交互语言

### 4.1 视觉基调

建议留学模块使用以下视觉方向：

- 深墨色标题与导航强调
- 纸张感浅背景承载高密度信息
- 强对比状态色标记风险、完成、截止与主操作
- 少量档案标签、章戳式状态块，强化“申请资料夹”气质

### 4.2 字体与层级

- 标题：更有识别度的窄体或等宽感展示字体，强调“标签 / 卡片抬头 / 数据头部”
- 正文：高可读无衬线字体
- 数字与状态：可使用半等宽或等宽感样式增强秩序感

### 4.3 组件语言

- 总览卡：薄边框、高对比标题、小注释
- 状态标签：短句、档案章戳感、小块高识别
- 筛选器：控制台感更强，不做传统“长搜索表单”
- 详情查看：优先右侧抽屉
- 低频编辑：优先抽屉
- 破坏性动作：确认弹窗单独高亮

### 4.4 可访问性与行为约束

基于 `ui-ux-pro-max` 的规则，本次必须满足：

1. 所有输入控件都有明确 `label`
2. 深层子页带 breadcrumb
3. 提交型操作都有 `loading / success / error`
4. 搜索与快速过滤使用 `useDeferredValue` 或防抖
5. 动画只用于进入、展开、状态切换，不使用持续装饰动画
6. 支持 `prefers-reduced-motion`
7. 标题层级遵循顺序，不跳级

## 5. 路由结构

### 5.1 普通用户路由

保留现有路由并新增经验页：

- `/station/studyabroad`
- `/station/studyabroad/programs`
- `/station/studyabroad/cases`
- `/station/studyabroad/applications`
- `/station/studyabroad/timeline`
- `/station/studyabroad/materials`
- `/station/studyabroad/experiences`

说明：

- 经验能力必须拆出独立页面，不继续塞在其他页面中。
- 现有总览和 5 个子页继续保留，但重做内部结构。

### 5.2 管理员路由

新增以下后台路由：

- `/admin/studyabroad`
- `/admin/studyabroad/programs`
- `/admin/studyabroad/cases`
- `/admin/studyabroad/experiences`

说明：

- 总览页负责调度，不承载全部深度编辑。
- 深度管理进入对应子页完成。

## 6. 普通用户页面职责与布局

### 6.1 `/station/studyabroad` 留学总览调度台

页面职责：

- 展示当前用户的申请推进态势
- 暴露风险与阻塞
- 引导进入最该处理的下一页
- 同屏保留项目目录与案例档案入口

页面布局：

- 顶部 `PageIntro`
- 第一屏状态卡：
  - 在申项目
  - 最近截止
  - 材料缺口
  - 完成率
- 中部左侧：
  - 申请推进泳道
- 中部右侧：
  - 行动面板
  - 快捷动作：
    - 新建申请
    - 新增时间线节点
    - 新增材料
    - 发布经验
    - 提交案例
- 底部：
  - 项目目录速览
  - 相似案例速览
  - 风险带（逾期节点与未完成材料）

交互策略：

- 所有快捷新增动作通过抽屉或弹窗完成
- 从这里出去的路径都以“继续推进”为目的，而不是单纯浏览

### 6.2 `/station/studyabroad/programs` 项目目录页

页面职责：

- 做项目筛选
- 做项目比较
- 查看院校项目详情
- 帮助用户形成选校判断

页面布局：

- 左侧固定筛选器：
  - 国家 / 地区
  - 学科方向
  - 只看合作项目
  - 关键词
- 主区：
  - 项目卡片墙
- 可选对比带：
  - 支持选 2 到 3 个项目快速对比

详情策略：

- 点击项目卡片打开详情抽屉
- 抽屉展示：
  - 排名
  - 学费
  - 学制
  - 截止说明
  - 申请要求
  - 签证政策
  - 就业政策
  - 合作说明
  - 风险标签与风险摘要

### 6.3 `/station/studyabroad/cases` 案例档案页

页面职责：

- 浏览录取与拒信案例
- 筛选相似背景案例
- 进行匿名案例提交

页面布局：

- 顶部紧凑筛选条：
  - 国家 / 地区
  - 结果
  - 本科专业
  - 关键词
- 主区：
  - 案例卡片流
- 右侧或抽屉：
  - 当前选中案例详情

详情展示：

- 学校 / 项目 / 年份
- 本科背景
- GPA / 排名 / 语言成绩 / 标化成绩
- 软背景
- 标签
- 结果
- 总结

提交策略：

- “提交案例”走弹窗，不与列表混排
- 表单分组：
  - 背景
  - 申请信息
  - 结果与总结

### 6.4 `/station/studyabroad/applications` 申请推进页

页面职责：

- 管理申请项目 CRUD
- 推进项目状态与优先级
- 统一承接总览页“新建申请”动作

页面布局：

- 顶部摘要条：
  - 全部项目
  - 已提交 / 已出结果
  - Offer 数
  - 最近截止
- 主区默认：
  - 申请看板
- 可切换视图：
  - 列表视图
- 侧边工具区：
  - 状态筛选
  - 优先级筛选
  - 关键词

编辑策略：

- 新建 / 编辑通过右侧抽屉
- 删除走确认弹窗

### 6.5 `/station/studyabroad/timeline` 时间线页

页面职责：

- 管理时间线节点 CRUD
- 切换节点状态
- 突出逾期与即将到期事项

页面布局：

- 顶部筛选：
  - 阶段
  - 状态
  - 关键词
- 主区：
  - 纵向时间轨

节点展示：

- 标题
- 阶段
- 状态
- 截止日
- 备注
- 关联申请项目

编辑策略：

- 节点编辑可用抽屉
- 新增节点用弹窗
- 状态切换可在卡片上直接操作

### 6.6 `/station/studyabroad/materials` 材料页

页面职责：

- 管理材料条目 CRUD
- 切换完成状态
- 管理附件上传、下载、删除

页面布局：

- 顶部摘要条：
  - 材料总数
  - 已完成数
  - 附件数
  - 当前筛选结果数
- 右侧筛选：
  - 国家 / 地区
  - 阶段
  - 完成状态
  - 关键词
- 主区：
  - 材料检查板

卡片结构：

- 名称
- 阶段
- 类型
- 截止
- 完成状态
- 附件数
- 展开后展示备注、关联项目与附件列表

附件策略：

- 在材料卡片展开区内完成上传、下载、删除
- 不做单独附件页面

### 6.7 `/station/studyabroad/experiences` 留学经验页

页面职责：

- 浏览公开经验
- 筛选主题与国家
- 发布、编辑、删除自己的经验

页面布局：

- 顶部筛选区：
  - 国家 / 地区
  - 主题
  - 关键词
  - 主题标签快捷切换
- 主区：
  - 经验阅读流
- 详情策略：
  - 点击后打开全文弹层或详情页

编辑策略：

- 发布经验走抽屉或弹窗
- 编辑与删除仅对本人可见

## 7. 管理员页面职责与布局

### 7.1 `/admin/studyabroad` 留学总览调度页

页面职责：

- 展示留学内容库规模与近期状态
- 引导管理员进入具体管理对象

页面布局：

- 顶部 `PageIntro`
- 第一屏统计卡：
  - 院校项目数
  - 案例数
  - 经验数
- 第二屏：
  - 最近新增内容摘要
  - 快捷入口：
    - 管理院校项目
    - 管理案例
    - 管理经验

### 7.2 `/admin/studyabroad/programs` 院校项目管理页

页面职责：

- 对院校项目进行筛选、创建、编辑、删除

页面布局：

- 顶部筛选工具条：
  - 国家 / 地区
  - 学科方向
  - 合作项目
  - 关键词
- 主区：
  - 列表 / 卡片切换
- 右侧：
  - 编辑抽屉

编辑策略：

- 新建和编辑都走抽屉
- 删除走确认弹窗

### 7.3 `/admin/studyabroad/cases` 案例管理页

页面职责：

- 分页筛选案例
- 查看详细背景
- 删除案例

页面布局：

- 顶部筛选：
  - 国家 / 地区
  - 结果
  - 专业
  - 关键词
- 主区：
  - 案例列表
- 右侧：
  - 详情抽屉

说明：

- 这里是内容管理页，不做内联编辑
- 保持“查看 + 删除”的低风险治理模型

### 7.4 `/admin/studyabroad/experiences` 经验管理页

页面职责：

- 分页筛选经验
- 查看经验内容详情
- 删除经验

页面布局：

- 顶部筛选：
  - 国家 / 地区
  - 主题
  - 关键词
- 主区：
  - 经验列表
- 右侧：
  - 详情抽屉

说明：

- 同样不做管理员代编辑，只做治理与清理

## 8. 权限边界

### 8.1 游客

- 可浏览：
  - 项目目录
  - 案例档案
  - 留学经验
- 不可操作：
  - 创建申请
  - 创建时间线
  - 创建材料
  - 上传附件
  - 发布经验
  - 提交案例

### 8.2 登录普通用户

- 可管理自己的：
  - applications
  - timeline
  - materials
  - material attachments
  - experiences
  - admission cases

### 8.3 管理员

- 可访问：
  - `/admin/studyabroad*`
- 可管理：
  - 院校项目
  - 案例内容
  - 经验内容
  - 统计总览

## 9. API 映射

### 9.1 普通用户

| 能力 | API |
| --- | --- |
| 项目目录分页 | `studyAbroadApi.schoolProgramsPage(params)` |
| 案例分页 | `studyAbroadApi.admissionCasesPage(params)` |
| 提交案例 | `studyAbroadApi.createAdmissionCase(payload, token)` |
| 删除本人案例 | `studyAbroadApi.deleteAdmissionCase(id, token)` |
| 经验分页 | `studyAbroadApi.experiencesPage(params)` |
| 发布经验 | `studyAbroadApi.createExperience(payload, token)` |
| 编辑经验 | `studyAbroadApi.updateExperience(id, payload, token)` |
| 删除经验 | `studyAbroadApi.deleteExperience(id, token)` |
| 申请列表 | `studyAbroadApi.applications(token)` |
| 新建申请 | `studyAbroadApi.createApplication(payload, token)` |
| 编辑申请 | `studyAbroadApi.updateApplication(id, payload, token)` |
| 删除申请 | `studyAbroadApi.deleteApplication(id, token)` |
| 时间线列表 | `studyAbroadApi.timeline(token)` |
| 新建时间线 | `studyAbroadApi.createTimeline(payload, token)` |
| 编辑时间线 | `studyAbroadApi.updateTimeline(id, payload, token)` |
| 删除时间线 | `studyAbroadApi.deleteTimeline(id, token)` |
| 材料列表 | `studyAbroadApi.materials(token)` |
| 新建材料 | `studyAbroadApi.createMaterial(payload, token)` |
| 编辑材料 | `studyAbroadApi.updateMaterial(id, payload, token)` |
| 删除材料 | `studyAbroadApi.deleteMaterial(id, token)` |
| 上传附件 | `studyAbroadApi.uploadMaterialAttachments(materialId, files, token, onProgress)` |
| 下载附件 | `studyAbroadApi.downloadMaterialAttachment(materialId, attachmentId, token)` |
| 删除附件 | `studyAbroadApi.deleteMaterialAttachment(materialId, attachmentId, token)` |

### 9.2 管理员

| 能力 | API |
| --- | --- |
| 总览统计 | `adminStudyAbroadApi.dashboard(token)` |
| 院校项目分页 | `adminStudyAbroadApi.schools(params, token)` |
| 新建院校项目 | `adminStudyAbroadApi.createSchool(payload, token)` |
| 编辑院校项目 | `adminStudyAbroadApi.updateSchool(id, payload, token)` |
| 删除院校项目 | `adminStudyAbroadApi.deleteSchool(id, token)` |
| 案例分页 | `adminStudyAbroadApi.admissionCases(params, token)` |
| 删除案例 | `adminStudyAbroadApi.deleteAdmissionCase(id, token)` |
| 经验分页 | `adminStudyAbroadApi.experiences(params, token)` |
| 删除经验 | `adminStudyAbroadApi.deleteExperience(id, token)` |

## 10. 状态、异常与降级策略

### 10.1 只读降级

- 项目目录、案例、经验等页面可继续保留 `preview / remote / fallback` 机制
- 后端不可用时可回退到预览数据或演示数据，但必须明确标注数据来源

### 10.2 写入限制

- 所有创建、编辑、删除、上传操作都必须基于真实登录态
- 写入失败时明确报错，不允许伪装成功

### 10.3 提交反馈

所有提交型动作统一具备：

- 进行中状态
- 成功提示
- 失败提示

### 10.4 破坏性操作

以下动作必须二次确认：

- 删除申请
- 删除时间线节点
- 删除材料
- 删除附件
- 删除经验
- 删除案例
- 管理员删除院校项目
- 管理员删除案例
- 管理员删除经验

## 11. 前端模块拆分建议

本次不应继续在 `StudyAbroadStationPage.jsx` 单文件上堆功能。

建议拆分如下：

- `frontendv2/src/pages/student/studyabroad/StudyAbroadOverviewPage.jsx`
- `frontendv2/src/pages/student/studyabroad/StudyAbroadProgramsPage.jsx`
- `frontendv2/src/pages/student/studyabroad/StudyAbroadCasesPage.jsx`
- `frontendv2/src/pages/student/studyabroad/StudyAbroadApplicationsPage.jsx`
- `frontendv2/src/pages/student/studyabroad/StudyAbroadTimelinePage.jsx`
- `frontendv2/src/pages/student/studyabroad/StudyAbroadMaterialsPage.jsx`
- `frontendv2/src/pages/student/studyabroad/StudyAbroadExperiencesPage.jsx`
- `frontendv2/src/pages/admin/AdminStudyAbroadOverviewPage.jsx`
- `frontendv2/src/pages/admin/AdminStudyAbroadProgramsPage.jsx`
- `frontendv2/src/pages/admin/AdminStudyAbroadCasesPage.jsx`
- `frontendv2/src/pages/admin/AdminStudyAbroadExperiencesPage.jsx`
- `frontendv2/src/components/studyabroad/*`
- `frontendv2/src/lib/studyabroad/*`

建议组件：

- `StudyAbroadCommandDeck`
- `StudyAbroadActionPanel`
- `StudyAbroadProgramCompareRail`
- `StudyAbroadProgramDetailDrawer`
- `StudyAbroadCaseSubmitModal`
- `StudyAbroadApplicationEditorDrawer`
- `StudyAbroadTimelineEditorModal`
- `StudyAbroadMaterialEditorDrawer`
- `StudyAbroadAttachmentPanel`
- `StudyAbroadExperienceComposerDrawer`
- `AdminStudyAbroadSummaryStrip`
- `AdminStudyAbroadFilters`
- `AdminStudyAbroadDetailDrawer`

## 12. 测试与验证

至少覆盖以下验证点：

### 12.1 普通用户页面测试

- 总览页能读到真实摘要并显示行动入口
- 项目目录页支持筛选与详情抽屉
- 案例页支持分页筛选与匿名提交
- 申请页支持创建、编辑、删除
- 时间线页支持创建、状态切换、删除
- 材料页支持创建、完成状态切换、附件操作
- 经验页支持发布、编辑、删除
- 游客只能浏览不能写入

### 12.2 管理员页面测试

- `/admin/studyabroad` 显示真实统计和导航入口
- 院校项目页支持创建、编辑、删除
- 案例页支持分页与删除
- 经验页支持分页与删除

### 12.3 路由测试

- 新增学生和管理员留学路由可达
- 现有留学路由不回归

### 12.4 构建与交互验证

- `npm test` 覆盖新增行为
- `npm run build` 通过
- 最终在本地浏览器完成学生与管理员各一条真实交互链路验证

## 13. 明确不做的事项

本次设计不包含：

- 新增后端接口
- 新建完全独立的后端数据模型
- 把案例或经验做成复杂审核流
- 新建单独附件中心
- 管理员代替普通用户编辑个人申请、时间线或材料
- 改造整个 `frontendv2` 的全局主题系统

## 14. 成功标准

满足以下条件即可视为本次设计成功：

1. `frontendv2` 留学模块普通用户与管理员能力与旧版功能基线对齐。
2. 新版页面在结构上明显不同于旧版，不是旧布局的平移。
3. 普通用户主站实现“推进优先的双模式工作台”。
4. 管理员后台实现“总览调度页 + 独立子页”的混合结构。
5. 所有真实写入操作都接到现有后端，并具备明确反馈与权限控制。
