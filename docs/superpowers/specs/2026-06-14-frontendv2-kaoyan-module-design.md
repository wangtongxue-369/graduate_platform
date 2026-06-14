# frontendv2 考研模块补齐与重构设计

日期：2026-06-14

主题：以当前 `frontend` 已实现能力和后端考研模块为唯一基线，补齐 `frontendv2` 的考研板块，并在不照搬旧版布局的前提下，重新组织学生端与管理员端的信息架构、页面布局和交互流。

## 1. 目标

本次设计只解决 `frontendv2` 的考研模块，不扩散到其它方向模块，也不重写后端接口层。

本次设计的目标是：

1. 把旧版 `frontend` 已跑通、后端也已支持的考研功能完整补齐到 `frontendv2`。
2. 保留 `frontendv2` 当前的“主站 + 深层子页”产品语言，不把旧版考研页面原样搬过来。
3. 让学生端更偏任务流，让管理员端更偏数据治理台。
4. 把复杂操作从单页堆叠式布局拆成清晰的深层路由，降低页面职责混杂度。
5. 让 `frontendv2` 继续复用现有 `@legacy/lib/api.js` 接口层，而不是借这次机会做一轮 API 重构。

## 2. 真实能力基线

本设计只以以下真实实现为准：

- 旧版路由与页面：`frontend/src/App.jsx`、`frontend/src/pages/kaoyan/*`
- 旧版管理员页面：`frontend/src/pages/admin/AdminKaoyanDataPage.jsx`、`frontend/src/pages/admin/AdminMaterialReviewPage.jsx`
- 当前 `frontendv2` 考研页：`frontendv2/src/pages/student/kaoyan/KaoyanStationPage.jsx`
- 后端考研模块控制器与说明：`backend/src/main/java/com/graduateplatform/kaoyan/controller/*`、`backend/src/main/java/com/graduateplatform/kaoyan/README.md`

### 2.1 学生端真实已实现能力

#### 择校与分数线

- 院校分页
- 分数线分页
- 分数线收藏
- 取消收藏
- 收藏列表

#### 学习计划与打卡

- 计划创建、列表、详情、编辑、删除
- 打卡创建、列表、编辑、删除
- 计划完成率展示

#### 资料库

- 公开资料列表
- 资料详情
- 资料上传
- 我的资料
- 附件下载
- 按审核状态查看我的资料

#### 导师与 1v1 咨询

- 导师列表
- 导师详情
- 申请入驻
- 查看我的入驻信息
- 注销入驻
- 创建咨询会话
- 发件 / 收件会话列表
- 消息收发
- 已读标记
- 未读数

#### 自习室协同

- 房间创建
- 房间列表
- 房间详情
- 加入房间
- 离开房间
- 房间消息
- SSE 实时流
- 排行榜
- 我的当前房间
- 我创建的房间
- 关闭房间

### 2.2 管理员端真实已实现能力

- 院校库维护：新增、编辑、停用
- 分数线维护：按院校查看、新增、编辑、停用
- 资料审核：待审核、全部、已通过、已拒绝、审核动作、删除

### 2.3 明确不纳入本次基线的能力

以下能力当前没有后端管理接口或成熟前端基线，因此不纳入本次设计：

- 管理员导师入驻审核
- 管理员咨询会话治理
- 管理员自习室治理

## 3. 产品方向

本次方案采用“学生端任务流优先，管理员端数据台优先”的混合模式。

### 3.1 学生端

学生端的页面组织围绕“下一步做什么”展开：

- 先在主站判断当前该推进哪一条考研工作链
- 再进入对应分组页浏览结果
- 最后在深层页完成复杂动作

### 3.2 管理员端

管理员端的页面组织围绕“当前要处理什么数据或队列”展开：

- 总览页先做分诊
- 具体治理页承担维护或审核动作
- 不再把所有能力挤在一个海报式总页里

## 4. 信息架构

## 4.1 学生端一级分组

保留当前 `frontendv2` 主站风格，但把考研能力组织成四组：

1. 择校账本
2. 计划轨道
3. 资料中枢
4. 陪跑协同

