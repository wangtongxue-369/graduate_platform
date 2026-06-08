# 题库练习模块（questionbank）功能说明

> 面向开发与测试：说明本模块的数据模型、接口契约、业务规则与典型使用流程，并在末尾给出可直接落地的测试用例清单。
> 文档对齐当前 `main` 实现（含错题重练 `wrong_retry`、错题本/历史分页、题库/题目启停切换、批量更新、文件导入，以及年份空值安全、选项空值回退 `[]`、练习接口鉴权、交卷编程式事务重试等修复）。

---

## 1. 模块概述

题库练习模块实现"题库分类管理 + 多模式练习 + 结果统计反馈"的闭环：

- **公共浏览**：游客/登录用户都可浏览题库列表与筛选项。
- **练习闭环**（需登录）：选库选模式 → 创建会话 → 逐题作答暂存 → 交卷自动判分 → 写入练习记录/错题本 → 历史/统计/错题重练。
- **管理端**（需 ADMIN）：题库 / 题目的增改删、启停切换、批量导入/更新、文件导入、题目版本快照。

包结构：

```
questionbank/
├── controller/   PracticeController, QuestionBankController, QuestionController, AttemptController
├── service/      PracticeService, QuestionBankService, QuestionService, AttemptService
├── repository/   *Repository (Spring Data JPA)
├── entity/       QuestionBank, Question, PracticeSession, PracticeAnswer, WrongQuestion, QuestionSnapshot, Attempt
└── dto/          *Request / *Response / PagedResult
```

管理端控制器位于 `com.graduateplatform.admin`（`AdminQuestionBankController`、`AdminQuestionController`、`AdminQuestionBankService`），复用本模块 service，一并说明。

---

## 2. 数据模型

| 实体 | 表 | 关键字段 | 说明 |
|---|---|---|---|
| `QuestionBank` | `question_banks` | name, target, subject, difficulty, description, **status**(active/inactive), **active**(Boolean,默认 true) | 题库。软删除/停用置 `active=false`+`status=inactive`；`active=NULL` 视为启用（兼容历史数据） |
| `Question` | `questions` | stem, optionsJson, answer, analysis, chapter, questionType, knowledgePoint, difficulty, year, status, active, versionNo, bank | 题目。`optionsJson` 为 JSON 数组字符串且 `NOT NULL`，空值回退 `"[]"`；`status`=draft/published/disabled；停用置 `active=false`+`status=disabled` |
| `PracticeSession` | `practice_sessions` | user, bank, mode, status, startedAt, submittedAt, totalCount, correctCount, wrongCount, subjectiveCount, durationSeconds, score, accuracy, 冗余筛选字段, **@Version** | 一次练习会话，`@Version` 乐观锁防并发重复交卷 |
| `PracticeAnswer` | `practice_answers` | session, question, answer, correct, reviewStatus, orderNo, **snapshot* 字段** | 单题作答。创建会话时写题目快照，历史回放不依赖题目主表。唯一约束 `(session_id, question_id)` |
| `WrongQuestion` | `wrong_questions` | user, question, wrongCount, lastAnswer, lastWrongAt, snapshot* 字段, **@Version** | 错题本，唯一约束 `(user_id, question_id)`，错一次累加一次 |
| `QuestionSnapshot` | `question_snapshots` | questionId, bankId, 题目各字段, versionNo, createdAt | 题目编辑前的历史版本快照 |
| `Attempt` | `attempts` | user, question, answer, correct, createdAt | 单题独立答题记录（与练习会话相互独立的旧链路） |

关系：一个题库含多道题目（`@OneToMany cascade=ALL`）；一条练习会话对应一组作答。

---

## 3. 鉴权与角色

- 认证方式：`Authorization: Bearer <JWT>`。`JwtAuthFilter` 解析后把 **userId（Long）** 作为 principal，角色映射为 `ROLE_USER` / `ROLE_ADMIN`。

