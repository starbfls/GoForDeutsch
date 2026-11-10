import { Link } from "react-router-dom";
import { LogOut, Settings2, Star } from "lucide-react";
export default function AdventureHeader({ game, user, logout }) {
  const labels = {
    town: "学习地图",
    missions: "练习",
    cards: "单词卡",
    notebook: "学习记录",
    lesson: "Kennenlernen",
  };
  return (
    <header className="adventure-topbar">
      <span className="current-section">{labels[game.page]}</span>
      <div className="topbar-right">
        <span className="xp-pill">
          <Star size={17} />
          {game.progress.xp} XP
        </span>
        <button
          className="settings-icon"
          aria-label="打开设置"
          onClick={() => game.setSettings(true)}
        >
          <Settings2 size={20} />
        </button>
        {user ? (
          <button
            className="profile-button"
            disabled={game.busy}
            onClick={() => {
              logout();
              game.navigate("town");
            }}
            title="退出登录"
          >
            <span>{user.username}</span>
            <LogOut size={18} />
          </button>
        ) : (
          <Link className="profile-button" to="/login">
            登录
          </Link>
        )}
      </div>
    </header>
  );
}
