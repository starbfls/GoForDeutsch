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

第一单元是 Kennenlernen，场景按 bakery → park → school 排序。API 的 chapters 字段为兼容旧版保留，实际表示场景；units 单独表示单元。Einkaufen 为第二个可用单元，服装店 → 电器店 → 餐厅。旧任务和词条 ID 不变；已完成或已有进行中记录的任务不因顺序调整重新锁定。

单元入口显示扩展全景地图。enterScene 仅播放镜头并进入场景，不请求任务接口；场景里的“开始练习”调用 start，再请求后端并显示题目。未解锁场景可看预览，开始按钮禁用。减少动态时跳过镜头等待。跨地点练习完成后返回地图，保留原有解锁与进度规则。

- frontend/src/features/companion/：MapCompanion.jsx（地图点击对话）、dialogue.js（中德混合欢迎、进度建议、场景观察与完成反馈）、companion.css（伙伴交互样式）。这些对话不发起模型请求。
- SceneStage.jsx 组合场景背景、Mia 与对话；SceneLanding.jsx 单独负责第二次点击的练习入口；已有 SceneTasks.jsx 负责练习内的任务选择。
- town-panorama.png 为内置图片工具参考用户新图片重画的明亮 3:1 插画（2172×724）。地图相机保持比例铺满视口，直接使用整张图的归一化坐标。locations.js 分别配置地点按钮、镜头焦点与窄屏紧凑位置，不改任务或用户数据。


## 学习记录与 金币钱包

- app/repositories/learning_schema.py：增量建表、升级前 SQLite 完整备份、已有进度和旧奖励迁移。
- app/repositories/records.py：当前学习位置、追加式提交历史和按账号查询。
- app/repositories/wallet.py：余额、奖励与收支流水，及商店的内部幂等扣款入口。
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

## 主动收录与模型提供商

- app/curriculum/card_links.py：练习关联词、猜词步骤与词卡 ID 的映射；同一个词跨场景复用。
- app/services/card_collection.py：依据通关结果和正确猜词历史判断资格，组装候选词并校验显式收录；不把目录词条自动填入个人库。
- app/repositories/flashcards.py：新增 flashcard_collection，与已有复习状态分离；保留去重、账号隔离和复习幂等处理。
- app/ai/client.py：DeepSeek Chat Completions JSON 与现有 OpenAI Responses 传输。只负责 HTTP 和响应读取，不记录密钥或上游正文。
- app/ai/reading.py：阅读语义判断和同次反馈；校验严格布尔与原文行号，异常走本地判断。
- app/tutor.py：共享提供商配置、调用预算与结构化教学反馈；读取当前答案、尝试与提示，不能改金币。
- WordCollection.jsx / collection.css：答对词汇后的单词收录与完成页的多选收录。useAdventure.markCollected 同步当前步骤与通关候选状态。
- 个人卡库为空时只显示学习入口；答对后 ExercisePanel 显示绿色成功标识、面板边框和立即变色的“继续”。

backend/.env 配置 AI_PROVIDER=deepseek、DEEPSEEK_API_KEY、DEEPSEEK_MODEL 与 AI_ENABLED。默认模型按 2026-11-16 官方文档配置为 deepseek-flash。无需新增依赖。


## 第二单元与服装库存

- app/curriculum/clothing.py、electronics.py、restaurant.py：九个练习与 27 个步骤；shopping_words.py：21 个关联词条；prerequisites.py：单元边界和顺序解锁。第一单元任务 ID 与课程版本保持，新增单元不重置进行中的新版任务。
- app/wardrobe_catalog.py：服装 ID、价格与奖励条件；repositories/wardrobe.py：库存、当前穿着、自动发奖、原子购买；routers/wardrobe.py：当前学生的三个衣橱接口。
- learning_schema.py 补建 wardrobe_items 和 wardrobe_preferences；learning_store.save 在完成结果事务内发放服装；wallet.spend_in 在同一连接完成扣款与流水。
- WardrobeContext.jsx：按当前账号读取库存、刷新和换装，拒绝过期请求覆盖新账号状态。账号切换不重新挂载路由，注册后的用户名欢迎页保留。
- useAdventure：选择单元与单元内进度；TownMap 接受单元地图，locations.js 管理各地点按钮与镜头；theme.css 管理蓝色单元色与成功反馈的绿色。
- features/wardrobe：背包、商店与服装卡；components/miaAppearance.js：服装对应图集；Mia.jsx：共用表情与当前服装渲染，保留随机眨眼。


## 按任务判题，避免把未匹配当作错误

阅读、短句和段落写作共用“本地正确证据优先，未覆盖表达交给语义评估”的流程。answer_variants.py 组织已审定整句族；assessment_prompts.py 区分阅读信息与写作核心语言标准；ai/writing.py 校验逐项证据、ID、严格布尔与明确长度要求。正误与反馈来自同一次评估，成功文案由服务器按验证后的结果生成。

ai/local_assessment.py 区分不正确与尚未确认；learning.py 保存未确认原文但不扣独立资格、不推进或发奖。WritingFeedback 隐藏未确认的缺项清单，ExercisePanel 显示保留答案的状态。提示与提问的 correct_by_rules 为 null，不预先假定学生答错。详细设计、参考项目的取舍和测试见 ASSESSMENT.md。
