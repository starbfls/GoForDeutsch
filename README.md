# GoForDeutsch · 和 Mia 一起学德语

面向 **10–15 岁中文母语学生**的德语 A1 游戏化学习原型。和 Mia 一起探索阳光小镇，在面包店任务中认识食物、练习礼貌点单，再换情境独立表达。

当前项目目录：`D:\web\GoForDeutsch`。

## 最简单的打开方式（Windows）

1. 打开 `D:\web\GoForDeutsch`。
2. 双击 **`Start-GoForDeutsch.cmd`**。
3. 等待准备完成，浏览器会自动打开 **http://127.0.0.1:8000**。
4. 保持启动窗口打开。结束体验时，在窗口按 **Ctrl+C**。

第一次启动需要电脑已安装 **Python 3.10+** 和 **Node.js 22.12+（或受支持的更新 LTS 版本）**。如果缺少项目依赖，启动器会联网安装；后续通常不需要重新安装。打开失败时，启动窗口会保留错误信息。

也可以在 PowerShell 中运行：

```powershell
cd D:\web\GoForDeutsch
python launcher.py
```

无需 API Key 即可体验三个完整任务。此时 Mia 使用经过编写的固定教学提示，界面会标明“预设教学体验”，不消耗模型额度。

## 第一版包含什么

- 可点击的小镇地图、轻微场景移动、漂浮标记与光点。
- AI 生成的小镇、面包店内景，以及参考形象衍生的 Mia 六表情图集。
- Mia 的微笑、思考、说话、开心、提示、庆祝表情，配合轻微呼吸动画。
- 三个连续任务，共九个学习步骤：图片选择、词块拼句、文字点单。
- 常见自然表达和德语变音替代拼写：例如 `Ein Brötchen, bitte.`、`Ich möchte bitte ein Brötchen.` 和 `broetchen`。
- 逐步提示、示例、围绕当前任务向 Mia 提问。
- 任务解锁、进度恢复、首次完成经验奖励、词汇手账、独立/提示后完成记录。
- 原有注册、登录与退出。访客体验无需注册。
- 桌面和手机布局，支持关闭动态效果及系统“减少动态”偏好。

学校、公园是后续篇章入口，当前会明确提示尚未开放。第一版不包含听力、麦克风、角色语音包、课件上传或多人游戏。

## 启用真实 OpenAI 辅导（先由成人测试）

启动器会在 `backend` 中创建本机配置文件 `.env`。如果尚未启动，也可以手动把 `backend/.env.example` 复制为 `backend/.env`。

打开该文件，在本机填写：

```dotenv
AI_ENABLED=true
OPENAI_API_KEY=在本机填入你的开发者API密钥
OPENAI_MODEL=gpt-4.1-mini
AI_DAILY_LIMIT=30
SECRET_KEY=保持启动器生成的随机值或自行设置一个长随机字符串
```

修改后重启启动窗口。进入“体验设置”可查看 AI 是否启用。成功调用后的提示会显示“AI 辅导”；额度不足、超时、输出不符合格式时，会明确提示已改用预设教学内容。

注意：

- 密钥只由后端读取，不放进前端、不发送到聊天、不提交 Git。`.env` 已被忽略。
- 模型名可替换成你的 API 项目有权限使用、支持 Responses API 和结构化输出的模型。
- `AI_DAILY_LIMIT` 是**全站每天的请求次数上限**，按 UTC 日期计算，包含失败请求；它不是货币预算，也不是 OpenAI 平台的账单硬上限。
- 你所说的 `1,400 credits` 的单位和实际 API 可用性，需要以开发平台的 Billing/Usage 页面为准。本项目不把它换算成美元，也不会读取或展示你的余额。
- 未配置真实密钥时，已验证的是预设教学和模拟 API 故障回退；尚未做真实模型调用验证。

API 调用使用 `store=false`，但 **这不等于账户级零数据保留（ZDR）**。项目目前是本机成人测试原型；面向真实 10–15 岁学生开放前，需要落实对应的未成年人数据处理要求。特别是处理未满 13 岁或当地数字同意年龄儿童的个人数据时，须满足服务商相关条件。

官方参考：

- [OpenAI API 密钥与身份验证](https://developers.openai.com/api/reference/overview#authentication)
- [结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)
- [未成年人应用指引](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)

## AI 与教学 Agent 的职责

课程词汇、教学目标、任务顺序和基础答案由项目明确编写。规则检查器处理本版支持的答案，服务器决定解锁、积分和进度，LLM 不能修改它们。

教学 Agent 读取当前任务、尝试次数和提示记录，再通过结构化输出返回：一段短辅导、一个允许的表情、一个教学动作（观察、提示、示例、重试或迁移）。它没有浏览网页、执行任意代码或修改数据库的权限。

第一版的“独立完成”指：该步骤第一次回答正确，且没有使用提示、示例或提问。答错后的纠正也属于帮助。重复任务只奖励一次 XP，手账保留最近一次完整练习的表现；目前不代表长期掌握度评估。

文字答案采用经过编写的自然表达集合，并非任意德语句子的完整自动评分系统；更开放的表达评估是后续工作。

## 数据保存在哪里

- 账号：`backend/data/users.json`。
- 任务进度和每日 AI 调用计数：`backend/data/learning.sqlite3`。
- 浏览器保存随机访客标识；不需要姓名、邮箱或生日即可体验。
- 访客与登录账号的进度分开保存，暂不自动合并。清理浏览器存储后，旧访客记录不会自动找回。
- 后端数据目录及本机配置不进入 Git。不要手动覆盖原有用户数据。

## 开发模式：前后端分别启动

终端一：

```powershell
cd D:\web\GoForDeutsch\backend
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe app.py
```

如果没有 `venv`，先运行 `python -m venv venv`。

终端二：

```powershell
cd D:\web\GoForDeutsch\frontend
npm ci
npm run dev
```

浏览器打开 **http://127.0.0.1:5173**。前端通过 `/api` 转发到本机 8000 端口。正常体验只需前面的双击入口，不需要开两个终端。

## 检查与测试

```powershell
cd D:\web\GoForDeutsch\backend
.\venv\Scripts\python.exe -m unittest discover -s tests -v

cd D:\web\GoForDeutsch\frontend
npm run build
npm run lint
```

测试覆盖答案变体、错误冠词与否定句、答案键不外露、任务解锁、进度恢复、用户隔离、提示记录、重复奖励、过期提交、全局 API 次数限制及异常回退。浏览器验证还覆盖实际点击答题、拼句、自由表达、学习手账和手机布局。

## 常见问题

**8000 端口已被占用**：关闭上一次启动窗口后再打开。启动器不会自动结束其他程序。

**提示未连接学习服务**：确认启动窗口仍在运行；开发模式下确认后端已启动。若旧登录过期，可重新登录或选择访客体验。

**首次安装失败**：确认 Python、Node.js 可在终端运行，且能访问对应依赖源。把启动窗口里的错误信息用于排查。

**登录状态重启后失效**：保持 `.env` 中 `SECRET_KEY` 不变。未设置固定值时，后端会使用进程级随机值。

**字体加载慢**：界面可使用系统中文字体；远程字体不可用时不影响学习功能。

**想减少动画**：打开左侧“体验设置”，关闭“场景与角色动态”。
