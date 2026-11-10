import { useState } from "react";
import { ArrowRight, MessageCircle, X } from "lucide-react";
import Mia from "@/components/Mia";
import { mapGreeting, mapRecommendation, nextDestination } from "./dialogue";
import "./companion.css";
export default function MapCompanion({ game }) {
  const [topic, setTopic] = useState(null);
  const destination = nextDestination(game);
  const text =
    topic === "next"
      ? mapRecommendation(game)
      : topic === "study"
        ? "先看情境，再自己想一句；卡住时，我给你一点线索。复习单词时先回忆再翻面。你来做决定，我陪你检查。Probier’s mal!"
        : mapGreeting(game);
  const allDone = game.progress.completed.length === game.data?.missions.length;
  return (
    <section className="map-companion" aria-label="Mia 学习伙伴">
      <button
        className="companion-portrait"
        onClick={() => setTopic(topic ? null : "hello")}
        disabled={game.busy}
        aria-label="和 Mia 聊聊"
        aria-expanded={Boolean(topic)}
      >
        <Mia
          expression={
            topic === "study"
              ? "ponder"
              : topic === "next"
                ? "encourage"
                : "smile"
          }
        />
        <span className="companion-name">
          Mia <MessageCircle size={18} />
        </span>
      </button>
      {topic && (
        <div
          className="companion-dialogue"
          role="region"
          aria-label="Mia 的对话"
        >
          <button
            className="companion-close"
            aria-label="关闭 Mia 对话"
            onClick={() => setTopic(null)}
          >
            <X size={18} />
          </button>
          <p aria-live="polite">{text}</p>
          <div className="companion-topics">
            <button onClick={() => setTopic("next")}>下一步去哪儿</button>
            <button onClick={() => setTopic("study")}>怎么一起学</button>
          </div>
          {topic === "next" && (
            <button
              className="companion-next"
              onClick={() =>
                allDone ? game.navigate("cards") : game.enterScene(destination)
              }
              disabled={game.busy || (!allDone && !destination)}
            >
              {allDone
                ? "复习单词"
                : `去${destination?.location || "面包店"}看看`}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
