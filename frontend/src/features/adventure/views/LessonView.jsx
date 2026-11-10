import { ArrowLeft } from "lucide-react";
import Mia from "@/components/Mia";
import ExercisePanel from "../components/ExercisePanel";
import CompletionPanel from "../components/CompletionPanel";
export default function LessonView({ game }) {
  const { run, busy, expression, speech, navigate } = game;
  const scene = game.data.chapters.find(
    (item) => item.id === game.mission.chapter_id,
  );
  return (
    <>
      <div className="lesson-toolbar">
        <button
          className="text-button"
          onClick={() => navigate("town")}
          disabled={busy}
        >
          <ArrowLeft size={19} />
          地图
        </button>
        <span>
          {run.completed ? "已完成" : `${run.index + 1} / ${run.steps_count}`}
        </span>
        <span>{scene.de}</span>
      </div>
      {run.completed ? (
        <CompletionPanel game={game} />
      ) : (
        <div className="lesson-layout" key={game.mission.id}>
          <section className={`lesson-scene scene-${scene.id}`}>
            <div
              className="scene-art"
              style={{ backgroundImage: `url('${scene.image}')` }}
            />
            <div className="lesson-mia">
              <Mia expression={busy ? "ponder" : expression} />
            </div>
            <div className="dialogue-box" aria-live="polite">
              <strong>Mia</strong>
              <p>{busy ? "想一想…" : speech}</p>
            </div>
          </section>
          <ExercisePanel game={game} />
        </div>
      )}
    </>
  );
}
