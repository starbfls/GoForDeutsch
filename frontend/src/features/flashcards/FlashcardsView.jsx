import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import Mia from "@/components/Mia";
import useFlashcards from "./useFlashcards";
import CardLibrary from "./CardLibrary";
import ReviewCard from "./ReviewCard";
import "./flashcards.css";
import "@/features/companion/companion.css";
export default function FlashcardsView({ game }) {
  const deck = useFlashcards(game.setToast);
  const [active, setActive] = useState(null);
  const [miaOpen, setMiaOpen] = useState(false);
  if (deck.loading)
    return (
      <div className="loading-line">
        <LoaderCircle className="spin" size={21} />
        正在加载…
      </div>
    );
  if (deck.error)
    return (
      <div className="connection-error">
        <span>{deck.error}</span>
        <button onClick={deck.load}>重试</button>
      </div>
    );
  const expression = deck.current
    ? deck.revealed
      ? "proud"
      : "ponder"
    : active
      ? active.id.length % 2
        ? "ponder"
        : "focus"
      : "smile";
  return (
    <div className="flashcards-layout">
      <div className="flashcards-main">
        {deck.finished ? (
          <section className="review-finished">
            <h2>复习完成</h2>
            <p>{deck.queue.length} 张</p>
            <button className="primary-button" onClick={deck.exit}>
              返回单词卡
            </button>
          </section>
        ) : deck.current ? (
          <ReviewCard deck={deck} />
        ) : (
          <CardLibrary
            deck={deck}
            chapters={game.data?.chapters || []}
            onActive={setActive}
          />
        )}
      </div>
      <aside className="flashcard-mia" aria-label="Mia">
        {miaOpen && (
          <p className="flashcard-mia-note" aria-live="polite">
            {deck.finished
              ? "Gut gemacht! 下次再用这些词说一句话，看看能不能独立想起来。"
              : deck.current && !deck.revealed
                ? "Erst überlegen! 先在脑海里回忆意思，再翻面。暂时想不起来也没关系，看看例句后再试一次。"
                : deck.revealed
                  ? "把例句放回刚才的场景里，再用自己的话说一遍。自评按这一次的回忆情况来选就好。"
                  : active
                    ? "试试把这个词和场景连起来：盖住中文，再自己说一句。需要时再展开看线索。"
                    : "Hallo! 你来选词，我陪你复习。先回忆再翻面，联想和例句会在需要时帮你。"}
          </p>
        )}
        <button
          className="flashcard-mia-button"
          aria-label="和单词卡旁的 Mia 聊聊"
          aria-expanded={miaOpen}
          onClick={() => setMiaOpen(!miaOpen)}
        >
          <Mia expression={expression} />
        </button>
      </aside>
    </div>
  );
}
