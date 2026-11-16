import { BookOpen, Lightbulb, FilePenLine } from "lucide-react";
export default function TaskContext({ step, feedback }) {
  if (step.passage)
    return (
      <article className="task-context reading-context" aria-label="阅读材料">
        <h3>
          <BookOpen size={19} />
          {step.passage.title}
        </h3>
        <ol>
          {step.passage.lines.map((line, index) => (
            <li
              key={index}
              data-line={index + 1}
              className={
                feedback?.assessment?.focus_line === index + 1
                  ? "evidence-line"
                  : ""
              }
            >
              <span className="line-number">{index + 1}</span>
              <span lang="de">{line}</span>
            </li>
          ))}
        </ol>
      </article>
    );
  if (step.mode === "vocabulary")
    return (
      <article className="task-context clue-context" aria-label="猜词线索">
        <h3>
          <Lightbulb size={19} />
          线索 {step.clues.length}/{step.clues_count}
        </h3>
        <ol>
          {step.clues.map((clue, index) => (
            <li key={index}>
              <span className="line-number">{index + 1}</span>
              <span>{clue}</span>
            </li>
          ))}
        </ol>
      </article>
    );
  if (step.brief)
    return (
      <article className="task-context writing-context" aria-label="写作任务卡">
        <h3>
          <FilePenLine size={19} />
          {step.brief.title}
        </h3>
        <ul>
          {step.brief.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </article>
    );
  return null;
}
