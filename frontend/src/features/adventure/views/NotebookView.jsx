import { Check } from "lucide-react";
export default function NotebookView({ game }) {
  const missions = game.data?.missions || [];
  return (
    <div className="record-list">
      {game.data?.chapters.map((scene) => (
        <section className="record-section" key={scene.id}>
          <h2>{scene.location}</h2>
          {missions
            .filter((m) => m.chapter_id === scene.id)
            .map((mission) => {
              const result = game.progress.results[mission.id];
              const independent =
                result?.evidence.filter((item) => item.independent).length || 0;
              return (
                <div className="evidence-row" key={mission.id}>
                  <strong>{mission.title}</strong>
                  <span>
                    {result
                      ? `独立完成 ${independent}/${result.evidence.length}`
                      : "未完成"}
                  </span>
                  {result && <Check size={20} />}
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}
