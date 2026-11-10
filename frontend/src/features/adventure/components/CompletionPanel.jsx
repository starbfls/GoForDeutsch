import { ArrowRight } from "lucide-react";
export default function CompletionPanel({ game }) {
  const next = game.data.missions.find(
    (mission) => mission.id === game.progress.recommended,
  );
  const independent = game.run.evidence.filter(
    (item) => item.independent,
  ).length;
  return (
    <section className="completion">
      <h2>练习完成</h2>
      <p>
        独立完成 {independent}/{game.run.evidence.length}
      </p>
      <div className="completion-actions">
        <button
          className="secondary-button"
          onClick={() => game.navigate("town")}
        >
          返回地图
        </button>
        <button
          className="primary-button"
          onClick={() =>
            next && next.id !== game.mission.id
              ? game.start(next)
              : game.navigate("cards")
          }
        >
          {next && next.id !== game.mission.id ? "下一练习" : "复习单词"}
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}
