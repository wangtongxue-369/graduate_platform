# 考研模块（kaoyan）功能说明

> 面向开发与测试：说明本模块的数据模型、接口契约、业务规则与典型使用流程，并在末尾给出可直接落地的测试用例清单。
> 文档对齐当前 `main` 实现，覆盖六大子域：分数线 / 院校库 / 校友入驻 1v1 咨询 / 备考资料 / 复习计划与打卡 / 同频自习室。

---

## 1. 模块概述

考研模块服务"考研一站式陪伴"：从查分线、定目标，到找学长、找资料、做计划、找研友，覆盖备考全链路。

- **公共浏览**（无需登录）：分数线列表、院校列表、已通过审核的资料、同频自习室列表。
- **学生端**（需登录）：资料上传/我的资料、复习计划与日历打卡、申请入驻 1v1 咨询、加入自习室与计时、收发私信。
- **管理端**（需 ADMIN）：院校与分数线 CRUD、资料审核（待审核 / 已通过 / 已拒绝 / 删除）。

包结构：

```
kaoyan/
├── controller/   KaoyanController, MaterialController, StudyPlanController,
│                  MentorController, StudyRoomController
│   ── 此外 admin 模块还提供: AdminKaoyanController, AdminMaterialController
├── service/      KaoyanService, MaterialService, StudyPlanService,
│                  MentorService, StudyRoomService
├── repository/   *Repository (Spring Data JPA)
├── entity/       GraduateSchool, GraduateScoreLine, GraduateScoreLineFavorite,
│                  ResourceMaterial, MaterialAttachment, MaterialStatus,
│                  StudyPlan, StudyCheckIn,
│                  MentorProfile, CounselingSession, CounselingMessage,
│                  StudyRoom, StudyRoomMember, StudyRoomMessage, StudyRoomSession
└── dto/          CreateMaterialRequest 等请求/响应 DTO
```

> 历史约定：管理端控制器放在 `com.graduateplatform.kaoyan.controller` 包下（`AdminKaoyanController`、`AdminMaterialController`），与业务控制器共享 `MaterialService` / `KaoyanService`。

---

## 2. 数据模型

| 实体 | 表 | 关键字段 | 说明 |
|---|---|---|---|
| `GraduateSchool` | `graduate_schools` | name, region, province, is985, is211, isDoubleFirstClass, schoolType, logoUrl, description, officialSite, active | 院校字典。`active=false` 软删除；院校被管理员删除时，相关分数线下属一并清理 |
| `GraduateScoreLine` | `graduate_score_lines` | school, year, majorCategory, majorName, degreeType, isNationalLine, politicsLine, foreignLangLine, subject1Line, subject2Line, totalLine | 单校单年单专业的分数线。`subject1/2Line` 对应数学/专业课 |
| `GraduateScoreLineFavorite` | `graduate_score_line_favorites` | user, scoreLine | 分数线收藏（学生端收藏夹） |
| `ResourceMaterial` | `resource_materials` | uploaderId, title, description, school, major, subject, year, materialType, status, viewCount, downloadCount, active | 资料主表。`status` = PENDING/APPROVED/REJECTED；审核通过后对所有人可见；软删除置 `active=false` |
| `MaterialAttachment` | `material_attachments` | material, originalName, fileSize, cosKey, fileType, downloadCount | 资料的附件，文件存腾讯云 COS。`@OneToMany` 级联 |
| `MaterialStatus` | (enum) | PENDING / APPROVED / REJECTED | 资料审核状态，`@Enumerated(STRING)` 存储 |
| `StudyPlan` | `study_plans` | user, name, description, startDate, endDate, totalDurationHours, checkIns | 复习计划。`checkIns` 由 `@OneToMany` 级联 |
| `StudyCheckIn` | `study_check_ins` | plan, user, checkInDate, durationHours, remark | 单日打卡。一天可多次打卡（不同备注/时长） |
| `MentorProfile` | `mentor_profiles` | user, avatar, nickname, bio, graduateSchool, enrollmentYear, major, expertiseSubjects, examSubjects, active | 学长学姐入驻资料。`user_id` 唯一约束，已注销后想重新入驻会重新激活（见 §5.2） |
| `CounselingSession` | `counseling_sessions` | mentor, student, subject, status | 1v1 咨询会话。`status`=open/closed |
| `CounselingMessage` | `counseling_messages` | session, sender, content, isRead, createdAt | 私信内容。`isRead` 默认 false；收信方进入会话时由 `markMessagesAsRead` 批量置 true |
| `StudyRoom` | `study_rooms` | name, school, schoolName, major, createdBy, members, status, createdAt | 自习室。`status`=OPEN/CLOSED，关闭后所有在室成员被强制退出 |
| `StudyRoomMember` | `study_rooms_members` | room, user, sessionStartedAt, joinedAt | 自习室成员与本次会话的开始时间，用于累计学习时长 |
| `StudyRoomMessage` | `study_rooms_messages` | room, sender, content | 自习室讨论区消息 |
| `StudyRoomSession` | `study_rooms_sessions` | room, user, startedAt, endedAt, durationSeconds | 每次加入-离开会话的时长记录，排行榜按此聚合 |

