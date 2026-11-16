# 代码结构

项目继续使用原来的 React/Vite 前端和 FastAPI 后端，不需要新增云服务。

## 前端

- `src/pages/Home.jsx`：统一主页入口，直接进入小镇；旧 `/dashboard`、`/legacy-dashboard` 地址兼容跳转。
- `src/pages/Login.jsx`、`Register.jsx`：账号页面入口。
- `src/features/auth/`：账号页面布局、表单、密码输入、注册成功页与提交逻辑，各自独立。
- `src/pages/Adventure.jsx`：页面装配与路由内容选择，不包含题目执行和单词卡逻辑。
- `src/features/adventure/hooks/useAdventure.js`：任务请求、当前步骤和导航状态。
- `src/features/adventure/components/`：导航、页头、任务卡、输入组件、辅导面板、完成面板、设置与场景练习选择。
- `src/features/adventure/components/SceneTasks.jsx`：场景内的练习选择与未解锁预览；`LessonView` 在背景旁展示答题或完成面板。
- `src/features/adventure/views/`：地图、练习列表、学习记录、场景任务页。
- `src/features/adventure/styles/`：按 foundation（排版和通用控件）、map（地图）、learning（答题）、scene（场景预览与练习面板）、overlays（弹层）和 responsive（响应式）分开；账号样式位于 `features/auth/auth.css`。
- `src/features/adventure/map/TownMap.jsx`：完整地图和地点按钮；`camera.js` 计算全图适配与进入场景的放大镜头，`locations.js` 单独配置按钮位置。
- `src/features/flashcards/`：`WordCard.jsx` 负责悬停、键盘和点击展开；`ReviewCard.jsx` 负责翻卡；筛选、请求状态分别独立。
- `src/components/Mia.jsx`：角色图集与表情选择；`miaAppearance.js` 集中配置唯一角色 PNG、十二个格子和眨眼对齐，后续服装沿用同一表情顺序；`useMiaBlink.js` 负责随机眨眼、计时清理、页面可见性和减少动态偏好；`VocabularyIcon.jsx`：词汇插图。
- `src/services/api.js`：统一调用后端 API。

## 后端

- `app/curriculum/`：单元和场景目录、三场景课程、词汇、答案规范化与公开课程目录；原有任务 ID 保持稳定。
- `app/curriculum/units.py`：单元、场景顺序和简短标题；`mnemonics.py`：26 个词条的记忆联想与例句翻译。
- `app/dependencies.py`：访客与登录用户身份。
- `app/schemas.py`：请求字段与允许的操作。
- `app/routers/learning.py`：学习接口，转发到执行服务。
- `app/services/learning.py`：解锁、步骤执行、练习证据和金币规则。
- `app/routers/flashcards.py`：词汇库、复习、收藏接口。
- `app/services/review_schedule.py`：自评后的下次复习时间。
- `app/repositories/flashcards.py`：本地复习记录；重复请求不会累计两次。
- `app/learning_store.py`：原有任务进度、结果与 API 次数限制。
- `app/tutor.py`：围绕当前任务的 LLM 提示与预设回退，不能改写金币或解锁。

## 数据与配置边界

学习记录、金币和单词卡使用本机 `backend/data/learning.sqlite3`，账号使用 `backend/data/users.json`。启动时增量升级数据表；账号、完成结果和历史不会清空。课程版本更新时，旧未完成练习切换到新版第一题。

只有需要跨设备、多学生集中管理或线上活动统计时，才需要另行安排服务与数据库。第一版不需要用户做这些配置。

如果要启用真实 AI，在 `D:\web\GoForDeutsch\backend\.env` 把 `AI_ENABLED` 设为 `true`，在 `OPENAI_API_KEY=` 后填入密钥，再重启启动窗口。不要把密钥写进前端，也不要粘贴到聊天。

第一单元是 Kennenlernen，场景按 bakery → park → school 排序。API 的 chapters 字段为兼容旧版保留，实际表示场景；units 单独表示单元。Einkaufen 仅为不可用目录项。旧任务和词条 ID 不变；已完成或已有进行中记录的任务不因顺序调整重新锁定。

单元入口显示扩展全景地图。enterScene 仅播放镜头并进入场景，不请求任务接口；场景里的“开始练习”调用 start，再请求后端并显示题目。未解锁场景可看预览，开始按钮禁用。减少动态时跳过镜头等待。跨地点练习完成后返回地图，保留原有解锁与进度规则。

- frontend/src/features/companion/：MapCompanion.jsx（地图点击对话）、dialogue.js（中德混合欢迎、进度建议、场景观察与完成反馈）、companion.css（伙伴交互样式）。这些对话不发起模型请求。
- SceneStage.jsx 组合场景背景、Mia 与对话；SceneLanding.jsx 单独负责第二次点击的练习入口；已有 SceneTasks.jsx 负责练习内的任务选择。
- town-panorama.png 为内置图片工具参考用户新图片重画的明亮 3:1 插画（2172×724）。地图相机保持比例铺满视口，直接使用整张图的归一化坐标。locations.js 分别配置地点按钮、镜头焦点与窄屏紧凑位置，不改任务或用户数据。


## 学习记录与 金币钱包

- app/repositories/learning_schema.py：增量建表、升级前 SQLite 完整备份、已有进度和旧奖励迁移。
- app/repositories/records.py：当前学习位置、追加式提交历史和按账号查询。
- app/repositories/wallet.py：余额、奖励与收支流水，及未来商店的内部幂等扣款入口。
- app/services/progress.py：把已保存状态汇总为单元/场景/关卡完成状态和可读编号；coins 表示当前金币余额，xp 为兼容别名。
- app/learning_store.py：同一事务内保存任务、作答原文、当前位置、完成结果和金币，沿用旧的调用接口。
- app/routers/learning.py：新增本人 progress/history/wallet/wallet/transactions 查询，身份由登录凭证决定。

详细字段、迁移、分页和测试说明见 DATABASE.md。账号继续沿用 users.json 和稳定 UUID，不重写原账号系统。没有新加云服务或数据库凭证。

## 阅读、猜词与写作（课程版本 2）

- app/curriculum/builders.py：文字题与练习结构；bakery.py、park.py、school.py 分别编写阅读、猜词和写作。
- app/curriculum/answers.py：已编写答案的规范化、短句检查与反馈；writing.py：段落信息清单、句数、词数和可识别的 A1 句型，不替学生重写段落。
- public_step 过滤答案、写作规则、提示和目标词，只公开当前可见的猜词线索。帮助次数决定下一条线索是否出现。
- learning_store.start 检测旧课程版本，将未完成练习切换到新版第一题，递增 revision；历史记录和钱包保持。services/learning.py 拒绝旧页面直接提交。
- TaskContext.jsx：阅读原文、猜词线索和写作角色卡；WritingFeedback.jsx：段落评估清单；tasks.css：三种题型样式。
- tutor.py：把规则评估作为辅导上下文；阅读引导找证据，猜词分步提示，写作给局部修改建议。评分、解锁和金币仍由服务器决定。

题目与奖励设计见 UNIT1_DESIGN.md。参考项目 D:/web/praktikum-llm 仅作只读设计参考。
