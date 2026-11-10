import { Eye, EyeOff } from "lucide-react";

export default function PasswordField({ form }) {
  return (
    <label htmlFor="account-password">
      密码
      <div className="password-field">
        <input
          id="account-password"
          autoComplete={form.registering ? "new-password" : "current-password"}
          type={form.visible ? "text" : "password"}
          value={form.password}
          onChange={(event) => form.setPassword(event.target.value)}
          required
          minLength={form.registering ? 8 : undefined}
          disabled={form.busy}
          placeholder={form.registering ? "至少 8 个字符" : "输入你的密码"}
        />
        <button
          type="button"
          onClick={() => form.setVisible(!form.visible)}
          aria-label={form.visible ? "隐藏密码" : "显示密码"}
          disabled={form.busy}
        >
          {form.visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}
