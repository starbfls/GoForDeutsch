import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Compass, Flag, Flower2, Home, Leaf, Lightbulb, LoaderCircle, LockKeyhole, LogOut, Map, Play, RotateCcw, Send, Settings2, Sparkles, Star, Target, Trophy, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { learningApi } from "@/services/api";
import Mia from "@/components/Mia";
import "./Adventure.css";

const EMPTY = { completed: [], xp: 0, evidence: [], recommended: "bakery-first", results: {} };
const STRATEGIES = { observe: "一起观察", hint: "一点提示", example: "看看例子", retry: "再试一次", transfer: "换个情境也试试", celebrate: "值得庆祝" };
const friendlyError = (err) => typeof err.response?.data?.detail === "string" ? err.response.data.detail : "暂时没有连接到学习服务。请先启动后端，再点“重新连接”。";

function MissionCard({ mission, index, progress, onStart, compact = false }) {
  const done = progress.completed.includes(mission.id);
  const unlocked = index === 0 || progress.completed.includes(["bakery-first", "bakery-picnic", "bakery-review"][index - 1]);
  return <button className={`mission-card ${compact ? "compact" : ""} ${done ? "is-done" : ""}`} onClick={() => onStart(mission)} disabled={!unlocked}>
    <span className="mission-art">{mission.icon}<span className="mission-number">0{index + 1}</span></span>
    <span className="mission-body"><span className="mission-eyebrow">{done ? "已完成 · 可以再练" : unlocked ? "现在可以出发" : "完成前一任务后解锁"}</span><strong>{mission.title}</strong><span className="mission-subtitle">{mission.subtitle}</span><span className="mission-meta">{mission.duration}<span>＋{mission.xp} XP</span></span></span>
    <span className="mission-arrow">{done ? <Check size={18} /> : unlocked ? <ArrowRight size={18} /> : <LockKeyhole size={17} />}</span>
  </button>;
}

