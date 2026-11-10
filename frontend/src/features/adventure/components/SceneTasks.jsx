import { ChevronDown, LockKeyhole } from "lucide-react";
import MissionCard from "./MissionCard";
import { unlocked } from "../catalog";
export default function SceneTasks({ game, scene, picker = false }) {
  const lessons = game.data.missions.filter(
    (item) => item.chapter_id === scene.id,
  );
  const hasAvailable = lessons.some((item) => unlocked(item, game.progress));
  const content = (
    <div className="scene-task-list">
      {lessons.map((mission, index) => (
        <MissionCard
          key={mission.id}
          mission={mission}
          index={index}
          progress={game.progress}
          onStart={game.start}
          busy={game.busy}
        />
      ))}
    </div>
  );
  if (picker)
    return (
      <details className="scene-task-picker" key={game.mission?.id}>
        <summary>
          {game.mission?.title}
          <ChevronDown size={18} />
        </summary>
        {content}
      </details>
    );
  return (
    <section className="scene-tasks">
      <h2>练习</h2>
      {!hasAvailable && (
        <p className="scene-locked">
          <LockKeyhole size={18} />
          先完成前一地点的练习
        </p>
      )}
      {content}
    </section>
  );
}
