import { useState } from "react";
import { Bookmark } from "lucide-react";
export default function WordCard({ card, deck, onActive }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [focus, setFocus] = useState(false);
  const expanded = hover || pinned || focus;
  return (
    <article
      className={`word-card ${expanded ? "expanded" : ""}`}
      onMouseEnter={() => {
        setHover(true);
        onActive(card);
      }}
      onMouseLeave={() => {
        setHover(false);
        if (!pinned && !focus) onActive(null);
      }}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) {
          setFocus(true);
          onActive(card);
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocus(false);
          if (!pinned && !hover) onActive(null);
        }
      }}
    >
      <div className="word-card-heading">
        <button
          className="word-trigger"
          onClick={() => {
            setPinned(!pinned);
            onActive(!pinned ? card : null);
          }}
          aria-expanded={expanded}
        >
          {card.de}
        </button>
        <button
          className={`bookmark-button ${card.review.favorite ? "saved" : ""}`}
          onClick={() => deck.favorite(card)}
          disabled={deck.busy}
          aria-label={`${card.review.favorite ? "取消收藏" : "收藏"} ${card.de}`}
          aria-pressed={card.review.favorite}
        >
          <Bookmark
            size={20}
            fill={card.review.favorite ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="word-expansion" aria-hidden={!expanded} inert={!expanded}>
        <div>
          <p className="word-meaning">{card.zh}</p>
          <p className="word-example" lang="de">
            {card.example}
          </p>
          <p className="word-memory">{card.mnemonic}</p>
          <button
            className="text-button card-practice"
            onClick={() => deck.begin(card.id)}
          >
            复习这个词 →
          </button>
        </div>
      </div>
    </article>
  );
}