---

## 3. REST API 速览

> 基础路径：`/api/kaoyan` 与 `/api/admin/kaoyan`。
> 鉴权：除标注"公开"外均需登录；管理端需 `ADMIN` 角色（`SecurityConfig.requestMatchers("/api/admin/**").hasRole("ADMIN")`）。
> 响应统一包装：`ApiResponse<T> = { success, data, message }`（前端 `request()` 已解包 `data`）。

### 3.1 分数线 & 院校（KaoyanController）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/score-lines/page?schoolId&majorCategory&year&page&size` | 公开 | 分页查分数线（按 `schoolId` 或 `majorCategory` 过滤，模糊 `year`） |
| POST | `/score-lines/{id}/favorite` | 登录 | 收藏一条分数线 |
| DELETE | `/score-lines/{id}/favorite` | 登录 | 取消收藏 |
| GET | `/score-lines/favorites` | 登录 | 当前用户收藏夹 |
| GET | `/schools/page?page&size` | 公开 | 分页查院校字典（每页 200 用于筛选下拉） |

### 3.2 资料（MaterialController）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/materials/page?...` | 公开 | 已通过审核资料分页。`keyword` 模糊 title/school/major/subject；其余字段精确 |
| GET | `/materials/{id}` | 公开 | 详情（自动 `viewCount++`） |
| POST | `/materials` | 登录 | **multipart/form-data** 上传。字段：title, description, school, major, subject, year, materialType, files(可多个)。单文件 ≤10MB、单次 ≤120MB、文件数 ≤10 |
| GET | `/materials/my?status&page&size` | 登录 | 我的资料；`status` 可选（PENDING/APPROVED/REJECTED） |
| GET | `/materials/{materialId}/download/{attachmentId}` | 登录 | 下载附件，命中后 `downloadCount` 累加（仅 APPROVED 或本人） |

### 3.3 复习计划（StudyPlanController）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/plans` | 登录 | 创建计划。`startDate/endDate/totalDurationHours` 必填 |
| GET | `/plans` | 登录 | 我的计划列表 |
| GET | `/plans/{id}` | 登录 | 计划详情（含打卡数组与完成率 `completionRate`） |
| PUT | `/plans/{id}` | 登录 | 编辑（仅 owner） |
| DELETE | `/plans/{id}` | 登录 | 删除（级联删除打卡） |
| POST | `/plans/{id}/checkins` | 登录 | 打卡。`checkInDate`(LocalDate), `durationHours`(BigDecimal, 0<x<24, ≤1 位小数), `remark` |
| GET | `/plans/{id}/checkins` | 登录 | 该计划全部打卡（按日期升序） |
| PUT | `/checkins/{id}` | 登录 | 改打卡时长/备注 |
| DELETE | `/checkins/{id}` | 登录 | 删打卡记录 |

