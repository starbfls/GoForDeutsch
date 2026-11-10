import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Copy } from "lucide-react";

export default function WelcomeCard({ username }) {
  const [copyStatus, setCopyStatus] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(username);
      setCopyStatus("用户名已复制。");
    } catch {
      setCopyStatus("没有复制成功，可以手动选中下面的用户名保存。");
    }
  };
  return (
    <section className="auth-card welcome-card" aria-labelledby="welcome-title">
      <span className="auth-leaf">
        <Check size={25} />
      </span>
      <div className="eyebrow">GoForDeutsch</div>
      <h2 id="welcome-title">账号已创建</h2>
      <p>下次登录使用此用户名。</p>
      <div className="generated-username">
        <small>你的德语用户名</small>
        <strong>{username}</strong>
      </div>
      <button className="secondary-button copy-username" onClick={copy}>
        <Copy size={16} />
        复制用户名
      </button>
      <p className="copy-status" role="status">
        {copyStatus}
      </p>
      <div className="auth-note">账号与访客进度分别保存。</div>
      <Link className="primary-button welcome-continue" to="/" replace>
        进入学习
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}
