import { ArrowRight, LockKeyhole } from "lucide-react";
import { nextInChapter, unlocked } from "../catalog";
import { sceneGuide } from "@/features/companion/dialogue";
export default function SceneLanding({ game }) {
  const lesson = nextInChapter(
    game.data.missions,
    game.progress,
    game.scene.id,
  );
  const available = Boolean(lesson && unlocked(lesson, game.progress));
  const done = game.progress.completed.includes(lesson?.id);
  return (
    <aside className="scene-start-panel" aria-label="场景入口">
      <h2>{game.scene.location}</h2>
      <p>{sceneGuide(game.scene.id).goal}</p>
      {!available && (
        <p className="scene-locked">
          <LockKeyhole size={18} />
          先完成前一地点的练习
        </p>
      )}
      <button
        className="primary-button scene-start-button"
        disabled={!available || game.busy}
        onClick={() => game.start(lesson)}
      >
        {done ? "再练一次" : "开始练习"}
        <ArrowRight size={20} />
      </button>
    </aside>
  );
}
