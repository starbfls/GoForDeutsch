import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import TownMap from "../map/TownMap";
import { nextInChapter, unlocked } from "../catalog";
export default function TownView({ game }) {
  const [choice, setChoice] = useState(null);
  const scenes = game.data?.chapters || [];
  const missions = game.data?.missions || [];
  const recommended = missions.find(
    (item) => item.id === game.progress.recommended,
  );
  const selected =
    scenes.find((scene) => scene.id === (choice || recommended?.chapter_id)) ||
    scenes[0];
  const lesson =
    selected && nextInChapter(missions, game.progress, selected.id);
  const available = (scene) => {
    const next = nextInChapter(missions, game.progress, scene.id);
    return Boolean(next && unlocked(next, game.progress));
  };
  return (
    <>
      <div className="scene-tabs" role="group" aria-label="选择学习地点">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            aria-pressed={scene.id === selected?.id}
            onClick={() => setChoice(scene.id)}
            disabled={game.busy}
          >
            <span>{String(scene.number).padStart(2, "0")}</span>
            {scene.location}
            <span className="scene-count">
              {
                missions.filter(
                  (m) =>
                    m.chapter_id === scene.id &&
                    game.progress.completed.includes(m.id),
                ).length
              }
              /3
            </span>
          </button>
        ))}
      </div>
      <TownMap
        scenes={scenes}
        selected={selected}
        onSelect={setChoice}
        available={available}
      >
        <aside className="today-panel">
          <h2>{selected?.de || "Bäckerei"}</h2>
          <p>{lesson?.title || "认识食物"}</p>
          {lesson && !available(selected) && (
            <p className="locked-note">
              <LockKeyhole size={16} />
              先完成前一地点的练习
            </p>
          )}
          <button
            className="primary-button"
            disabled={!lesson || !available(selected) || game.busy}
            onClick={() => game.start(lesson)}
          >
            {game.progress.completed.includes(lesson?.id)
              ? "再练一次"
              : "开始练习"}
            <ArrowRight size={20} />
          </button>
        </aside>
      </TownMap>
    </>
  );
}
