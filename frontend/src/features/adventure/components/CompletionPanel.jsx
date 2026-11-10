import { ArrowRight } from "lucide-react";
export default function CompletionPanel({ game }) {
  const next = game.data.missions.find(
    (mission) => mission.id === game.progress.recommended,
  );
  const hasNext =
    game.progress.completed.length < game.data.missions.length &&
    next &&
    next.id !== game.mission.id;
  const nextHere = hasNext && next.chapter_id === game.scene.id;
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
            hasNext
              ? nextHere
                ? game.start(next)
                : game.navigate("town")
              : game.navigate("cards")
          }
        >
          {hasNext ? (nextHere ? "下一练习" : "选择下一地点") : "复习单词"}
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}