### 择校账本

承载：

- 院校比较
- 分数线浏览
- 分数线收藏回看

### 计划轨道

承载：

- 计划列表
- 计划详情
- 打卡与打卡编辑

### 资料中枢

承载：

- 公开资料浏览
- 资料详情
- 上传资料
- 我的资料与状态追踪

### 陪跑协同

承载：

- 导师列表
- 导师入驻
- 咨询消息
- 自习室列表与房间内工作区

## 4.2 管理员端一级分组

管理员考研模块只保留真实能力对应的四页：

1. 考研治理总览
2. 资料审核
3. 院校库
4. 分数线维护

## 4.3 推荐路由

### 学生端

- `/station/kaoyan`
- `/station/kaoyan/schools`
- `/station/kaoyan/schools/favorites`
- `/station/kaoyan/plans`
- `/station/kaoyan/plans/:planId`
- `/station/kaoyan/materials`
- `/station/kaoyan/materials/upload`
- `/station/kaoyan/materials/mine`
- `/station/kaoyan/materials/:materialId`
- `/station/kaoyan/support`
- `/station/kaoyan/support/mentors/apply`
- `/station/kaoyan/support/messages`
- `/station/kaoyan/support/rooms/:roomId`

### 管理员端

- `/admin/kaoyan`
- `/admin/kaoyan/materials`
- `/admin/kaoyan/schools`
- `/admin/kaoyan/score-lines`

## 5. 页面设计

## 5.1 学生端总原则

1. 主区优先展示结果、任务和上下文，不把筛选器堆满首屏。
2. 列表筛选尽量放在右栏，延续 `frontendv2` 当前双栏工作台结构。
3. 浏览与编辑尽量拆页，不在同一页混放复杂表单和长列表。
4. 深层页只负责一类核心动作，避免旧版那种“单页承担所有能力”的混杂布局。

## 5.2 择校账本

### 列表页：`/station/kaoyan/schools`

主区使用“比较卡片列表”而不是传统纯表格。

每张卡展示：

- 院校名
- 专业名
- 年份
- 总分线
- 985 / 211 标签
- 报录比
- 计划招生
- 备注
- 收藏动作

右栏提供筛选器：

- 地区文本输入
- 专业门类文本输入
- 年份文本输入
- 985 分段按钮：全部 / 只看 / 排除
- 关键字输入

### 收藏页：`/station/kaoyan/schools/favorites`

独立做成“收藏账本”页，不把收藏状态继续埋在主列表视图里。

这样用户回看目标分数线时更直接，也更符合“账本”定位。

## 5.3 计划轨道

### 列表页：`/station/kaoyan/plans`

主区使用时间轨道视图，而不是普通卡片堆叠。

每个计划块展示：

- 计划名
- 时间区间
- 总时长
- 描述
- 进入详情按钮

页头提供“新建计划”主按钮。

### 详情页：`/station/kaoyan/plans/:planId`

页面拆成两部分：

- 上半区：计划总览、完成率、编辑、删除
- 下半区：日历打卡板与当日打卡记录

右栏提供快捷打卡表单：

- 日期选择
- 时长输入
- 备注输入

该页应直接承接后端 `checkins` 能力，不再把打卡逻辑塞在列表页中。

## 5.4 资料中枢

### 列表页：`/station/kaoyan/materials`

主区使用资料卡片网格，展示：

- 标题
- 院校 / 专业
- 科目 / 类型 / 年份
- 描述
- 附件数
- 浏览数
- 下载数

页头动作：

- 上传资料
- 我的资料

右栏提供轻筛选：

- 关键字
- 科目
- 年份
- 资料类型

### 上传页：`/station/kaoyan/materials/upload`

独立长表单页，不使用弹窗。

上传文件应显示为清单卡，便于展示多附件状态和错误提示。

### 我的资料页：`/station/kaoyan/materials/mine`

使用分段控件切换：

- PENDING
- APPROVED
- REJECTED

这样比旧版单页混合浏览公开资料和个人资料更清楚。

### 详情页：`/station/kaoyan/materials/:materialId`

左右分区：

