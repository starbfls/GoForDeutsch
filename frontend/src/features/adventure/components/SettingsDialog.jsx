import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
export default function SettingsDialog({ game, user }) {
  const { setSettings, motion, setMotion, data } = game;
  useEffect(() => {
    const previous = document.activeElement;
    const close = (event) => {
      if (event.key === "Escape") setSettings(false);
      if (event.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll(
            ".settings-modal button,.settings-modal a,.settings-modal input",
          ),
        ].filter((node) => !node.disabled);
        if (event.shiftKey && document.activeElement === nodes[0]) {
          event.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
          event.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      previous?.focus();
    };
  }, [setSettings]);
  return (
    <div className="modal-backdrop" onClick={() => setSettings(false)}>
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={() => setSettings(false)}
          aria-label="关闭设置"
          autoFocus
        >
          <X size={20} />
        </button>
        <h2 id="settings-title">设置</h2>
        <label className="motion-toggle">
          <span>
            <strong>场景与角色动态</strong>
          </span>
          <input
            type="checkbox"
            checked={motion}
            onChange={(event) => {
              setMotion(event.target.checked);
              localStorage.setItem(
                "gfd-motion",
                event.target.checked ? "on" : "off",
              );
              window.dispatchEvent(
                new CustomEvent("gfd-motion-change", {
                  detail: event.target.checked,
                }),
              );
            }}
          />
        </label>
        <div className="settings-info">
          <strong>
            {data?.ai.enabled
              ? `AI 教学已启用 · ${data.ai.model}`
              : "当前使用预设教学提示"}
          </strong>
        </div>
        {!user && (
          <Link className="secondary-button" to="/register">
            创建账号
            <ArrowRight size={16} />
          </Link>
        )}
      </section>
    </div>
  );
}
