# 毕业去向导航与交流平台 (RJXT)

一个面向大学毕业生的一站式平台，覆盖**考研、考公考编、就业、留学**四大毕业去向，集信息导航、社区交流、刷题练习于一体。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Spring Boot 3.2.5 + Spring Security |
| 数据持久层 | Spring Data JPA + Hibernate |
| 数据库 | MySQL 8.0（生产）/ H2（开发备选） |
| 认证方案 | 无状态 JWT + BCrypt 密码加密 |
| 邮件服务 | Spring Boot Starter Mail（QQ邮箱 SMTP） |
| 前端框架 | React 19 + React Router 6 |
| 构建工具 | Vite 8 |
| 后端构建 | Maven（JDK 17） |

## 功能模块

### 通用功能
- **用户系统** — 支持手机号/邮箱/学号注册登录，邮箱验证码，五种用户状态（正常/禁言/上传限制/临时锁定/封禁）
- **社区交流** — 六大分类（考研/考公/就业/留学/经验分享/资料互助），支持匿名发帖、附件上传、Markdown 内容
- **内容审核** — 含附件或新注册用户帖子自动进入待审核，支持通过/拒绝/下架
- **刷题练习** — 按题库分类学习，记录答题历史，支持多难度等级
- **个人中心** — 修改资料，查看发帖和回复历史

### 考研方向
- 各院校分数线查询与对比
- 个性化复习计划制定
- 公共课/专业课资料共享
- 线上自习室计时
- 上岸学长学姐一对一咨询

### 考公考编方向
- 专业/学历与岗位智能匹配
- 历年进面分数线与报录比查询
- 全国考试日历（国考/省考/事业编）
- AI 模拟结构化面试

### 就业方向
- 招聘会信息汇总与订阅
- 在线简历编辑器（在线文本预览、Word/PDF 导出 + 单个当前附件，鉴权下载）
- 基于专业/技能/地区的职位推荐
- 投递进度追踪看板

### 留学方向
- 申请全流程时间线规划
- 各国院校申请材料清单
- 学长学姐经验分享与选校建议

### 管理员后台
- 数据仪表盘（用户/帖子/活跃度统计）
- 帖子审核与批量操作
- 用户管理（禁言/封禁/解除）

## 项目结构

```
graduate_platform/
├── backend/                          # Spring Boot 后端
│   ├── pom.xml
│   └── src/main/java/com/graduateplatform/
│       ├── GraduatePlatformApplication.java
│       ├── config/                   # CORS / Security / Mail / 数据初始化
│       ├── controller/               # REST API 控制器
│       │   ├── AuthController        # 注册 / 登录 / 验证码
│       │   ├── UserController        # 个人中心
│       │   ├── PostController        # 帖子 CRUD
│       │   ├── CommentController     # 评论
│       │   ├── CategoryController    # 帖子分类
│       │   ├── QuestionBankController # 题库
│       │   ├── QuestionController    # 题目
│       │   ├── AttemptController     # 答题记录
│       │   └── AdminController       # 管理员接口
│       ├── dto/                      # 请求/响应 DTO
│       ├── entity/                   # JPA 实体（User / Post / Comment /
│       │                             #   PostCategory / QuestionBank / Question / Attempt）
│       ├── repository/               # Spring Data JPA 仓库
│       ├── security/                 # JWT 过滤器 + Token 生成器
│       ├── service/                  # 业务逻辑层
│       └── exception/                # 全局异常处理
│
├── frontend/                         # React 前端
│   ├── src/
│   │   ├── App.jsx                   # 路由配置（25+ 路由）
│   │   ├── lib/api.js                # API 请求封装（auth / community / practice / user / admin）
│   │   ├── context/AuthContext.jsx   # 认证状态管理 + 开发模式测试用户
│   │   ├── components/               # 通用组件（Navbar / Footer / DevBar / PostComposerModal）
│   │   └── pages/                    # 页面组件
│   │       ├── HomePage              # 首页
│   │       ├── CommunityPage / CommunityDetailPage  # 社区
│   │       ├── PracticePage / PracticeDetailPage    # 刷题
│   │       ├── LoginPage / RegisterPage / ProfilePage # 用户
│   │       ├── kaoyan/               # 考研专属页面（6个）
│   │       ├── kaogong/              # 考公专属页面（5个）
│   │       ├── job/                  # 就业专属页面（5个）
│   │       ├── studyabroad/          # 留学专属页面（4个）
│   │       └── admin/                # 管理员页面（3个）
│   └── public/
├── .gitignore
└── README.md
```

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8.0+

