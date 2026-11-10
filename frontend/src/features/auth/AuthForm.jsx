import { Link } from "react-router-dom";
import { ArrowRight, Leaf, LoaderCircle } from "lucide-react";
import PasswordField from "./PasswordField";

export default function AuthForm({ form }) {
  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <span className="auth-leaf">
        <Leaf size={25} />
      </span>
      <div className="eyebrow">GoForDeutsch</div>
      <h2 id="auth-title">{form.registering ? "创建账号" : "登录"}</h2>
      <p>{form.registering ? "用户名自动生成。" : "使用你的德语用户名。"}</p>
      <form onSubmit={form.submit} aria-busy={form.busy}>
        {form.error && (
          <div className="auth-error" role="alert">
            {form.error}
          </div>
        )}
        {!form.registering && (
          <label htmlFor="account-username">
            德语用户名
            <input
              id="account-username"
              autoComplete="username"
              value={form.username}
              onChange={(event) => form.setUsername(event.target.value)}
              required
              disabled={form.busy}
              placeholder="例如 KatzeSpringt"
            />
          </label>
        )}
        <PasswordField form={form} />
        {form.registering && (
          <label htmlFor="account-confirmation">
            再次输入密码
            <input
              id="account-confirmation"
              autoComplete="new-password"
              type={form.visible ? "text" : "password"}
              value={form.confirmation}
              onChange={(event) => form.setConfirmation(event.target.value)}
              required
              disabled={form.busy}
              placeholder="再确认一次"
            />
          </label>
        )}
        <button className="primary-button" disabled={form.busy}>
          {form.busy && <LoaderCircle className="spin" size={17} />}
          {form.registering ? "创建账号" : "登录"}
          <ArrowRight size={17} />
        </button>
      </form>
      {form.registering && (
        <div className="auth-note">账号与访客进度分别保存。</div>
      )}
      <div className="auth-switch">
        {form.registering ? "已经有账号？" : "第一次来？"}
        <Link to={form.registering ? "/login" : "/register"}>
          {form.registering ? "登录" : "创建账号"}
        </Link>
      </div>
      <Link className="auth-guest" to="/">
        以访客进入
      </Link>
    </section>
  );
}