| 路径 | 访问要求 |
|---|---|
| `GET /api/question-banks`、`/api/question-banks/options`、`/api/question-banks/{bankId}/questions` | **公开** |
| `/api/practice/**` | **需登录**（任意方法，含 GET） |
| `/api/attempts/**`、`POST /api/questions/{id}/attempt` | **需登录** |
| `/api/admin/**` | **需 ADMIN**（URL 规则 + 方法级 `@PreAuthorize("hasRole('ADMIN')")`） |

> 测试要点：未带 token 访问受保护接口（含 `/api/practice/**` 的 GET）返回 **403 Forbidden**；普通用户 token 访问 `/api/admin/**` 返回 **403**。

---

## 4. 统一响应格式与错误码

所有接口返回 `ApiResponse`（`@JsonInclude(NON_NULL)`）：

```json
{ "success": true,  "data": { ... }, "message": "操作成功" }
{ "success": false, "data": null,    "message": "错误原因" }
```

| 场景 | HTTP | success |
|---|---|---|
| 正常 | 200 | true |
| 业务校验失败（`BusinessException`，如"题库不存在"） | 400 | false |
| 参数校验失败（`@Valid`） | 400 | false |
| 未认证 / 权限不足 | 403 | — |
| 服务器内部错误 | 500 | false |

> `ApiResponse.ok(fail(...))` 仍是 HTTP 200（如批量导入空数组、状态值无效）。这类接口断言 `$.success` 而非 HTTP 状态码。

---

## 5. 接口清单

### 5.1 公共题库浏览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/question-banks?target=&subject=&chapter=&questionType=&difficulty=&year=` | 题库列表。仅返回 **active 题库** 且匹配条件下可练题量>0 的库。返回 `List<BankResponse>{id,name,target,subject,difficulty,description,questionCount,chapterCount,supportedModes}` |
| GET | `/api/question-banks/options` | 筛选项 `{targets,subjects,chapters,questionTypes,difficulties,years}`（缓存 `questionBank:options`） |
| GET | `/api/question-banks/{bankId}/questions` | 题目列表（公开，含 answer/analysis）。bankId 不存在 → 400 |

### 5.2 练习核心链路（需登录）

#### `POST /api/practice/sessions` — 创建练习会话
请求体 `CreatePracticeSessionRequest`：

| 字段 | 必填 | 说明 |
|---|---|---|
| mode | 是（`@NotBlank`） | `chapter` / `random` / `mock` / `wrong_retry` |
| bankId | 标准模式必填；`wrong_retry` 可不传 | 题库 ID |
| chapter / questionType / difficulty / year | 否 | 候选题筛选条件（`wrong_retry` 下忽略） |
| limit | 否 | 题量上限；`random/mock` 先打乱；`mock` 缺省 20，其余缺省取全部 |
| wrongQuestionIds | `wrong_retry` 必填 | 错题本记录 ID 列表，仅取属于本人且题目仍 active 的题 |

校验：mode 合法 → 标准模式校验题库存在+候选非空；`wrong_retry` 校验 ids 非空且至少一题可练。任一不满足抛 400（如"当前条件下暂无可练习题目"、"所选错题均不可练习"）。
返回会话快照（`status=in_progress`，**不含答案/解析**）：题目数组每项 `{id,stem,options(JSON串),analysis(null),chapter,difficulty,questionType,knowledgePoint,year,userAnswer,correct(null)}`。

#### `GET /api/practice/sessions/{id}` — 获取会话（续答/查看）
仅本人可访问（他人 → 400「无权访问该练习记录」）。`in_progress` 不下发答案；`submitted` 下发答案/解析并附 `result`。

#### `PUT /api/practice/sessions/{id}/answers/{questionId}` — 暂存答案
体 `{ "answer": "B" }`（`@Size(max=2000)`）。会话非 `in_progress` → 400；题目不属于会话 → 400。返回 `{sessionId,questionId,answer,answeredCount}`。

