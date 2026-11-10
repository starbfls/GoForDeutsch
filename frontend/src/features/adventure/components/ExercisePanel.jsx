import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Lightbulb,
  LoaderCircle,
  Send,
} from "lucide-react";
import AnswerInput from "./AnswerInput";
export default function ExercisePanel({ game }) {
  const {
    run,
    busy,
    pending,
    feedback,
    turn,
    advance,
    askOpen,
    setAskOpen,
    question,
    setQuestion,
  } = game;
  const step = run.step;
  const hasAnswer =
    step.type === "choice"
      ? Boolean(game.selected)
      : step.type === "tiles"
        ? game.tiles.length > 0
        : Boolean(game.text.trim());
  return (
    <section className="exercise-panel" data-step={step.id}>
      <h2>{step.prompt}</h2>
      <div className="german-prompt">{step.german}</div>
      <AnswerInput game={game} step={step} />
      {feedback && (
        <div
          className={`answer-feedback ${feedback.correct ? "correct" : ""}`}
          role="status"
        >
          {feedback.correct ? <Check size={16} /> : <Lightbulb size={16} />}
          <span>
            {feedback.correct
              ? "正确"
              : feedback.action === "answer"
                ? "再试一次"
                : "提示见左侧"}
          </span>
        </div>
      )}
      <div className="exercise-bottom">
        {pending ? (
          <button className="primary-button" onClick={advance}>
            {" "}
            {pending.completed ? "完成" : "继续"}
            <ArrowRight size={17} />
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={() => turn("answer")}
            disabled={!hasAnswer || busy}
          >
            {busy ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Check size={17} />
            )}
            检查答案
            <ArrowRight size={17} />
          </button>
        )}
        <div className="hint-actions">
          <button
            onClick={() => turn("hint")}
            disabled={busy || Boolean(pending)}
          >
            <Lightbulb size={15} />
            提示
          </button>
          <button
            onClick={() => turn("example")}
            disabled={busy || Boolean(pending)}
          >
            <BookOpen size={15} />
            例句
          </button>
          <button
            onClick={() => setAskOpen(!askOpen)}
            disabled={busy || Boolean(pending)}
          >
            <CircleHelp size={15} />
            问问 Mia
          </button>
        </div>
        {askOpen && (
          <form
            className="ask-mia"
            onSubmit={(event) => {
              event.preventDefault();
              if (question.trim()) turn("ask");
            }}
          >
            <label htmlFor="mia-question">关于当前任务，你想问什么？</label>
            <div>
              <input
                id="mia-question"
                placeholder="例如：为什么这里要用 ein？"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={300}
                disabled={busy || Boolean(pending)}
              />
              <button
                aria-label="向 Mia 提问"
                disabled={!question.trim() || busy || Boolean(pending)}
              >
                <Send size={17} />
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
