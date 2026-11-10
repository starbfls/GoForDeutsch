import { useState } from "react";
import { CircleHelp, Lightbulb, MessageCircle } from "lucide-react";
import Mia from "@/components/Mia";
import { sceneGuide } from "@/features/companion/dialogue";
import "@/features/companion/companion.css";
export default function SceneStage({ game, children }) {
  const [talk, setTalk] = useState(false);
  const { scene, run, busy, expression, speech, pending } = game;
  const message = !run && talk ? sceneGuide(scene.id).observe : speech;
  return (
    <section
      className={`lesson-scene scene-${scene.id}`}
      aria-label={`${scene.location}场景`}
    >
      <div
        className="scene-art"
        style={{ backgroundImage: `url('${scene.image}')` }}
      />
      <div className="lesson-mia">
        <button
          className="scene-companion-button"
          aria-label="和场景里的 Mia 聊聊"
          aria-expanded={talk}
          disabled={busy}
          onClick={() => setTalk(!talk)}
        >
          <Mia
            expression={busy ? "ponder" : talk && !run ? "ponder" : expression}
          />
        </button>
      </div>
      <div className="dialogue-box" aria-live="polite">
        <strong>Mia</strong>
        <p>{busy ? "想一想…" : message}</p>
        {talk && run && !run.completed && (
          <div className="scene-companion-actions">
            <button
              disabled={busy || Boolean(pending)}
              onClick={() => {
                setTalk(false);
                game.turn("hint");
              }}
            >
              <Lightbulb size={16} />
              给一点线索
            </button>
            <button
              disabled={busy || Boolean(pending)}
              onClick={() => {
                setTalk(false);
                game.setAskOpen(true);
                setTimeout(
                  () => document.querySelector("#mia-question")?.focus(),
                  0,
                );
              }}
            >
              <CircleHelp size={16} />
              我想问问
            </button>
          </div>
        )}
        {!run && !talk && (
          <button className="scene-talk-trigger" onClick={() => setTalk(true)}>
            <MessageCircle size={16} />和 Mia 聊聊
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
