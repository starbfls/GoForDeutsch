import { ArrowRight, Coins } from "lucide-react";
import { useWardrobe } from "@/context/WardrobeContext";
import WordCollection from "@/features/flashcards/WordCollection";
export default function CompletionPanel({ game }) {
  const { inventory } = useWardrobe();
  const reward = game.mission.id === "clothing-checkout" && inventory.shop_unlocked;
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
      {game.run.reward_coins > 0 ? (
        <div className="completion-coins">
          <Coins size={27} />+{game.run.reward_coins} 金币
        </div>
      ) : (
        <div className="completion-replay">
          本轮为复习，首次通关金币已领取。
        </div>
      )}
      {reward && <div className="outfit-reward"><strong>获得粉格便服</strong><p>商店已开启</p><button className="secondary-button" onClick={() => game.navigate("backpack")}>打开背包换装</button></div>}
      <WordCollection
        key={game.run.run_id}
        cards={game.run.collection_candidates}
        onCollected={game.markCollected}
        notify={game.setToast}
      />
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
                : next.unit_id !== game.activeUnit?.id ? game.selectUnit(next.unit_id) : game.navigate("town")
              : game.navigate("cards")
          }
        >
          {hasNext ? (nextHere ? "下一练习" : next.unit_id !== game.activeUnit?.id ? "进入第二单元" : "选择下一地点") : "复习单词"}
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}
