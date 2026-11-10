import { Bookmark, ChevronLeft } from "lucide-react";
const RATINGS = [
  ["again", "再学一次"],
  ["hard", "模糊"],
  ["good", "记得"],
  ["easy", "熟悉"],
];
export default function ReviewCard({ deck }) {
  const card = deck.current;
  return (
    <section className="review-stage">
      <div className="review-topline">
        <button
          className="text-button"
          onClick={deck.exit}
          disabled={deck.busy}
        >
          <ChevronLeft size={20} />
          单词卡
        </button>
        <span>
          {deck.index + 1}/{deck.queue.length}
        </span>
        <button
          className={`bookmark-button ${card.review.favorite ? "saved" : ""}`}
          onClick={() => deck.favorite(card)}
          disabled={deck.busy}
          aria-label={card.review.favorite ? "取消收藏" : "收藏单词卡"}
          aria-pressed={card.review.favorite}
        >
          <Bookmark
            size={21}
            fill={card.review.favorite ? "currentColor" : "none"}
          />
        </button>
      </div>
      <button
        className={`flashcard-flipper ${deck.revealed ? "is-flipped" : ""}`}
        onClick={() => deck.setRevealed(!deck.revealed)}
        disabled={deck.busy}
        aria-label={deck.revealed ? "收起释义" : "显示释义"}
        aria-pressed={deck.revealed}
      >
        <span className="flashcard-inner">
          <span className="flashcard-face front" aria-hidden={deck.revealed}>
            <strong lang="de">{card.de}</strong>
          </span>
          <span className="flashcard-face back" aria-hidden={!deck.revealed}>
            <strong>{card.zh}</strong>
            <span className="flashcard-example" lang="de">
              {card.example}
            </span>
            <span className="flashcard-memory">{card.mnemonic}</span>
          </span>
        </span>
      </button>
      <div className="review-ratings">
        {RATINGS.map(([id, title]) => (
          <button
            key={id}
            data-rating={id}
            onClick={() => deck.review(id)}
            disabled={!deck.revealed || deck.busy}
          >
            {title}
          </button>
        ))}
      </div>
    </section>
  );
}
