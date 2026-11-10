import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import Mia from "@/components/Mia";
import useFlashcards from "./useFlashcards";
import CardLibrary from "./CardLibrary";
import ReviewCard from "./ReviewCard";
import "./flashcards.css";
export default function FlashcardsView({ game }) {
  const deck = useFlashcards(game.setToast);
  const [active, setActive] = useState(null);
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
        <Mia expression={expression} />
      </aside>
    </div>
  );
}
