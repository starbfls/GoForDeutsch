# 学习记录与 金币钱包

当前使用 Python 自带的 SQLite，不需要安装 MySQL/PostgreSQL，也不需要新增数据库账号、API Key 或云服务。

## 账号与数据归属

账号沿用 backend/data/users.json，密码只保存 bcrypt 哈希。学习数据保存于 backend/data/learning.sqlite3。登录后，服务器从有效登录凭证中的稳定用户 ID 得到 user:<用户UUID>，作为所有学习记录和钱包的归属键，不依赖用户名。

前端不能通过请求中的 learner、user_id 或金币数字选择其他学生、改写余额。游客仍使用 guest:<访客UUID>，与登录账号隔离，暂不自动合并。换浏览器或设备登录同一账号时，只要连接同一个后端数据目录，就能读取同一份记录。

## 保存的内容

| 内容 | 保存方式 |
| --- | --- |
| 当前单元、场景、练习、步骤 | learner_positions，保存稳定 ID、run_id、步骤下标、完成标记和最后更新时间 |
| 关卡进度 | runs 保存每轮进度与时间；results 保存每个练习最近一次完成结果 |
| 未开始 / 进行中 / 已完成 | 结合课程目录与已保存的 runs/results 返回，不为未开始关卡制造答题记录 |
| 每次提交 | learning_events 追加保存动作、原始答案、提问、正误、尝试/帮助次数、Mia 反馈和 UTC 时间 |
| 当前可用金币 | wallets.balance，非负整数金币 |
| 累计获得与消费 | wallets.total_earned / total_spent |
| 收支明细 | wallet_transactions，记录金额、原因、来源 ID、交易后余额和时间 |

“章节”在当前课程分为四层：单元（Kennenlernen / Einkaufen）→ 场景（每单元三个）→ 练习（每场景三个）→ 答题步骤。接口同时给出稳定 ID 和可读编号。

例如 current 会包含 unit_number=1、chapter_number=1、mission_number=2、step_number=2，表示第一单元、面包店、第二个练习、第二个步骤。step_index 为从 0 开始的内部下标；step_number 从 1 开始，完成后保持最后一个步骤的编号，completed 标记为 true。从未开始学习的账号 current 为 null。

只打开地图或场景不算开始练习。点击“开始练习”后创建或恢复 runs 并更新位置。每次正式提交答案或请求提示后更新位置；未提交的输入草稿、逐次键盘输入不记录。选择题保存所选选项 ID，拼句和文字题保存发送到服务器的字符串。原文保留大小写、空格、中文与德语变音字符。

错误答案、后续重试和向 Mia 的提问不会覆盖早先记录。每次服务成功提交都会追加一条事件；重复/过期请求、越权请求和校验失败的请求不作为成功学习记录保存。请求提示本身会保存为动作，但不会把当时尚未提交的输入冒充成答案。

## 金币与商店消费

首次完成关卡时，后端在同一个 SQLite 事务里提交学习状态、作答历史、完成结果、钱包余额和奖励流水。关卡奖励数额来自服务器课程定义。任一环节失败，整个事务回滚。

每个学生、每个练习的完成奖励只能记一次；重做仍保留作答记录，但不会反复获得金币。progress.coins 表示可用金币，earned_coins / spent_coins 表示累计获得 / 累计消费；wallet.currency 为 COIN。xp / earned_xp 与课程定义的 xp 字段暂作旧客户端兼容别名，数值不是另一份余额。以后消费不会被刷新或重新计算关卡奖励“补回”。run.reward_coins 为本轮实际新增奖励，重做为 0。

WalletRepository.spend 保留内部幂等扣款接口；商店通过 spend_in 复用同一个 SQLite 事务，原子提交服装归属与扣款。商品价格从后端 wardrobe_catalog.py 读取，HTTP 只接收 outfit_id，不接受客户端价格。重复购买不重复扣款，金币不足整体失败。

## 当前账号可读取的接口

以下路径均使用当前账号登录凭证；不提供任意账号查询参数。

| 方法与路径 | 返回 |
| --- | --- |
| GET /api/learning/progress | 当前学习位置、单元/场景/关卡状态、可用余额与累计金币 |
| GET /api/learning/history | 自己的提交与帮助记录，默认最近 20 条 |
| GET /api/learning/wallet | balance、total_earned、total_spent、currency=COIN |
| GET /api/learning/wallet/transactions | 自己的金币奖励和消费流水 |

history 支持 mission_id 筛选；history 和 transactions 支持 limit=1..100、before 游标分页。响应包括 items 和 next_before；下一页带上 next_before，不依赖可能变化的总条数。

bootstrap 继续包含同一份 progress，原有前端字段保持兼容。开始练习的响应也包含更新后的 progress。

## 已有数据升级

更新后首次启动会先用 SQLite backup 生成完整的旧数据库副本，再增加表和时间字段。备份位于 backend/data/backups/learning-before-activity_wallet_v1-时间-随机后缀.sqlite3，数据目录继续被 Git 忽略。

原有账号文件、run_id、任务 ID、单词卡、API 次数记录和已完成结果保持。旧已完成关卡的经验值按 1:1、原有课程奖励一次性记入金币钱包，并生成奖励流水。重复启动不重复发奖，也不重置已经消费的余额。