#### `POST /api/practice/sessions/{id}/submit` — 交卷
- 客观题自动判分（`normalizeAnswer`：去空格/大写/仅留 `A-Z0-9 中文`/排序后比较，支持多选与判断）。
- 主观题（`subjective/essay/short_answer`）：`correct=null`、`reviewStatus=saved_only`，不计入判分。
- `accuracy=round(正确数*100/客观题数)`；`score=accuracy`；客观题数为 0 → `accuracy=null`；`durationSeconds=max(1,起止秒差)`。
- 客观错题 upsert 进错题本（`wrongCount` 累加）。
- **幂等**：对已 `submitted` 的会话再次交卷直接返回原结果，不重复判分、不重复累加错题。
- 并发：`submitSession` 用 `TransactionTemplate` 包裹，乐观锁冲突时在新事务中重试一次。

返回 `result`：`{sessionId,totalCount,correctCount,wrongCount,durationSeconds,score,accuracy,startedAt,submittedAt,wrongQuestions:[{id,stem,answer,selected,analysis,chapter,knowledgePoint}]}`。

#### `GET /api/practice/wrong-questions` — 错题本（**分页**）
参数：`target,subject,chapter,minWrongCount`（可选）+ `page`(默认 0) + `size`(默认 20)。
**返回分页对象**：
```json
{ "items":[{ "id","questionId","stem","target","subject","chapter","knowledgePoint","wrongCount","lastAnswer","lastWrongAt" }],
  "total":2, "page":0, "size":20, "totalPages":1 }
```
> 测试要点：断言 `$.data.items.length()` / `$.data.total`，**不要**用 `$.data.length()`（那是对象 key 数=5）。

#### `POST /api/practice/wrong-questions/rebuild-session` — 错题重练
体 `{ "wrongQuestionIds": [1,2,3] }`，空列表 → 400。内部以 `wrong_retry` 模式创建会话并返回会话快照（同 createSession）。

#### `GET /api/practice/statistics?granularity=day|week|month` — 统计
默认 `day`，非法值 → 400。返回 `{granularity,practiceCount,averageAccuracy,totalDurationSeconds,trend:[{period,practiceCount,averageAccuracy,totalDurationSeconds}],frequentWrongKnowledgePoints:[{knowledgePoint,wrongCount}]}`。仅统计本人 `submitted` 会话；新用户全 0/空数组。`period`：day=`yyyy-MM-dd`、week=`yyyy-Www`、month=`yyyy-MM`，错点 Top10。

#### `GET /api/practice/history` — 练习历史（**分页**）
参数：`mode,target,subject,dateFrom,dateTo`（`yyyy-MM-dd`）+ `page`(**默认 1，1 起**) + `size`(默认 20)。
返回 `{items:[{id,bankId,bankName,mode,status,totalCount,correctCount,wrongCount,accuracy,score,durationSeconds,target,subject,startedAt,submittedAt}],total,page,size,totalPages}`。

### 5.3 单题答题记录（需登录，与会话独立）
- `POST /api/questions/{id}/attempt` — 体 `{ "answer":"B" }`（`@NotBlank`）。自动判分，返回 `{id,correct,answer,createdAt}`。
- `GET /api/attempts` — 返回当前用户全部 attempt 列表。
> 前端练习闭环未使用该链路，测试单独覆盖。

### 5.4 管理端（需 ADMIN）

#### 题库 `/api/admin/question-banks`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `?page=&size=`（**0 起**） | 分页列表 `PagedResult<BankResponse>{content,totalPages,totalElements}` |
| POST | `/` | 创建，体 `{name(必填),target,subject,difficulty,description}` |
| PUT | `/{id}` | 更新；字段 `null`=不改，`name=""` → 400 |
| DELETE | `/{id}` | **软删除**：`active=false`+`status=inactive`，库内题目同步停用 |
| PUT | `/{id}/status` | 启停切换，体 `{status:"active"\|"inactive"}`，其它值 → 400 |

