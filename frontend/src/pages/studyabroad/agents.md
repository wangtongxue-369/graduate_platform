# 留学模块协作边界

## 负责范围

本模块负责留学方向的前端功能体验，主要文件位于：

- `frontend/src/pages/studyabroad/StudyAbroadPage.jsx`
- `frontend/src/pages/studyabroad/ApplicationsPage.jsx`
- `frontend/src/pages/studyabroad/TimelinePage.jsx`
- `frontend/src/pages/studyabroad/SAMaterialsPage.jsx`
- `frontend/src/pages/studyabroad/ExperiencePage.jsx`
- `frontend/src/pages/studyabroad/studyAbroadStorage.js`

## 当前实现策略

第一版采用前端本地 MVP，第二版补充独立后端接口：

- 后端独立包位于 `backend/src/main/java/com/graduateplatform/studyabroad`。
- 申请项目、时间线、材料清单和经验库支持真实接口保存。
- 真实登录 token 优先访问后端接口。
- 开发模式 `dev-token` 或后端不可用时，继续使用 `localStorage` 演示数据。
- 留学经验页先做结构化筛选展示，并链接到现有社区模块的留学分类。

## 谨慎改动范围

以下属于公共能力，改动前需要和组员确认：

- `backend/src/main/java/com/graduateplatform/common`
- `backend/src/main/java/com/graduateplatform/auth`
- `backend/src/main/resources/application.yml`
- `frontend/src/lib/api.js`
- `frontend/src/App.jsx`
- 全局样式文件中的既有通用类

## 后续可扩展方向

- 为申请项目增加详情页，聚合项目下的时间线、材料和风险提醒。
- 为后端接口补充更多校验测试，例如非法状态、字段超长和必填缺失。
- 将经验发布与社区 `liuxue` 分类进一步打通。