### 1. 数据库配置

创建 MySQL 数据库：

```sql
CREATE DATABASE IF NOT EXISTS graduate_platform
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

修改 `backend/src/main/resources/application.yml` 中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://<你的数据库地址>:3306/graduate_platform?...
    username: <你的用户名>
    password: <你的密码>
```

### 2. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端启动后监听 `http://localhost:8080`，首次启动会自动创建表结构并初始化数据（6个帖子分类、管理员账号、测试用户、4个题库含20道示例题目）。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端开发服务器默认监听 `http://localhost:5173`。

### 4. 访问应用

- 浏览器访问 `http://localhost:5173`
- 管理员账号：`admin@graduate.local` / `admin123`
- 测试用户：`test@graduate.local` / `test1234`
- 也可通过右上角开发工具栏快速切换考研/考公/就业/留学四种测试身份

## API 概览

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否 |
| POST | `/api/auth/send-code` | 发送验证码 | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |
| GET | `/api/posts` | 帖子列表（支持分类/搜索/排序） | 否 |
| GET | `/api/posts/{id}` | 帖子详情 | 否 |
| POST | `/api/posts` | 发布帖子 | 是 |
| GET | `/api/post-categories` | 帖子分类列表 | 否 |
| GET | `/api/posts/{id}/comments` | 评论列表 | 否 |
| POST | `/api/posts/{id}/comments` | 发表评论 | 是 |
| GET | `/api/question-banks` | 题库列表 | 否 |
| GET | `/api/question-banks/{id}/questions` | 题库题目 | 否 |
| POST | `/api/questions/{id}/attempt` | 提交答题 | 是 |
| GET | `/api/attempts` | 答题记录 | 否 |
| GET | `/api/admin/dashboard` | 后台仪表盘 | 管理员 |
| GET | `/api/admin/posts/pending` | 待审核帖子 | 管理员 |
| PUT | `/api/admin/posts/{id}/review` | 审核帖子 | 管理员 |
| GET/PUT | `/api/admin/users/**` | 用户管理 | 管理员 |

| GET | `/api/job/fairs/**` | Employment career fair browse/detail | Public |
| GET | `/api/job/postings/**` | Employment job posting browse/detail | Public |
| GET/PUT | `/api/job/preferences` | Current user's job subscription preferences | Authenticated |
| GET/PUT | `/api/job/resume` | Current user's persisted online resume plus safe `resumeFile` summary | Authenticated |
| GET | `/api/job/resume/export` | Export current online resume fields as Word/PDF (`format=docx|pdf`) | Authenticated |
| POST | `/api/job/resume/file` | Upload/replace current resume attachment (`file`, PDF/DOC/DOCX, default max 10MB) | Authenticated |
| GET | `/api/job/resume/file/download` | Download current resume attachment through backend ownership check | Authenticated |
| DELETE | `/api/job/resume/file` | Delete current resume attachment metadata and best-effort remove object storage file | Authenticated |
| GET | `/api/job/recommendations` | Hybrid algorithmic job recommendations with hard filters, TF-IDF cosine similarity, BM25 relevance, preference fit, freshness, and apply-link signals | Authenticated |
| GET/POST/PUT/DELETE | `/api/job/applications/**` | Current user's application tracking records with job snapshots, follow-up fields, and resume filename snapshot | Authenticated |
| GET/PUT/DELETE | `/api/job/notifications/**` | Current user's in-app employment notifications, read status, and deletion | Authenticated |
| GET/POST/PUT/DELETE | `/api/admin/employment/fairs/**` | Admin career fair source-data management | Admin |
| GET/POST/PUT/DELETE | `/api/admin/employment/jobs/**` | Admin job posting source-data management | Admin |
| POST | `/api/admin/employment/notifications/trigger` | Admin manual matched station-notification trigger for fairs/jobs | Admin |
| GET | `/api/admin/employment/resumes` | Admin read-only user resume attachment status summary; no download/upload/delete action | Admin |