### 3.4 1v1 咨询（MentorController）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/mentors` | 登录 | **申请 / 重新激活入驻**。`user_id` 唯一，重复入驻会 400；已注销后想重新入驻会自动激活 |
| GET | `/mentors/me` | 登录 | 我的入驻资料；无则 null |
| GET | `/mentors/{id}` | 公开 | 校友详情（`active=true` 才返回） |
| GET | `/mentors/page?graduateSchool&enrollmentYear&major&expertiseSubjects&page&size` | 公开 | 校友列表，字段全部模糊 |
| DELETE | `/mentors/me` | 登录 | 注销入驻（同时把所有进行中的咨询会话置 closed） |
| POST | `/mentors/counseling/sessions` | 登录 | 创建会话。`mentorId`（MentorProfile.id）、`subject` 可选 |
| GET | `/mentors/counseling/sessions/sent?page&size` | 登录 | 我发起的会话 |
| GET | `/mentors/counseling/sessions/received?page&size` | 登录 | 我收到的会话 |
| GET | `/mentors/counseling/sessions/{id}/messages` | 登录 | 拉取会话全部消息（进入会话时自动 markAsRead） |
| POST | `/mentors/counseling/sessions/{id}/messages` | 登录 | 发送消息。`content` 必填 |
| PUT | `/mentors/counseling/sessions/{id}/messages/read` | 登录 | 显式置已读 |
| GET | `/mentors/counseling/unread-count` | 登录 | 当前用户未读总数（学生 + 校友角色求和） |

### 3.5 同频自习室（StudyRoomController）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/study-rooms` | 登录 | 创建自习室。`name` 必填；`schoolId`/`major` 可选 |
| GET | `/study-rooms?schoolId&major&page&size` | 公开 | 列表；`major` 输入有 1s 防抖 |
| GET | `/study-rooms/{id}` | 登录 | 详情（成员 + isOwner） |
| POST | `/study-rooms/{id}/join` | 登录 | 加入，返回 `sessionStartedAt` |
| POST | `/study-rooms/leave` | 登录 | 离开（自动结算时长） |
| GET | `/study-rooms/{id}/messages?since` | 登录 | 拉取某时间戳之后的消息 |
| POST | `/study-rooms/{id}/messages` | 登录 | 发送消息 |
| GET | `/study-rooms/{id}/stream` | 登录 | **SSE 实时事件流**：`connected / member-joined / member-left / message / room-closed` |
| GET | `/study-rooms/{id}/leaderboard?period=all|week|day` | 登录 | 学习排行（按时长聚合） |
| GET | `/study-rooms/me` | 登录 | 我当前所在自习室（用于自动跳转） |
| GET | `/study-rooms/me/created` | 登录 | 我创建的自习室 |
| PUT | `/study-rooms/{id}/close` | 登录（owner） | 关闭自习室，踢出所有在室成员 |

### 3.6 管理端（AdminKaoyanController / AdminMaterialController）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/admin/kaoyan/schools` | ADMIN | 全量院校 |
| POST | `/api/admin/kaoyan/schools` | ADMIN | 新建院校 |
| PUT | `/api/admin/kaoyan/schools/{id}` | ADMIN | 编辑 |
| DELETE | `/api/admin/kaoyan/schools/{id}` | ADMIN | 删除（联动清理分数线下属） |
| GET | `/api/admin/kaoyan/score-lines?schoolId&year` | ADMIN | 分数线列表 |
| POST | `/api/admin/kaoyan/score-lines` | ADMIN | 新建 |
| PUT | `/api/admin/kaoyan/score-lines/{id}` | ADMIN | 编辑 |
| DELETE | `/api/admin/kaoyan/score-lines/{id}` | ADMIN | 删除 |
| GET | `/api/admin/kaoyan/materials/pending?page&size` | ADMIN | 待审核（status=PENDING 且 active=true），使用派生方法 `findByStatusAndActiveTrue` |
| GET | `/api/admin/kaoyan/materials/page?status&page&size` | ADMIN | 全部 / 已通过 / 已拒绝列表 |
| PUT | `/api/admin/kaoyan/materials/{id}/review` | ADMIN | `body.status` = APPROVED / REJECTED |
| DELETE | `/api/admin/kaoyan/materials/{id}` | ADMIN | 软删（`active=false`） |

---

## 4. 业务规则要点

### 4.1 资料上传

- 必须登录（JWT Bearer）。
- 表单字段：`title, description, school, major, subject, year, materialType, files`（可多个，字段名 `files` 复数）。
- 文件经 COS 上传至 `tencent.cos.bucket`，`cosKey = "materials/{UUID}"`，`@PrePersist`/事务保证全部失败时回滚（外层 `@Transactional` 包裹）。
- 限速：单文件 ≤ 10MB、单次请求 ≤ 120MB、文件数 ≤ 10。超限抛 `BusinessException` → 400。**`MissingServletRequestPartException`** 单独映射为 400（"缺少必要的上传文件（files）"），不再走通用 500。
- 提交后状态 `PENDING`，需管理员审核。前端"我的资料"页 tab 数字会随审核动作实时刷新（15s 轮询拉取会话列表）。