- 左侧：资料说明、适用场景、正文信息
- 右侧：附件清单、元数据、下载动作

## 5.5 陪跑协同

### 总览页：`/station/kaoyan/support`

主区左右双列：

- 左列：导师咨询列表
- 右列：自习室列表

页头动作：

- 申请导师入驻
- 进入咨询消息

这页的目标是先选支持资源，再决定进入咨询还是进入房间。

### 导师入驻页：`/station/kaoyan/support/mentors/apply`

独立长表单页，不与导师列表混排。

该页同时支持：

- 首次申请
- 查看我的入驻信息
- 注销入驻

### 咨询消息页：`/station/kaoyan/support/messages`

采用双栏消息工作区：

- 左侧：会话列表，含收件 / 发件切换
- 右侧：消息面板与发送区

比旧版单栏切换式消息页更适合高频往返。

### 房间内页：`/station/kaoyan/support/rooms/:roomId`

采用协作工作区结构：

- 顶部：房间状态条、加入状态、关闭房间入口
- 中部：聊天流
- 右侧：成员列表、排行榜、我的时长

SSE 断开时要允许退化为手动刷新，不让房间页直接不可用。

## 5.6 管理员端

### 总览页：`/admin/kaoyan`

只做分诊，不做大而全展示。

展示：

- 待审核资料数
- 活跃院校数
- 分数线记录数
- 对应治理页入口

### 资料审核页：`/admin/kaoyan/materials`

顶部使用状态 tabs：

- 待审核
- 全部
- 已通过
- 已拒绝

主区使用审核卡片列表，每张卡展示：

- 标题
- 状态
- 院校 / 专业 / 科目 / 年份 / 类型
- 上传人
- 附件清单
- 浏览 / 下载指标
- 审核动作

### 院校库页：`/admin/kaoyan/schools`

结构：

- 顶部筛选区
- 主区院校卡片列表
- 新建 / 编辑入口

比旧版大一页混管院校与分数线更清晰。

### 分数线维护页：`/admin/kaoyan/score-lines`

不再继续依赖“院校卡片内 modal 套 modal”的组织方式。

推荐结构：

- 左侧或顶部：当前院校上下文与筛选
- 主区：分数线记录列表
- 右栏：新增 / 编辑表单

这样可以持续展示“当前正在维护哪所院校”的上下文。

## 6. 控件选择原则

### 分段按钮

用于：

- 资料状态切换
- 985 筛选
- 发件 / 收件切换
- 我的资料状态切换

用于替代旧版大量下拉框，减少频繁展开选择器的打断感。

### 右栏筛选表单

用于：

- 择校账本
- 资料列表
- 协同总览
- 管理端院校页

右栏负责输入条件，主区保持结果导向。

### 独立详情页

用于：

- 计划详情
- 资料详情
- 房间内工作区

避免旧版同页混浏览、管理、表单的布局拥挤问题。

### 双栏消息工作区

用于咨询消息页。

这是本次与旧版差异最明显的交互升级之一。

### 侧边上下文卡

用于管理员分数线维护页。

目的是在编辑记录时持续保留“当前院校”语境。

## 7. 数据流与状态策略

## 7.1 接口层策略

不重写 API 层，继续复用 `@legacy/lib/api.js` 中现有考研接口。

本次主要新增或重构的是：

- `frontendv2` 路由
- `frontendv2` 页面组件
- 页面级数据整形函数
- 页面级测试

## 7.2 页面数据来源

### 择校账本

- `kaoyanApi.schoolsPage`
- `kaoyanApi.scoreLinesPage`
- `kaoyanApi.favoriteScoreLine`
- `kaoyanApi.unfavoriteScoreLine`
- `kaoyanApi.favoriteScoreLines`

### 计划轨道

- `studyPlanApi.myPlans`
- `studyPlanApi.planDetail`
- `studyPlanApi.createPlan`
- `studyPlanApi.updatePlan`
- `studyPlanApi.deletePlan`
- `studyPlanApi.checkins`
- `studyPlanApi.addCheckin`
- `studyPlanApi.updateCheckin`
- `studyPlanApi.deleteCheckin`