## 开发说明

- **JPA `ddl-auto: update`** — 实体变更后自动同步表结构，生产环境建议改为 `validate` 并配合 Flyway/Liquibase 迁移
- **开发模式** — 前端无需后端即可通过 `DevBar` 工具栏切换模拟用户身份，通过 `localStorage` 注入测试 token
- **验证码** — 当前验证码仅输出到后端日志（见 `VerificationCodeService`），实际对接邮箱时需修改逻辑


### Employment module additions

- Backend: `backend/src/main/java/com/graduateplatform/job/**` contains the employment domain: career fairs, job postings, online resume profiles, application records, subscription preferences, and station notifications.
- Frontend: `frontend/src/pages/job/**` implements the user employment pages; `frontend/src/pages/admin/EmploymentManagementPage.jsx` implements fair/job source-data management and read-only resume attachment status.
- API client: `frontend/src/lib/api.js` exposes `employmentApi` and `adminEmploymentApi`, including authenticated resume attachment upload/download/delete helpers.

### Employment resume workflow

- The online resume remains editable text, supports page preview, and can be exported as Word or PDF through `GET /api/job/resume/export?format=docx|pdf`.
- PDF export depends on a server font that can render Chinese text. Linux deployments should install a CJK font such as Noto Sans CJK or WenQuanYi; Windows/WSL development environments usually resolve Microsoft YaHei or SimHei from the host.
- Each user can keep exactly one current attachment. Uploading a new attachment replaces the previous one; the backend updates metadata and then best-effort deletes the old object.
- Supported attachment defaults are PDF, DOC, and DOCX up to 10MB. The frontend gives the same hints, but backend validation is authoritative.
- Downloads go through `GET /api/job/resume/file/download` with authentication and current-user ownership checks. The API response summaries include safe metadata only: `hasFile`, `fileName`, `fileSize`, `fileType`, and `uploadedAt`. COS object keys, signed/public URLs, and storage credentials are not returned to student or admin pages.
- `GET /api/job/applications` keeps the existing array contract. The application tracking page fetches `GET /api/job/resume` separately to show the current attachment status at page level.
- Admins can open `/admin/employment` to view read-only upload status across users via `/api/admin/employment/resumes`; admins cannot upload, download, replace, or delete student resume files from that view.
- Object-storage credentials should live in environment variables or private deployment config (for example `COS_SECRET_ID` / `COS_SECRET_KEY`). Any credential value that has been pasted into chat, logs, or source control should be rotated before real deployment.

### Employment v1 non-goals

Employment v1 intentionally does not include resume parsing, multi-version resume libraries, external recruitment-platform API sync, email/SMS/WeChat push, or external AI/model calls for recommendations. Job recommendations use an in-process deterministic hybrid algorithm. Notifications are station-internal records matched by saved preferences and can be marked read or deleted by the owning user.

### Employment demo flow

For course or graduation-project acceptance, the recommended employment demo path is:

1. Admin opens `/admin/employment`, creates or edits a job posting/career fair, and uses the active status to show or hide it from user pages.
2. Admin triggers a matched station notification from a managed job or fair.
3. A job-track user opens `/job/resume`, saves online resume text, previews the page layout, exports Word/PDF, and uploads or replaces a PDF/DOC/DOCX attachment.
4. The user opens `/job/fairs` to browse fairs and enter a fair detail page.
5. The same user opens `/job/recommend`, reviews algorithmic match reasons, enters a job detail page, and adds the job to application tracking.
6. The user opens `/job/applications`, verifies that the company/job snapshot is prefilled, sees the current resume attachment status, saves the application, and updates the status through the tracking board.

Current matching notes:

- Station notifications match saved preferences by city, industry, and role; users can mark them read or delete them from the recommendation page.
- Job recommendations first apply hard filters, then score remaining jobs with TF-IDF profile similarity, BM25 text relevance, saved preference fit, salary/company-type signals, freshness, and direct-apply availability.