#### 题目 `/api/admin/question-banks/{bankId}/questions` 与 `/api/admin/questions/{id}`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/{bankId}/questions?page=&size=`（0 起） | 分页 `PagedResult<QuestionResponse>` |
| POST | `/{bankId}/questions` | 创建；`stem`、`answer` 必填非空；`optionsJson` 缺省/空 → `"[]"`；`year` 接受数字或 null；默认 `status=published,active=true,versionNo=1` |
| POST | `/{bankId}/questions/batch` | 批量导入(JSON)，体 `{questions:[...]}`，逐条容错，返回 `{created,failed,total,errors:[{index,stem,error}]}`；空数组 → 200+`success:false` |
| POST | `/{bankId}/questions/import` | 文件导入，`multipart/form-data` 字段 `file`，返回导入结果 |
| PUT | `/api/admin/questions/{id}` | 更新；**改前自动存快照**，`versionNo+1`；仅更新出现的字段；`year` 为 null 安全清空（不 NPE） |
| DELETE | `/api/admin/questions/{id}` | **软删除**：`active=false,status=disabled` |
| PUT | `/api/admin/questions/{id}/status` | 启停切换，体 `{status:"published"\|"disabled"}`，其它值 → 400 |
| PUT | `/api/admin/questions/batch` | 批量更新，体 `{ids:[...],updates:{status?/chapter?/difficulty?/bankId?}}`，逐条容错，返回 `{updated,failed,total,errors}`；ids/updates 为空 → 400 |
| GET | `/api/admin/questions/{id}/snapshots` | 版本历史，按 `versionNo DESC`，`List<SnapshotResponse>` |

`QuestionResponse`：`{id,stem,optionsJson,answer,analysis,chapter,questionType,knowledgePoint,difficulty,year,status,active,versionNo,bankId}`。

---

## 6. 核心业务规则速查

1. **练习模式**：`chapter`(顺序)、`random`(打乱)、`mock`(打乱+默认 20)、`wrong_retry`(按错题 ID 重练，忽略筛选)。
2. **候选题筛选**：`active=true AND (status 为空 OR status='published')` + 章节/题型/难度/年份。
3. **判分**：客观题归一化比较；主观题仅保存。
4. **题目快照**：创建会话即写入 `PracticeAnswer` 快照字段，历史回放/统计不依赖题目主表。
5. **错题本**：客观题答错按 `(user,question)` upsert，`wrongCount` 累加；交卷幂等保证不重复累加。
6. **统计**：按 day/week/month 分组，输出练习次数、平均正确率、累计时长、高频错点 Top10。
7. **题目版本**：编辑/批量更新前存快照、`versionNo` 自增；可查历史。
8. **软删除/停用**：题库与题目"删除"实为停用，公共列表与可练候选自动隐藏，练习历史/错题快照仍可回放；可经 `/status` 接口重新启用。
9. **分页**：管理端列表与错题本 `page` **0 起**；练习历史 `page` **1 起**。
10. **缓存**：`questionBank:options` 在题库/题目增改删时 `@CacheEvict`。

---

## 7. 典型使用流程

### 普通用户
```
登录 → GET /question-banks(+筛选) → 选库选模式
     → POST /practice/sessions                       // sessionId + 题目(无答案)
     → PUT  /practice/sessions/{id}/answers/{qid}     // 逐题暂存(可中途退出凭 sessionId 续答)
     → POST /practice/sessions/{id}/submit            // 交卷判分，返回成绩+错题
     → GET  /practice/wrong-questions / statistics / history
     → POST /practice/wrong-questions/rebuild-session // 错题重练
```

### 管理员
```
登录(ADMIN) → GET /admin/question-banks
            → POST /admin/question-banks                                   // 建库
            → POST /admin/question-banks/{bankId}/questions                // 建题
            或 POST .../questions/batch (JSON)  或 .../questions/import (文件)
            → PUT  /admin/questions/{id}（自动存快照） / PUT /admin/questions/batch
            → PUT  /admin/questions/{id}/status、/admin/question-banks/{id}/status  // 启停
            → GET  /admin/questions/{id}/snapshots                          // 版本
            → DELETE 题目/题库                                              // 软删除
```

