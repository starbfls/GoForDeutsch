import { ArrowLeft } from "lucide-react";
import SceneStage from "../components/SceneStage";
import SceneLanding from "../components/SceneLanding";
import ExercisePanel from "../components/ExercisePanel";
import CompletionPanel from "../components/CompletionPanel";
import SceneTasks from "../components/SceneTasks";
export default function LessonView({ game }) {
  const { run, busy, navigate, scene } = game;
  if (!scene) return null;
  return (
    <>
      <div className="lesson-toolbar">
        <button
          className="text-button"
          onClick={() => navigate("town")}
          disabled={busy}
        >
          <ArrowLeft size={19} />
          大地图
        </button>
        <span>
          {scene.location} · {scene.de}
        </span>
        <span>
          {run
            ? run.completed
              ? "已完成"
              : `${run.index + 1} / ${run.steps_count}`
            : ""}
        </span>
      </div>
      <div
        className={`lesson-layout scene-entry ${run ? "" : "scene-preview"}`}
        key={scene.id}
      >
        <SceneStage key={scene.id + Boolean(run)} game={game}>
          {!run && <SceneLanding game={game} />}
        </SceneStage>
        {run && (
          <aside className="scene-task-pane" aria-label="场景练习">
            {run.completed ? (
              <CompletionPanel game={game} />
            ) : (
              <>
                <SceneTasks game={game} scene={scene} picker />
                <ExercisePanel game={game} />
              </>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