### 资料中枢

- `materialApi.listPage`
- `materialApi.detail`
- `materialApi.create`
- `materialApi.myMaterials`
- `materialApi.downloadUrl`

### 陪跑协同

- `mentorApi.mentorsPage`
- `mentorApi.detail`
- `mentorApi.myProfile`
- `mentorApi.saveProfile`
- `mentorApi.deactivateProfile`
- `mentorApi.createSession`
- `mentorApi.sentSessions`
- `mentorApi.receivedSessions`
- `mentorApi.sessionMessages`
- `mentorApi.sendMessage`
- `mentorApi.markAsRead`
- `mentorApi.unreadCount`
- `studyRoomApi.roomList`
- `studyRoomApi.createRoom`
- `studyRoomApi.roomDetail`
- `studyRoomApi.joinRoom`
- `studyRoomApi.leaveRoom`
- `studyRoomApi.messages`
- `studyRoomApi.sendMessage`
- `studyRoomApi.streamUrl`
- `studyRoomApi.leaderboard`
- `studyRoomApi.myCurrentRoom`
- `studyRoomApi.myCreatedRooms`
- `studyRoomApi.closeRoom`

### 管理员端

- `adminApi.kaoyanSchools`
- `adminApi.createKaoyanSchool`
- `adminApi.updateKaoyanSchool`
- `adminApi.deleteKaoyanSchool`
- `adminApi.kaoyanScoreLines`
- `adminApi.createKaoyanScoreLine`
- `adminApi.updateKaoyanScoreLine`
- `adminApi.deleteKaoyanScoreLine`
- `adminMaterialApi.pending`
- `adminMaterialApi.listPage`
- `adminMaterialApi.review`
- `adminMaterialApi.delete`

## 7.3 状态与降级

继续沿用 `frontendv2` 现有的三态提示策略：

- preview
- remote
- fallback

### 列表页失败

列表浏览页读取失败时，可以退回预览数据，避免整页空白。

适用页：

- 考研主站
- 择校账本
- 资料中枢
- 协同总览
- 管理总览

### 动作页失败

表单类动作失败时，必须保留用户输入，不清空表单。

适用页：

- 上传资料
- 导师入驻
- 打卡录入
- 消息发送

### 实时页失败

自习室 SSE 断开时：

- 保留当前页面
- 提示实时同步中断
- 允许手动刷新消息与排行榜
- 提供重连入口

## 8. 测试策略

本次优先补页面级与路由级测试，而不是追求大而全的端到端覆盖。

### 必测项

1. 新增路由能被导航进入
2. 学生端列表页能正确映射远端数据
3. 计划详情页能读取并展示 checkins
4. 资料上传、我的资料、详情页状态切换正确
5. 咨询消息页会话列表与消息面板渲染正确
6. 管理端资料审核 tabs 和动作按钮正确
7. 管理端院校库、分数线维护的上下文切换和表单行为正确

### 技术验证

- `frontendv2` 中 `npm test`
- `frontendv2` 中 `npm run build`

## 9. 推荐实施顺序

### Phase A

- 路由与导航重构
- 学生端考研主站重组

### Phase B

- 择校账本
- 收藏页

### Phase C

- 计划列表
- 计划详情
- 打卡工作流

### Phase D

- 资料列表
- 上传资料
- 我的资料
- 资料详情

### Phase E

- 协同总览
- 导师入驻
- 咨询消息页
- 自习室房间页

### Phase F

- 管理员考研治理总览
- 资料审核页
- 院校库页
- 分数线维护页

### Phase G

- 回归测试
- 浏览器验收
- 细节打磨

## 10. 最终设计结论

本次不是把旧版考研模块原样迁移到 `frontendv2`，而是：

1. 保留后端与旧版前端已验证的真实功能边界。
2. 保留 `frontendv2` 的主站式产品语言。
3. 把复杂操作拆成更清晰的深层路由。
4. 把管理员端从旧版“混合维护页”升级为任务型治理台。
5. 通过页面职责拆分，降低后续继续扩展时的维护难度。