旧版未记录的作答原文和精确时间无法恢复，不会编造；相应旧时间字段保持 null。原文历史从新版本开始记录。历史学习位置按旧 runs 的最后保存顺序恢复；之后使用正式更新时间。

请先关闭旧启动窗口，再重新运行 python launcher.py，让运行中的后端使用新代码并完成升级。无需手动执行 SQL；不要删掉原有 data 目录。保留备份时也应同时保留 users.json，方便完整恢复账号与学习数据。

## 验证

backend/tests/test_learning_records.py 验证原文、正误、历史分页、账号隔离、恢复与事务回滚。test_wallet_migration.py 验证旧库备份/迁移、奖励去重、余额持久化、并发扣款与重复购买保护。

在项目根目录运行 backend/venv/Scripts/python.exe -B docs/qa-learning-records.py，可使用独立临时数据跑真实 HTTP 流程：注册两个账号、提交/提问、越权拦截、重复请求、奖励、重新登录和重启恢复。测试不连接真实模型，不操作原有账号数据。

## 新版题目替换规则（课程版本 2）

三种玩法只使用当前新版题目，没有保留旧题分支。已完成状态、已领取金币与历史原文保持。旧的未完成 runs 在再次 start 时清空该轮步骤、尝试、提示和证据，从新版第一题开始，沿用 run_id 并递增 revision。没有课程版本或版本低于 2 的旧页面直接提交会收到 409，要求重新进入；重置前提交的学习历史不删除。已完成旧练习可以重做新题，但首次奖励不会再次发放。

新版反馈也保存在 learning_events.feedback：阅读包含证据行，猜词包含答对词条，段落写作包含信息清单、句数、词数和修改建议。DATA_DIR 不变，无需新数据库配置。

## 主动收录单词卡与 AI 判题

新增 flashcard_collection 表（learner、card_id、added_at，按账号和词条联合唯一）。默认没有记录；旧 flashcards 复习状态和 card_review_events 不作清空或自动收录。复习、收藏接口要求该词已收录，不能用它们绕过收录规则。

GET /api/flashcards 只返回当前学生主动收录的卡；GET /api/flashcards/candidates?mission_id=... 返回已获得收录资格的词；POST /api/flashcards/collect 接收 card_ids 数组，一次可选择 1–30 个词。每个 ID 限长 80；整批校验资格后再原子写入，重复请求不重复加入。

资格来自服务器完成结果，或猜词题的正确提交历史；前端不能指定其他用户。任何关卡答对都不会自动入库。每个练习通关后返回 collection_candidates；猜对一个词时返回 collection_offer。收录、收藏与复习不发金币。

阅读题配置 AI 后使用提供商的结构化语义判断；正误、Mia 反馈、提供商标记与实际原文证据行一起写进 learning_events.feedback。未配置或异常时使用本地规则，反馈包含回退提示。AI 不直接访问或修改 SQLite，金币与进度仍通过既有事务保存。

新增表由应用访问单词卡时自动创建，不需要 MySQL、云数据库或额外数据库凭证。填写模型密钥只改 backend/.env。


## 背包与当前服装

沿用 learning.sqlite3，启动自动执行 CREATE TABLE IF NOT EXISTS，不需要新增数据库连接信息。

- wardrobe_items：learner、outfit_id、source、created_at；(learner,outfit_id) 联合主键。粉格任务奖励与蓝格商店购买均按账号唯一保存。
- wardrobe_preferences：learner 主键、outfit_id、updated_at。新账号默认 school-uniform；默认服装始终拥有，无需创建购买记录。
- 完成 clothing-labels、clothing-fitting、clothing-checkout 全部三个练习后，发放 pink-gingham 并开启商店。发奖与第三个任务的答案、完成状态、金币在同一事务提交。读取库存时可补发更新前已经满足条件的奖励。
- 购买 blue-gingham 的服务器价格为 240 金币，流水 source_id=outfit:blue-gingham。购买使用 BEGIN IMMEDIATE；库存插入失败会回滚钱包与流水。服装不会自动穿上。

| 方法与路径 | 用途 |
| --- | --- |
| GET /api/wardrobe | 当前穿着、服装目录与归属、商店是否开启、服装店完成数、钱包 |
| POST /api/wardrobe/equip | 传 outfit_id；仅能穿着自己拥有的服装 |
| POST /api/wardrobe/purchase | 传 outfit_id；验证解锁、服务器价格与余额后购买 |

身份仍由登录 token 的稳定 UUID 决定，访客另存；不接受请求中的其他用户或价格字段。新单元保留原有账户、结果、历史、词卡与余额，无破坏性迁移。


## 阅读与写作：已确认和未确认

沿用现有表，不需要数据库迁移。已审定正确表达直接通过；其他阅读与写作使用一次结构化语义评估。feedback.assessment 包含 judge 与 status，段落模型评估还包含逐项内容证据、语言与长度信息。

status=unconfirmed 时，learning_events.correct 保存 null，原文、时间与本次提交次数照常记录；当前位置不前进，也不发金币。runs.state.unconfirmed_attempts 记录这些提交次数，计算独立完成时不把未判定的回答冒充答错。后续正式判对后才推进；旧记录和奖励不改写。完整规则见 ASSESSMENT.md。
