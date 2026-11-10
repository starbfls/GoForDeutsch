import WordCard from "./WordCard";
export default function CardLibrary({ deck, chapters, onActive }) {
  return (
    <>
      <div className="card-filters">
        <select
          aria-label="筛选场景"
          value={deck.chapter}
          onChange={(event) => deck.setChapter(event.target.value)}
        >
          <option value="all">全部场景</option>
          {chapters.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.location}
            </option>
          ))}
        </select>
        <div className="card-filter-tabs" role="group" aria-label="单词卡筛选">
          {[
            ["due", "待复习"],
            ["all", "全部"],
            ["saved", "收藏"],
          ].map(([id, label]) => (
            <button
              key={id}
              data-scope={id}
              aria-pressed={deck.scope === id}
              onClick={() => deck.setScope(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="primary-button"
          onClick={() => deck.begin()}
          disabled={!deck.filtered.length || deck.busy}
        >
          复习 5 张
        </button>
      </div>
      {deck.filtered.length ? (
        <div className="word-grid">
          {deck.filtered.map((card) => (
            <WordCard
              key={card.id}
              card={card}
              deck={deck}
              onActive={onActive}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{deck.scope === "saved" ? "暂无收藏" : "暂时没有待复习的词"}</h2>
          <button
            className="secondary-button"
            onClick={() => deck.setScope("all")}
          >
            查看全部
          </button>
        </div>
      )}
    </>
  );
}
