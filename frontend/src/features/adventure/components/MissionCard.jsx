import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { unlocked } from "../catalog";
export default function MissionCard({ mission, index, progress, onStart }) {
  const done = progress.completed.includes(mission.id);
  const available = unlocked(mission, progress);
  return (
    <button
      className={`mission-card ${done ? "is-done" : ""}`}
      onClick={() => onStart(mission)}
      disabled={!available}
    >
      <span className="mission-number">
        {String(index + 1).padStart(2, "0")}
      </span>
      <strong>{mission.title}</strong>
      <span className="mission-status">
        {done ? "已完成" : available ? "可练习" : "未解锁"}
      </span>
      {done ? (
        <Check size={20} />
      ) : available ? (
        <ArrowRight size={20} />
      ) : (
        <LockKeyhole size={18} />
      )}
    </button>
  );
}