### 4.2 复习计划

- 同一用户下可创建多个计划；删除计划会级联删除全部打卡。
- 打卡时间校验：必须是 **> 0 且 < 24**（严格小于 24），最多 1 位小数（前端 `step=0.1 max=24`）。任何超限弹 `alert` 不提交。
- 页面提供日历视图与"今日/已打卡/未打卡/超出范围"四色块，**未打卡/未来=透明背景、已打卡=蓝、未打卡=红、当天=绿**；选中框用 `var(--primary)` 在浅/深色模式下都可见。
- 计划完成率 `completionRate` 由后端聚合 `totalCheckInsHours / totalDurationHours` 计算。

### 4.3 1v1 咨询入驻

- `mentor_profiles.user_id` **唯一约束**。一个账号只能有一份入驻资料；申请入驻时若该用户已有 `active=true` 资料 → 400 "您已完成入驻，无需重复入驻"。
- **已注销后可重新入驻**：`createOrUpdateProfile` 使用 `findByUserId(userId)` 找任意资料；若存在但 `active=false`，则就地激活并覆盖字段；若存在且 `active=true` → 400。
- 注销入驻（`DELETE /mentors/me`）会同时把所有"非 closed"的咨询会话置 closed，避免咨询被继续投递。
- 列表筛选字段（`graduateSchool / enrollmentYear / major / expertiseSubjects`）全部走 SQL `LIKE '%...%'`，不分词。
- 列表 / 详情使用 DTO Map 序列化（`toMentorMap` / `toSessionMap`），**`createSession` 返回 `Map<String,Object>`** 而非实体，规避懒加载代理序列化失败。

### 4.4 同频自习室

- 状态机：`OPEN` / `CLOSED`。仅 `createdBy` 可关闭，关闭时所有"非 closed"会话置 closed + 通过 SSE 推 `room-closed` 事件。
- 实时通讯：前端 `EventSource(/stream)` 长连，后端推送 `connected/member-joined/member-left/message/room-closed`。前端每 1s 轮询 `myElapsed` 显示学习时长；排行榜每 60s 自动刷新。
- 加入-离开生成 `StudyRoomSession(startedAt, endedAt, durationSeconds)`；排行按 `sum(durationSeconds)` 聚合，支持 `all/week/day` 三种周期。
- **创建会话返回 `Map<String,Object>`**（不是实体），规避 `@ManyToOne(LAZY)` 代理在事务关闭后无法初始化的问题。
- 前端"我的资料 / 私信"页面在 60s 静默期内只发 4 个轮询请求（`fetchMessages` 调用 `markAsRead` 后立刻 `fetchSessions(tab,page)` 再校准）—— 列表 badge 实时反映新消息。

### 4.5 资料审核管理端

- Tab 计数来源：`pending` → `findByStatusAndActiveTrue(PENDING, size=1)`；`all` → `findByActiveTrue(size=1)`；`APPROVED/REJECTED` → `findByStatusAndActiveTrue(status, size=1)`。**全部走 Spring Data 派生方法**，规避 JPA Criteria 在 Hibernate 6.4 上的不稳定（单值 `in()` / `getRestriction()` 已被 equal + 派生方法替代）。
- 操作链路：通过 / 拒绝后 `fetchMaterials()` 重拉列表，**前端不会自动重新加载 `loadCounts`**，需要用户切 tab 或刷新。如果希望 badge 立即更新，可在前端 `handleReview`/`handleDelete` 末尾追加一次 `loadCounts()` 触发。

---

## 5. 前端页面速查