---

## 8. 测试用例清单（建议）

> 现有集成测试：`PracticeModuleIntegrationTest`、`QuestionBankModuleIntegrationTest`、`PracticeServiceTest`（H2，`@ActiveProfiles("test")`）。

### 8.1 公共浏览
- [ ] 列表只返回 active 且可练题量>0 的库；过滤生效；不匹配返回空数组。
- [ ] options 各维度去重正确。
- [ ] `GET /question-banks/{bankId}/questions`：存在返回列表；不存在 → 400。

### 8.2 练习链路
- [ ] 创建会话：题目不含 `answer`/`analysis`；`totalCount` 正确；`chapter` 模式可预测；`random/mock` 打乱。
- [ ] 暂存→交卷：全对 `accuracy=100`；半对 `score=accuracy=50`；交卷后会话下发答案/解析+`result`。
- [ ] **错题本（分页）**：交卷后 `$.data.items.length()` 正确；按 `subject`/`minWrongCount` 过滤；`page/size` 生效。
- [ ] **错题重练**：`rebuild-session` 用错题 ID 建会话；空列表 → 400；他人错题/已停用题被过滤。
- [ ] 统计：`practiceCount`/`averageAccuracy` 正确；新用户全 0；非法 `granularity` → 400。
- [ ] 历史（分页，page 1 起）：返回 submitted 记录；`mode` 过滤；日期区间过滤。

### 8.3 鉴权与归属
- [ ] 未登录访问 `/practice/**`、`/attempts`（含 GET）→ **403**。
- [ ] 访问/作答他人会话 → 400「无权访问该练习记录」。
- [ ] 普通用户访问 `/admin/**` → 403；ADMIN → 200。

### 8.4 边界与异常
- [ ] 候选题为空 → 创建会话 400；非法 mode → 400；`wrong_retry` 空 ids → 400。
- [ ] 已交卷再暂存 → 400；questionId 不属于会话 → 400。
- [ ] **重复交卷幂等**：连续两次 submit 结果一致，错题 `wrongCount` 不二次累加。
- [ ] 主观题：交卷后 `correct=null`、不计入正确率。

### 8.5 管理端
- [ ] 题库 CRUD；建库缺 name → 400；删除不存在 → 400。
- [ ] **软删除题库**：返回 200，`findById` 仍在且 `active=false`；公共列表隐藏；**库内题目曾被练习引用时删除不报 500**。
- [ ] **启停切换**：题库/题目 `/status` 切换；非法状态值 → 400。
- [ ] 题目 CRUD；缺 stem/answer → 400。
- [ ] **空选项创建主观题**：`optionsJson` 留空 → 成功，落库 `"[]"`。
- [ ] **更新题目 year 显式 null**：成功，年份清空（不 NPE）。
- [ ] 批量导入：部分成功/失败（`created/failed/total/errors`）；空数组 → `success:false`。
- [ ] 批量更新：`{ids,updates}`；ids/updates 为空 → 400；逐条容错。
- [ ] 文件导入：`multipart` `file` 字段，返回导入结果。
- [ ] 版本快照：多次更新后 `versionNo` 自增，按 `versionNo DESC` 返回历史。

### 8.6 测试基建注意事项
- 共享 H2 内存库 + 缓存的 Spring 上下文跨测试类复用。**清理需遵守外键顺序**：`wrong_questions → practice_answers → practice_sessions → questions → question_banks → users`（先删引用方）；只清部分表会让残留练习数据导致后续 `questionRepository.deleteAll()` 触发外键约束异常。
- 带 `null` 值的请求体用 `HashMap`（`Map.of` 不允许 null）。
- 管理端列表/错题本分页 `page` **0 起**；练习历史 `page` **1 起**——勿混用。
- 错题本/历史为**分页对象**，断言 `$.data.items.length()` / `$.data.total`，不要用 `$.data.length()`。
- 断言"内容失败但 HTTP 200"的接口（批量导入空数组、非法状态值等）应断言 `$.success`。
