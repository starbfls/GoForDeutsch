import { LoaderCircle, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useAdventure from "@/features/adventure/hooks/useAdventure";
import AdventureSidebar from "@/features/adventure/components/AdventureSidebar";
import AdventureHeader from "@/features/adventure/components/AdventureHeader";
import UnitSelector from "@/features/adventure/components/UnitSelector";
import SettingsDialog from "@/features/adventure/components/SettingsDialog";
import SceneTransition from "@/features/adventure/components/SceneTransition";
import TownView from "@/features/adventure/views/TownView";
import MissionsView from "@/features/adventure/views/MissionsView";
import NotebookView from "@/features/adventure/views/NotebookView";
import LessonView from "@/features/adventure/views/LessonView";
import FlashcardsView from "@/features/flashcards/FlashcardsView";
import "./Adventure.css";
export default function Adventure() {
  const { user, logout } = useAuth();
  const game = useAdventure(user);
  const title = {
    town: "Kennenlernen",
    missions: "练习",
    cards: "单词卡",
    notebook: "学习记录",
    lesson: game.mission?.title,
  }[game.page];
  return (
    <div className={`adventure-app ${game.motion ? "" : "reduce-motion"}`}>
      <AdventureSidebar game={game} />
      <div className="adventure-main">
        <AdventureHeader game={game} user={user} logout={logout} />
        <main className="adventure-content" aria-busy={game.busy}>
          <div className="page-heading">
            <h1>{title}</h1>
            {game.page !== "lesson" && game.page !== "cards" && (
              <UnitSelector units={game.data?.units} />
            )}
          </div>
          {game.error && (
            <div className="connection-error" role="alert">
              <span>{game.error}</span>
              <button onClick={game.load}>重新连接</button>
              {localStorage.getItem("token") && (
                <button
                  onClick={() => {
                    logout();
                    setTimeout(game.load, 0);
                  }}
                >
                  以访客进入
                </button>
              )}
            </div>
          )}
          {game.loading && !game.data && (
            <div className="loading-line">
              <LoaderCircle className="spin" size={20} />
              正在加载…
            </div>
          )}
          <div className="page-surface" key={game.page}>
            {game.page === "town" && <TownView game={game} />}{" "}
            {game.page === "missions" && <MissionsView game={game} />}{" "}
            {game.page === "notebook" && <NotebookView game={game} />}{" "}
            {game.page === "cards" && (
              <FlashcardsView key={user?.username || "guest"} game={game} />
            )}{" "}
            {game.page === "lesson" && game.run && <LessonView game={game} />}
          </div>
        </main>
      </div>
      {game.toast && (
        <div className="toast" role="status">
          <span>{game.toast}</span>
          <button onClick={() => game.setToast("")} aria-label="关闭提示">
            <X size={18} />
          </button>
        </div>
      )}
      {game.settings && <SettingsDialog game={game} user={user} />}
      <SceneTransition chapter={game.transition} />
    </div>
  );
}