| 路由 | 文件 | 角色 |
|---|---|---|
| `/kaoyan` | `pages/kaoyan/KaoyanPage.jsx` | 学生面板（导航卡） |
| `/kaoyan/score` | `pages/kaoyan/ScoreQueryPage.jsx` | 分数线查询与收藏 |
| `/kaoyan/mentors` | `pages/kaoyan/MentorListPage.jsx` | 1v1 咨询校友列表 |
| `/kaoyan/mentors/consult` | `pages/kaoyan/ConsultPage.jsx` | 申请入驻表单 + 我的入驻查看 |
| `/kaoyan/messages` | `pages/kaoyan/MessagesPage.jsx` | 私信（发件箱 / 收件箱 Tab，列表 15s 轮询） |
| `/kaoyan/materials` | `pages/kaoyan/MaterialsPage.jsx` | 资料列表 + 6 维筛选 |
| `/kaoyan/materials/upload` | `pages/kaoyan/MaterialUploadPage.jsx` | multipart 上传（XHR 进度条） |
| `/kaoyan/materials/my` | `pages/kaoyan/MyMaterialsPage.jsx` | 我的资料 + 状态 tab 计数 |
| `/kaoyan/materials/:id` | `pages/kaoyan/MaterialDetailPage.jsx` | 资料详情 + 下载 |
| `/kaoyan/plan` | `pages/kaoyan/StudyPlanPage.jsx` | 计划列表 |
| `/kaoyan/plan/:id` | `pages/kaoyan/StudyPlanDetailPage.jsx` | 计划详情 + 日历打卡（深色模式已支持） |
| `/kaoyan/studyroom` | `pages/kaoyan/StudyRoomPage.jsx` | 自习室列表 + 房间内实时 |
| `/admin/material-review` | `pages/admin/AdminMaterialReviewPage.jsx` | 资料审核（待审核/全部/已通过/已拒绝） |

---

## 6. 安全 / 鉴权约定

- 所有 `/api/kaoyan/**` 与 `/api/admin/kaoyan/**` 走标准 JWT 流程：登录后从 `useAuth()` 拿 token，**前端用 `Authorization: Bearer <token>` 携带**。
- 管理端白名单：`SecurityConfig.requestMatchers("/api/admin/**").hasRole("ADMIN")`，数据库里用户 `role` 字段需为 `ADMIN`。
- 公开可访问：`/score-lines/page`、`/materials/page`（仅 APPROVED）、`/materials/{id}`（仍会 viewCount++）、`/mentors/page`、`/schools/page`、`/study-rooms`。
- 申请入驻的写接口、上传、加入自习室、计划增删改、消息收发 —— **全部要求登录**。

---

## 7. 配置项

| 配置 | 默认 / 说明 |
|---|---|
| `app.jwt.secret` / `app.jwt.expiration-ms` | 登录签发 |
| `app.upload.mock-interview-dir` / `mock-interview-max-bytes` / `mock-interview-allowed-extensions` | 通用上传（考研不直接用，但拦截器仍生效） |
| `tencent.cos.secret-id` / `secret-key` / `bucket` / `region` / `base-url` | 资料附件存 COS。`CosService.init()` 在 `@PostConstruct` 校验凭证格式（必须以 `AKID` 开头），校验失败 → `BusinessException("文件服务未配置...")` → 400 |
| `spring.servlet.multipart.max-file-size` / `max-request-size` | 10MB / 120MB，对应考研资料上传限制 |

---

## 8. 已知坑位 / 修复记录

- **材料上传 500**：旧 `MissingServletRequestPartException` 未被处理，缺失 `files` 字段时 500；现已在 `GlobalExceptionHandler` 单独映射为 400。
- **管理端 Tab 计数一直为 0**：旧 `adminListPendingPage` 用 `in(MaterialStatus.PENDING)` 单值 in 匹配，Hibernate 6.4 渲染异常。已改为 `findByStatusAndActiveTrue` 派生方法 + 新增 `findByActiveTrue` 覆盖"全部" Tab。
- **1v1 咨询 `Could not write JSON` 懒加载代理**：`createSession` 旧返回实体，现已改为 `toSessionMap` 返回 Map。
- **markAsRead 后 L1 缓存导致未读数仍 1**：`@Modifying(clearAutomatically=true, flushAutomatically=true)` + 前端 `fetchMessages` 末尾 `fetchSessions` 重新校准。
- **历史 MySQL 凭证泄露**：`application.yml` 现已使用 `${COS_SECRET_ID:}` 占位符；本地调试可在 `~/.gradle/gradle.properties` 或环境变量中注入真实密钥（**勿提交到仓库**）。

---

## 9. 端到端验收清单

> 直接复用到 `mvn test` / Postman / 浏览器手工验收。每条标注预期状态。

### 9.1 分数线 / 院校

