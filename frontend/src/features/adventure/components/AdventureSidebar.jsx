import {
  Backpack,
  Store,
  BookOpen,
  ClipboardList,
  Layers,
  Leaf,
  Map,
  Settings2,
} from "lucide-react";
export default function AdventureSidebar({ game }) {
  const items = [
    ["town", Map, "学习地图", "地图"],
    ["missions", ClipboardList, "练习"],
    ["cards", Layers, "单词卡"],
    ["notebook", BookOpen, "学习记录", "记录"],
    ["backpack", Backpack, "背包"],
    ["shop", Store, "商店"],
  ];
  return (
    <aside className="adventure-sidebar">
      <button
        className="brand"
        onClick={() => game.navigate("town")}
        aria-label="GoForDeutsch 首页"
      >
        <span className="brand-mark">
          <Leaf size={26} />
        </span>
        <span>
          GoFor<strong>Deutsch</strong>
        </span>
      </button>
      <nav aria-label="主导航">
        {items.map(([id, Icon, label, short = label]) => (
          <button
            key={id}
            className={`nav-item ${game.page === id || (id === "missions" && game.page === "lesson") ? "active" : ""}`}
            onClick={() => game.navigate(id)}
            aria-label={label}
            title={label}
          >
            <Icon size={21} />
            <span className="nav-label">{label}</span><span className="nav-short">{short}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="unit-progress">
          <strong>{game.activeUnit?.title}</strong>
          <span>
            {game.unitCompleted}/{game.unitMissions.length || 9}
          </span>
          <div className="tiny-progress">
            <i
              style={{
                width: `${(game.unitCompleted / (game.unitMissions.length || 9)) * 100}%`,
              }}
            />
          </div>
        </div>
        <button
          className="nav-item"
          onClick={() => game.setSettings(true)}
          aria-label="设置"
          title="设置"
        >
          <Settings2 size={21} />
          <span>设置</span>
        </button>
      </div>
    </aside>
  );
}
