# 代码结构

项目继续使用原来的 React/Vite 前端和 FastAPI 后端，不需要新增云服务。

## 前端

- `src/pages/Home.jsx`：统一主页入口，直接进入小镇；旧 `/dashboard`、`/legacy-dashboard` 地址兼容跳转。
- `src/pages/Login.jsx`、`Register.jsx`：账号页面入口。
- `src/features/auth/`：账号页面布局、表单、密码输入、注册成功页与提交逻辑，各自独立。
- `src/pages/Adventure.jsx`：页面装配与路由内容选择，不包含题目执行和单词卡逻辑。
- `src/features/adventure/hooks/useAdventure.js`：任务请求、当前步骤和导航状态。
- `src/features/adventure/components/`：导航、页头、任务卡、输入组件、辅导面板、完成面板、设置与转场。
- `src/features/adventure/views/`：地图、练习列表、学习记录、场景任务页。
- `src/features/adventure/styles/`：按 foundation（排版和通用控件）、map（地图）、learning（练习）、overlays（弹层）和 responsive（响应式）分开；账号样式位于 `features/auth/auth.css`。
- `src/features/adventure/map/TownMap.jsx`：地图与浮层；`camera.js`：根据视口和场景位置计算镜头平移。
- `src/features/flashcards/`：`WordCard.jsx` 负责悬停、键盘和点击展开；`ReviewCard.jsx` 负责翻卡；筛选、请求状态分别独立。
- `src/components/Mia.jsx`：角色图集与表情选择；`useMiaBlink.js` 负责随机眨眼、计时清理、页面可见性和减少动态偏好；`VocabularyIcon.jsx`：词汇插图。
- `src/services/api.js`：统一调用后端 API。

## 后端

- `app/curriculum/`：单元和场景目录、三场景课程、词汇、答案规范化与公开课程目录；原有任务 ID 保持稳定。
- `app/curriculum/units.py`：单元、场景顺序和简短标题；`mnemonics.py`：26 个词条的记忆联想与例句翻译。
- `app/dependencies.py`：访客与登录用户身份。
- `app/schemas.py`：请求字段与允许的操作。
- `app/routers/learning.py`：学习接口，转发到执行服务。
- `app/services/learning.py`：解锁、步骤执行、练习证据和积分规则。
- `app/routers/flashcards.py`：词汇库、复习、收藏接口。
- `app/services/review_schedule.py`：自评后的下次复习时间。
- `app/repositories/flashcards.py`：本地复习记录；重复请求不会累计两次。
- `app/learning_store.py`：原有任务进度、结果与 API 次数限制。
- `app/tutor.py`：围绕当前任务的 LLM 提示与预设回退，不能改写积分或解锁。

## 数据与配置边界

目前所有功能只使用本机 `backend/data/learning.sqlite3`，首次访问时自动新增单词卡相关表。旧的任务表、账号文件和进度不会被重置。

只有需要跨设备、多学生集中管理或线上活动统计时，才需要另行安排服务与数据库。第一版不需要用户做这些配置。

如果要启用真实 AI，在 `D:\web\GoForDeutsch\backend\.env` 把 `AI_ENABLED` 设为 `true`，在 `OPENAI_API_KEY=` 后填入密钥，再重启启动窗口。不要把密钥写进前端，也不要粘贴到聊天。

第一单元是 Kennenlernen，场景按 bakery → park → school 排序。API 的 chapters 字段为兼容旧版保留，实际表示场景；units 单独表示单元。Einkaufen 仅为不可用目录项。旧任务和词条 ID 不变；已完成或已有进行中记录的任务不因顺序调整重新锁定。