1. `GET /api/kaoyan/score-lines/page?page=0&size=10` → 200，至少包含 `isNationalLine=true` 的 985 院校。
2. `POST /api/kaoyan/score-lines/{id}/favorite` 后再 `GET /score-lines/favorites` → 200 且包含该 id。
3. `DELETE` 收藏后再次调用 → 收藏列表中不再包含该 id。

### 9.2 资料

1. 未登录访问 `/kaoyan/materials` → 列表渲染（公开），点"上传资料"被前端拦回 `/login`。
2. 登录后上传 1 个 txt（< 10MB）→ 200 + `data.id > 0`，状态 `PENDING`。
3. 上传 0 个文件 → 400 且 `message` 包含 "files"。
4. 上传 11MB 文件 → 400（`MaxUploadSizeExceededException`）且 `materialRepository` 不增加行。
5. 用 admin 通过该 id → 状态变 `APPROVED`；再用游客 `/materials/page` 能查到。
6. `GET /materials/my?status=APPROVED` → 200，包含刚才的资料。
7. 下载附件 → 文件流 + `downloadCount + 1`。

### 9.3 复习计划

1. 创建计划 `startDate=today, endDate=today+30, totalDurationHours=60` → 200。
2. 同一用户再创建同名计划 → 200（允许重名）。
3. 打卡 `durationHours=25` → 400 / `alert` "必须小于 24 小时"。
4. 打卡 `durationHours=10` → 200，进度条 + `completionRate` 增加。
5. 编辑计划 `endDate < startDate` → 400（业务校验在 controller）。
6. 删除计划 → 关联 `study_check_ins` 全部被清。

### 9.4 1v1 咨询

1. 用户 A 申请入驻 → 200，`/mentors/me` 返回资料。
2. 用户 A 再次申请 → 400 "您已完成入驻，无需重复入驻"。
3. 用户 A 注销 → 200，再申请 → 200（重新激活，覆盖字段）。
4. 用户 B 列表 `/mentors/page?graduateSchool=...` 能查到 A。
5. 用户 B `POST /counseling/sessions` → 200；B 收件箱出现该会话。
6. B 进入会话发消息 → markAsRead 后 A 端 unread-count 归 0。
7. A 删除入驻 → B 的"未关闭"会话被强制 closed。

### 9.5 自习室

1. 用户 A 创建"清华计科" → 200，自动加入，视图切到房间。
2. 用户 B 列表可见并"加入" → SSE 推送 `member-joined`，A 端成员数 +1。
3. B 发消息 → A、B 两端 SSE `message` 事件，聊天框实时追加。
4. A 关闭房间 → SSE `room-closed`；B 弹 alert 并被切回列表视图。
5. A 离开 → `mySessionStartedAt` 写入，排行榜 1 分钟后（B 端能看到）刷新。
6. 同时 10 个用户加入 → 房间正常展示成员；`myCurrentRoom` API 可正确返回 inRoom=true。

### 9.6 管理端

1. ADMIN 登录 → `/admin/material-review` Tab 计数：
   - 待审核 = 真实 PENDING 数
   - 全部 = 全部 active 数
   - 已通过 = APPROVED 数
   - 已拒绝 = REJECTED 数
2. 切到 "已通过" tab → 列表只显示 status=APPROVED 的资料。
3. 审核某 PENDING 为 APPROVED → 该资料对学生端可见。
4. 删除某资料 → 学生端列表不再显示。
5. 关闭房间 → 强退所有在室成员。

---

## 10. 排查速查

| 现象 | 优先排查 |
|---|---|
| 上传 500 | `tencent.cos.*` 是否齐全 / 是否过期；`GlobalExceptionHandler` 是否被覆盖 |
| 1v1 列表 403 | 前端 `DevBar` 是否给了 admin / 当前 JWT `role` 是否为 `ADMIN` |
| 自习室实时消息收不到 | `study-rooms/{id}/stream` 的 SSE 响应头 `Content-Type: text/event-stream`；浏览器是否在 HttpOnly 下被代理拦截 |
| 打卡 0 进度 | 检查后端 `completionRate` 计算公式与 `totalDurationHours` 是否为 BigDecimal |
| 排行不刷新 | 离开房间是否调用 `leaveRoom` 触发时长结算；前端 60s 轮询是否在 `view==='room'` 内 |
| 申请入驻 500 | `mentor_profiles.user_id` 唯一冲突；切到 `findByUserId` 看是否已存在 `active=false` 旧记录 |