export default function Adventure() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState("town");
  const [data, setData] = useState(null);
  const [progress, setProgress] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(false);
  const [motion, setMotion] = useState(() => localStorage.getItem("gfd-motion") !== "off");
  const [run, setRun] = useState(null);
  const [mission, setMission] = useState(null);
  const [selected, setSelected] = useState("");
  const [tiles, setTiles] = useState([]);
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [pending, setPending] = useState(null);
  const [speech, setSpeech] = useState("Hallo! 我是 Mia。今天一起去面包店，为野餐做准备吧！");
  const [expression, setExpression] = useState("smile");
  const [toast, setToast] = useState("");
  const inflight = useRef(false);
  const loadVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError("");
    try {
      const { data: result } = await learningApi.bootstrap();
      if (version !== loadVersion.current) return;
      setData(result);
      setProgress(result.progress);
    } catch (err) { if (version === loadVersion.current) setError(friendlyError(err)); }
    finally { if (version === loadVersion.current) setLoading(false); }
  }, []);

  useEffect(() => {
    // Defer initial fetching so identity changes reset before the request starts.
    const timer = setTimeout(load, 0);
    return () => { clearTimeout(timer); };
  }, [load, user]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!settings) return;
    const previousFocus = document.activeElement;
    const close = (event) => {
      if (event.key === "Escape") setSettings(false);
      if (event.key === "Tab") {
        const nodes = [...document.querySelectorAll('.settings-modal button, .settings-modal a, .settings-modal input')].filter((node) => !node.disabled);
        const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); previousFocus?.focus(); };
  }, [settings]);

  const resetInputs = () => { setSelected(""); setTiles([]); setText(""); setQuestion(""); setFeedback(null); setAskOpen(false); };

  const start = async (chosen) => {
    if (inflight.current) return;
    inflight.current = true;
    setBusy(true);
    try {
      const { data: result } = await learningApi.start(chosen.id);
      setRun(result); setMission(chosen); setPending(null); resetInputs();
      setSpeech(result.message); setExpression("talking"); setPage("lesson");
    } catch (err) { setToast(friendlyError(err)); }
    finally { inflight.current = false; setBusy(false); }
  };

  const turn = async (action) => {
    if (!run || inflight.current || pending) return;
    inflight.current = true;
    setBusy(true);
    setFeedback(null);
    const answer = run.step.type === "choice" ? selected : run.step.type === "tiles" ? tiles.map((i) => run.step.tiles[i]).join(" ") : text;
    try {
      const { data: result } = await learningApi.turn({ run_id: run.run_id, revision: run.revision, action, answer, question });
      setSpeech(result.tutor.message); setExpression(result.tutor.expression); setProgress(result.progress);
      if (result.tutor.notice) setToast(result.tutor.notice);
      setFeedback({ correct: result.correct, action, source: result.tutor.source, strategy: result.tutor.strategy });
      if (result.correct) setPending(result);
      else setRun(result);
      setQuestion("");
    } catch (err) { setToast(friendlyError(err)); }
    finally { inflight.current = false; setBusy(false); }
  };

  const advance = () => {
    if (!pending) return;
    const next = pending;
    setPending(null); setRun(next); resetInputs();
    if (next.completed) { setExpression("celebrate"); setSpeech("采购完成！谢谢你的帮忙，我们把学到的表达带到下一个任务里吧。"); }
    else { setExpression("smile"); setSpeech(next.step.prompt); }
  };

  const navigate = (target) => {
    if (busy) return;
    if (target === "lesson") return;
    setPage(target);
    setRun(null); setPending(null); resetInputs();
    setExpression("smile");
    setSpeech("Hallo! 我是 Mia。今天一起去面包店，为野餐做准备吧！");
  };

  const missions = data?.missions || [];
  const recommended = missions.find((m) => m.id === progress.recommended) || missions[0];
  const completedCount = progress.completed.length;
  const independent = progress.evidence.filter((item) => item.independent).length;
  const activeStep = run?.step;
  const hasAnswer = activeStep?.type === "choice" ? Boolean(selected) : activeStep?.type === "tiles" ? tiles.length > 0 : Boolean(text.trim());
  const intro = page === "lesson" ? ["BAKERY ADVENTURE", mission?.title, "一步一步，把德语用起来。"] : page === "missions" ? ["YOUR NEXT ADVENTURE", "每个任务，学会一件小事。", "从认识一个词，到自己说出一句话。"] : page === "notebook" ? ["MY LEARNING JOURNAL", "把学会的德语，装进口袋。", "任务里的词汇、表达和你的每一点进步。"] : ["DEIN KLEINES ABENTEUER", "Hallo，冒险家！", "和 Mia 一起，在小镇里发现德语。"];

  return <div className={`adventure-app ${motion ? "" : "reduce-motion"}`}>
    <aside className="adventure-sidebar">
      <button className="brand" onClick={() => navigate("town")} aria-label="GoForDeutsch 首页"><span className="brand-mark"><Leaf size={25} strokeWidth={2.4} /></span><span>GoFor<strong>Deutsch<span>✦</span></strong></span></button>
      <div className="sidebar-caption">你的德语小世界</div>
      <nav aria-label="主导航">{[["town", Compass, "探索小镇"], ["missions", Flag, "我的任务"], ["notebook", BookOpen, "学习手账"]].map(([id, Icon, title]) => <button key={id} className={`nav-item ${page === id || id === "missions" && page === "lesson" ? "active" : ""}`} onClick={() => navigate(id)} aria-label={title} title={title}><Icon size={20} /><span>{title}</span>{id === "missions" && <span className="nav-count">{3 - completedCount}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="level-card"><span className="level-icon">🌱</span><strong>A1 · 初来小镇</strong><p>每一次尝试，都在向前。</p><div className="tiny-progress"><i style={{ width: `${Math.max(5, completedCount / 3 * 100)}%` }} /></div><span>{completedCount} / 3 个任务已完成</span></div><button className="nav-item" onClick={() => setSettings(true)} aria-label="体验设置" title="体验设置"><Settings2 size={19} /><span>体验设置</span></button><div className="sidebar-footer">Kleine Schritte. Große Abenteuer.</div></div>
    </aside>

    <div className="adventure-main">
      <header className="adventure-topbar"><div className="breadcrumb"><Home size={15} /><ChevronRight size={13} /><span>{page === "lesson" ? "面包店" : page === "missions" ? "我的任务" : page === "notebook" ? "学习手账" : "探索小镇"}</span></div><div className="topbar-right"><span className="xp-pill"><Star size={16} fill="currentColor" />{progress.xp} XP</span><button className="settings-icon" onClick={() => setSettings(true)} aria-label="打开体验设置"><Settings2 size={18} /></button>{user ? <button className="profile-button" onClick={() => { logout(); navigate("town"); }} title="点击退出账号"><span>🌿</span><span>{user.username}</span><LogOut size={15} /></button> : <Link className="profile-button" to="/login"><span>🌿</span><span>体验冒险家</span></Link>}</div></header>

      <main className="adventure-content">
        <div className="page-heading"><div><div className="eyebrow">{intro[0]}</div><h1>{intro[1]}{page === "town" && <span className="heading-sun">☀</span>}</h1><p>{intro[2]}</p></div><span className="chapter-tag"><span />第一章 · 小镇的新朋友</span></div>
        {error && <div className="connection-error" role="alert"><CircleHelp size={20} /><span>{error}</span><button onClick={load}>重新连接</button>{localStorage.getItem("token") && <button onClick={() => { logout(); setTimeout(load, 0); }}>以访客重新进入</button>}</div>}
        {loading && !data && <div className="loading-line"><LoaderCircle size={17} className="spin" />正在准备你的冒险…</div>}

        {page === "town" && <>
          <div className="town-layout"><section className="town-stage" aria-label="可探索的小镇地图"><div className="town-background" /><div className="scene-shade" /><div className="map-heading"><span className="map-badge"><Map size={14} />WILLKOMMEN IN SONNENFELD</span><h2>阳光小镇</h2><p>每一条小路，都藏着新发现。</p></div><div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="floating-leaf leaf-one">✧</div><div className="floating-leaf leaf-two">✧</div>
            <button className="map-pin bakery-pin" onClick={() => recommended && start(recommended)} disabled={!recommended || busy}><span className="pin-dot"><Flag size={17} fill="currentColor" /></span><span><small>今日冒险</small><strong>面包店 · Bäckerei</strong></span><ArrowRight size={16} /></button>
            <button className="map-pin school-pin" onClick={() => setToast("学校篇还在准备中。先和 Mia 完成面包店的三个任务吧！")}><LockKeyhole size={14} /><span>学校 · 即将开放</span></button>
            <button className="map-pin park-pin" onClick={() => setToast("野餐公园是接下来的故事。当前版本可以先在面包店练习采购。 ")}><LockKeyhole size={14} /><span>公园 · 即将开放</span></button>
            <div className="map-mia"><Mia expression={expression} /><div className="map-speech"><span>MIA <i>你的冒险伙伴</i></span><p>{speech}</p></div></div><span className="map-coordinate">SONNENFELD · A1</span>
          </section>
          <aside className="today-panel"><div className="panel-top"><span className="small-icon"><Target size={18} /></span><span>今天的小目标</span><span className="day-chip">TAG 01</span></div><span className="quest-illustration">🥐<i>✦</i></span><div className="eyebrow">MISSION {String(Math.min(completedCount + 1, 3)).padStart(2, "0")}</div><h2>{recommended?.title || "面包店的初次见面"}</h2><p>{recommended?.intro || "和 Mia 一起认识面包店里的食物，试着用德语完成第一次点单。"}</p><div className="quest-tags"><span>🌱 A1 入门</span><span>约 5 分钟</span></div><div className="quest-reward"><Star size={15} />任务完成可获 <strong>＋{recommended?.xp || 40} XP</strong></div><button className="primary-button" onClick={() => recommended && start(recommended)} disabled={!recommended || busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <Play size={16} fill="currentColor" />} {completedCount === 3 ? "再来挑战一次" : "和 Mia 出发"}<ArrowRight size={17} /></button><span className="gentle-note">随时可以停下来，进度会为你保留。</span></aside></div>
          <div className="section-heading"><div><span className="eyebrow">A LITTLE MORE EVERY DAY</span><h2>下一站，小小的进步</h2></div><button className="text-button" onClick={() => navigate("missions")}>查看所有任务<ArrowRight size={15} /></button></div>
          <div className="mission-grid">{missions.map((item, index) => <MissionCard key={item.id} mission={item} index={index} progress={progress} onStart={start} compact />)}</div>
          <div className="bottom-note"><Flower2 size={17} /><span>不必一次就做对。Mia 会陪你多试一次。</span><span className="local-indicator"><span className={data?.ai.enabled ? "live-dot" : ""} />{data?.ai.enabled ? "AI 教学已启用" : "预设教学体验"}</span></div>
        </>}

        {page === "missions" && <><div className="journey-banner"><span>🧺</span><div><strong>第一章：为野餐做准备</strong><p>认识食物 → 礼貌点单 → 独立采购。让每个新表达都有用武之地。</p></div><span className="journey-count">{completedCount} / 3</span></div><div className="mission-list">{missions.map((item, index) => <MissionCard key={item.id} mission={item} index={index} progress={progress} onStart={start} />)}</div><div className="learning-principle"><Lightbulb size={21} /><p>任务完成代表一次练习经历。我们会分别记录独立完成与提示后完成，再通过新情境检查是否记住。</p></div></>}

        {page === "notebook" && <><div className="notebook-stats"><div><Trophy /><strong>{completedCount}</strong><span>完成的任务</span></div><div><Star /><strong>{progress.xp}</strong><span>探索经验 XP</span></div><div><Check /><strong>{independent}</strong><span>独立完成的步骤</span></div></div><div className="section-heading"><div><span className="eyebrow">WÖRTER & SÄTZE</span><h2>面包店里的德语口袋</h2></div><span className="subtle">点击卡片，看看它怎么用</span></div><div className="vocab-grid">{data?.vocabulary.map((word) => <details className="vocab-card" key={word.de}><summary><span>{word.emoji}</span><strong>{word.de}</strong><small>{word.zh}</small><ChevronRight size={16} /></summary><p>{word.example}</p></details>)}</div><div className="section-heading"><div><span className="eyebrow">DEINE FORTSCHRITTE</span><h2>我的练习足迹</h2></div></div>{!completedCount ? <div className="empty-journal"><BookOpen size={30} /><h3>第一段冒险，等你写下。</h3><p>完成一个任务后，就能在这里看到你的学习记录。</p><button className="primary-button" onClick={() => navigate("town")}>去小镇看看<ArrowRight size={16} /></button></div> : <div className="evidence-list">{missions.filter((m) => progress.results[m.id]).map((m) => <div className="evidence-row" key={m.id}><span>{m.icon}</span><div><strong>{m.title}</strong><p>{progress.results[m.id].evidence.map((e) => `${e.skill}：${e.independent ? "独立完成" : "提示后完成"}`).join(" · ")}</p></div><Check size={20} /></div>)}</div>}<div className="learning-principle"><Leaf size={21} /><p>这里记录的是练习证据，不把一次答对直接当成“已经掌握”。完成第三个任务，可以换情境再检验一次。</p></div></>}

        {page === "lesson" && run && <>
          <div className="lesson-toolbar"><button className="text-button" onClick={() => navigate("town")} disabled={busy}><ArrowLeft size={16} />返回小镇</button><div className="step-dots">{Array.from({ length: run.steps_count }, (_, i) => <span key={i} className={i < run.index ? "done" : i === run.index ? "current" : ""}>{i < run.index ? <Check size={12} /> : i + 1}</span>)}</div><span className="subtle">{run.completed ? "任务完成" : `${run.index + 1} / ${run.steps_count}`}</span></div>
          {run.completed ? <div className="completion"><div className="confetti" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</div><Mia expression="celebrate" /><span className="eyebrow">GUT GEMACHT!</span><h2>第一次、第二次，每一次都算数。</h2><p>{speech}</p><div className="completion-reward"><Star fill="currentColor" />{mission.xp} XP <small>每个任务只奖励一次</small></div><div className="completion-evidence">{run.evidence.map((item) => <span key={item.step_id}><Check size={14} />{item.skill}<b>{item.independent ? "独立完成" : "提示后完成"}</b></span>)}</div><div className="completion-actions"><button className="secondary-button" onClick={() => navigate("notebook")}><BookOpen size={17} />看看学习手账</button><button className="primary-button" onClick={() => { const next = missions.find((m) => m.id === progress.recommended); if (next && next.id !== mission.id) start(next); else navigate("town"); }}>继续冒险<ArrowRight size={17} /></button></div></div> : <div className="lesson-layout"><section className="lesson-scene"><div className="bakery-background" /><span className="scene-location">📍 BÄCKEREI · 面包店</span><div className="lesson-mia"><Mia expression={busy ? "thinking" : expression} /></div><div className="dialogue-box" aria-live="polite"><div className="dialogue-name">Mia<span>{busy ? "正在想一个好提示…" : feedback ? STRATEGIES[feedback.strategy] : "和你一起冒险"}</span><span className="dialogue-source">{feedback?.source === "openai" ? "AI 辅导" : "学习伙伴"}</span></div><p>{speech}</p></div></section>
          <section className="exercise-panel"><div className="exercise-label"><span>任务 {String(run.index + 1).padStart(2, "0")}</span><span>{activeStep.skill}</span></div><h2>{activeStep.prompt}</h2><div className="german-prompt">{activeStep.german}</div>
            {activeStep.type === "choice" && <div className="choice-options" role="group" aria-label="选择一个答案">{activeStep.options.map((option) => <button className={`choice-option ${selected === option.id ? "selected" : ""}`} key={option.id} onClick={() => setSelected(option.id)} disabled={busy || Boolean(pending)} aria-pressed={selected === option.id}><span className="option-emoji">{option.emoji}</span><span><strong>{option.de}</strong><small>{option.zh}</small></span><span className="choice-radio">{selected === option.id && <Check size={12} />}</span></button>)}</div>}
            {activeStep.type === "tiles" && <div className="tiles-exercise"><div className="sentence-area" aria-label="已排列的句子">{tiles.length ? tiles.map((index, position) => <button key={index} onClick={() => setTiles(tiles.filter((_, i) => i !== position))} disabled={busy || Boolean(pending)}>{activeStep.tiles[index]}</button>) : <span>点击下面的词块，组成一句话…</span>}</div><div className="tile-bank">{activeStep.tiles.map((tile, i) => <button key={i} disabled={tiles.includes(i) || busy || Boolean(pending)} onClick={() => setTiles([...tiles, i])}>{tile}</button>)}</div><button className="text-button" onClick={() => setTiles([])} disabled={busy || Boolean(pending)}><RotateCcw size={13} />重新排列</button></div>}
            {activeStep.type === "text" && <form onSubmit={(event) => { event.preventDefault(); if (hasAnswer) turn("answer"); }}><label className="answer-label" htmlFor="german-answer">你的德语回答</label><textarea id="german-answer" value={text} onChange={(event) => setText(event.target.value)} maxLength={300} placeholder={activeStep.placeholder} disabled={busy || Boolean(pending)} /><div className="umlaut-keys">{["ä", "ö", "ü", "ß"].map((letter) => <button type="button" key={letter} onClick={() => setText(text + letter)} disabled={busy || Boolean(pending)}>{letter}</button>)}<span>也支持 ae / oe / ue</span></div></form>}
            {feedback && <div className={`answer-feedback ${feedback.correct ? "correct" : ""}`} role="status">{feedback.correct ? <Check size={16} /> : <Lightbulb size={16} />}<span>{feedback.correct ? "做到了！看看 Mia 的解释，再继续下一步。" : feedback.action === "answer" ? "再检查一下，Mia 给你留了一点提示。" : "提示已经送到，看看 Mia 的对话框。"}</span></div>}
            <div className="exercise-bottom">{pending ? <button className="primary-button" onClick={advance}> {pending.completed ? "看看这次的收获" : "继续下一步"}<ArrowRight size={17} /></button> : <button className="primary-button" onClick={() => turn("answer")} disabled={!hasAnswer || busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <Check size={17} />}检查我的回答<ArrowRight size={17} /></button>}<div className="hint-actions"><button onClick={() => turn("hint")} disabled={busy || Boolean(pending)}><Lightbulb size={15} />一点提示</button><button onClick={() => turn("example")} disabled={busy || Boolean(pending)}><BookOpen size={15} />看个例子</button><button onClick={() => setAskOpen(!askOpen)} disabled={busy || Boolean(pending)}><CircleHelp size={15} />问问 Mia</button></div>{askOpen && <form className="ask-mia" onSubmit={(event) => { event.preventDefault(); if (question.trim()) turn("ask"); }}><label htmlFor="mia-question">关于当前任务，你想问什么？</label><div><input id="mia-question" placeholder="例如：为什么这里要用 ein？" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={300} disabled={busy || Boolean(pending)} /><button aria-label="向 Mia 提问" disabled={!question.trim() || busy || Boolean(pending)}><Send size={17} /></button></div><small>{data?.ai.enabled ? "由 AI 围绕本次任务提供辅导。" : "当前使用预设提示；接通 AI 后可按你的问题解释。"}</small></form>}</div>
          </section></div>}
        </>}
        <footer className="adventure-footer"><span>GoForDeutsch <span>✦</span> Mit Mia lernen.</span><span>每天一小步，德语大冒险。</span></footer>
      </main>
    </div>
    {toast && <div className="toast" role="status"><Sparkles size={17} /><span>{toast}</span><button onClick={() => setToast("")} aria-label="关闭提示"><X size={16} /></button></div>}
    {settings && <div className="modal-backdrop" onClick={() => setSettings(false)}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSettings(false)} aria-label="关闭设置" autoFocus><X size={20} /></button><span className="eyebrow">MAKE YOURSELF AT HOME</span><h2 id="settings-title">按自己的节奏来。</h2><p>第一版是本机教学体验，适合先由成人测试。</p><label className="motion-toggle"><span><strong>场景与角色动态</strong><small>关闭后减少漂浮、呼吸和庆祝动画</small></span><input type="checkbox" checked={motion} onChange={(event) => { setMotion(event.target.checked); localStorage.setItem("gfd-motion", event.target.checked ? "on" : "off"); }} /></label><div className="settings-info"><strong>{data?.ai.enabled ? `AI 教学已启用 · ${data.ai.model}` : "当前使用预设教学提示"}</strong><p>真实 AI 在后端配置。密钥不会显示或保存在浏览器中。API 不可用时自动使用预设提示。</p></div><p className="settings-help">访客进度保存在本机后端，以当前浏览器体验身份区分。登录账号与访客进度分别保存，暂不自动合并。</p>{!user && <Link className="secondary-button" to="/register">创建账号<ArrowRight size={16} /></Link>}</section></div>}
  </div>;
}
