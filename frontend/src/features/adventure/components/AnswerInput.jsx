import VocabularyIcon from "@/components/VocabularyIcon";
import { Check, RotateCcw } from "lucide-react";
export default function AnswerInput({ game, step }) {
  const {
    selected,
    setSelected,
    tiles,
    setTiles,
    text,
    setText,
    busy,
    pending,
    turn,
  } = game;
  const hasAnswer = Boolean(text.trim());
  return (
    <>
      {step.type === "choice" && (
        <div className="choice-options" role="group" aria-label="选择一个答案">
          {step.options.map((option) => (
            <button
              className={`choice-option ${selected === option.id ? "selected" : ""}`}
              key={option.id}
              onClick={() => setSelected(option.id)}
              disabled={busy || Boolean(pending)}
              aria-pressed={selected === option.id}
            >
              <span className="option-emoji">
                <VocabularyIcon emoji={option.emoji} />
              </span>
              <span>
                <strong>{option.de}</strong>
                <small>{option.zh}</small>
              </span>
              <span className="choice-radio">
                {selected === option.id && <Check size={12} />}
              </span>
            </button>
          ))}
        </div>
      )}
      {step.type === "tiles" && (
        <div className="tiles-exercise">
          <div className="sentence-area" aria-label="已排列的句子">
            {tiles.length ? (
              tiles.map((index, position) => (
                <button
                  key={index}
                  onClick={() =>
                    setTiles(tiles.filter((_, i) => i !== position))
                  }
                  disabled={busy || Boolean(pending)}
                >
                  {step.tiles[index]}
                </button>
              ))
            ) : (
              <span>点击下面的词块，组成一句话…</span>
            )}
          </div>
          <div className="tile-bank">
            {step.tiles.map((tile, i) => (
              <button
                key={i}
                disabled={tiles.includes(i) || busy || Boolean(pending)}
                onClick={() => setTiles([...tiles, i])}
              >
                {tile}
              </button>
            ))}
          </div>
          <button
            className="text-button"
            onClick={() => setTiles([])}
            disabled={busy || Boolean(pending)}
          >
            <RotateCcw size={13} />
            重新排列
          </button>
        </div>
      )}
      {step.type === "text" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (hasAnswer) turn("answer");
          }}
        >
          <label className="answer-label" htmlFor="german-answer">
            你的德语回答
          </label>
          <textarea
            id="german-answer"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={300}
            placeholder={step.placeholder}
            disabled={busy || Boolean(pending)}
          />
          <div className="umlaut-keys">
            {["ä", "ö", "ü", "ß"].map((letter) => (
              <button
                type="button"
                key={letter}
                onClick={() => setText(text + letter)}
                disabled={busy || Boolean(pending)}
              >
                {letter}
              </button>
            ))}
            <span>也支持 ae / oe / ue</span>
          </div>
        </form>
      )}
    </>
  );
}
