import { useState } from "react";
import { Check, Plus, LoaderCircle } from "lucide-react";
import { flashcardApi } from "@/services/api";
import { friendlyError } from "../adventure/catalog";
import "./collection.css";

export default function WordCollection({
  cards = [],
  compact = false,
  onCollected,
  notify,
}) {
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState([]);
  const [busy, setBusy] = useState(false);
  if (!cards.length) return null;
  const isSaved = (card) => card.collected || saved.includes(card.id);
  const available = cards.filter((card) => !isSaved(card));
  const identity = () =>
    localStorage.getItem("token") || localStorage.getItem("gfd-learner");
  const collect = async (ids) => {
    if (!ids.length || busy) return;
    const owner = identity();
    setBusy(true);
    try {
      const { data } = await flashcardApi.collect(ids);
      if (identity() !== owner) return;
      setSaved(data.collected_ids);
      setSelected([]);
      onCollected?.(data.collected_ids);
    } catch (error) {
      if (identity() === owner) notify?.(friendlyError(error));
    } finally {
      setBusy(false);
    }
  };
  if (compact) {
    const card = cards[0];
    return (
      <div
        className="word-collection word-collection-inline"
        data-card-id={card.id}
      >
        <strong lang="de">{card.de}</strong>
        <button
          className="secondary-button collect-word-button"
          disabled={busy || isSaved(card)}
          onClick={() => collect([card.id])}
        >
          {busy ? (
            <LoaderCircle size={18} className="spin" />
          ) : isSaved(card) ? (
            <Check size={18} />
          ) : (
            <Plus size={18} />
          )}
          {isSaved(card) ? "已加入单词卡" : "加入单词卡"}
        </button>
      </div>
    );
  }
  return (
    <section className="word-collection" aria-label="选择加入单词卡">
      <div className="collection-heading">
        <h3>加入单词卡</h3>
        {available.length > 0 && (
          <button
            className="text-button"
            data-select-all
            onClick={() =>
              setSelected(
                selected.length === available.length
                  ? []
                  : available.map((card) => card.id),
              )
            }
            disabled={busy}
          >
            {selected.length === available.length ? "取消全选" : "全选"}
          </button>
        )}
      </div>
      <div className="collection-choices">
        {cards.map((card) => (
          <label key={card.id} className={isSaved(card) ? "is-collected" : ""}>
            <input
              type="checkbox"
              checked={isSaved(card) || selected.includes(card.id)}
              disabled={busy || isSaved(card)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, card.id]
                    : current.filter((id) => id !== card.id),
                )
              }
            />
            <span>
              <strong lang="de">{card.de}</strong>
              <span>{card.zh}</span>
            </span>
            {isSaved(card) && <Check size={18} aria-label="已加入" />}
          </label>
        ))}
      </div>
      {available.length > 0 && (
        <button
          className="secondary-button collect-selected-button"
          disabled={!selected.length || busy}
          onClick={() => collect(selected)}
        >
          {busy ? (
            <LoaderCircle size={18} className="spin" />
          ) : (
            <Plus size={18} />
          )}
          加入所选{selected.length ? `（${selected.length}）` : ""}
        </button>
      )}
    </section>
  );
}
