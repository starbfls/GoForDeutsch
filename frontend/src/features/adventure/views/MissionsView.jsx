import MissionCard from "../components/MissionCard";
export default function MissionsView({ game }) {
  const missions = game.data?.missions || [];
  return (
    <div className="mission-sections">
      {game.data?.chapters.map((scene) => (
        <section key={scene.id} className="chapter-section">
          <div className="section-heading">
            <h2>
              {scene.number}. {scene.location}
            </h2>
            <span>
              {
                missions.filter(
                  (m) =>
                    m.chapter_id === scene.id &&
                    game.progress.completed.includes(m.id),
                ).length
              }
              /3
            </span>
          </div>
          <div className="mission-list">
            {missions
              .filter((m) => m.chapter_id === scene.id)
              .map((mission, index) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  index={index}
                  progress={game.progress}
                  onStart={game.start}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
