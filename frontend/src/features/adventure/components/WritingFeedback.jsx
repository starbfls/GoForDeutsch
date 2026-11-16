import { Check, Circle } from "lucide-react";
export default function WritingFeedback({ assessment }) {
  if (assessment?.kind !== "writing") return null;
  return (
    <div className="writing-feedback" aria-label="写作反馈">
      <div className="writing-stats">
        {assessment.word_count} 词 · {assessment.sentence_count} 句
      </div>
      <ul>
        {assessment.criteria.map((item) => (
          <li key={item.id} className={item.met ? "met" : ""}>
            {item.met ? <Check size={17} /> : <Circle size={16} />}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      {assessment.issues[0] && <p>{assessment.issues[0]}</p>}
    </div>
  );
}
