import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Leaf, LoaderCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Mia from "@/components/Mia";

export default function AuthScreen({ register = false }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (register && password !== confirmation) { setError("两次密码不一致，请再检查一下。"); return; }
    if (register && (password.length < 8 || new TextEncoder().encode(password).length > 72)) { setError("密码至少 8 个字符，最多 72 个 UTF-8 字节。"); return; }
    setBusy(true);
    try {
      if (register) await auth.register(password);
      else await auth.login(username, password);
      navigate("/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail === "Invalid username or password" ? "用户名或密码不正确。" : detail : "暂时无法完成，请确认学习服务已启动后再试。");
    } finally { setBusy(false); }
  };
  return <div className="adventure-app auth-world"><Link to="/" className="auth-back"><ArrowLeft size={16} />返回小镇</Link><div className="auth-layout"><section className="auth-story"><div className="eyebrow">DEIN ABENTEUER WARTET</div><h1>每个新朋友，<br />都有一段新冒险。</h1><p>和 Mia 一起，把学到的德语用在小镇生活里。</p><Mia expression={register ? "encourage" : "smile"} /><span className="auth-mia-note">Hallo! Schön, dass du da bist.</span></section><section className="auth-card"><span className="auth-leaf"><Leaf size={25} /></span><div className="eyebrow">GOFORDEUTSCH</div><h2>{register ? "领取你的冒险身份" : "欢迎回到小镇"}</h2><p>{register ? "设置密码，我们会为你生成一个德语用户名。" : "用你的德语用户名继续上一次冒险。"}</p><form onSubmit={submit}>{error && <div className="auth-error" role="alert">{error}</div>}{!register && <label>德语用户名<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required placeholder="例如 KatzeSpringt" /></label>}<label>密码<div className="password-field"><input autoComplete={register ? "new-password" : "current-password"} type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={register ? 8 : undefined} placeholder={register ? "至少 8 个字符" : "输入你的密码"} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "隐藏密码" : "显示密码"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{register && <label>再次输入密码<input autoComplete="new-password" type={visible ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required placeholder="再确认一次" /></label>}<button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : null}{register ? "生成身份，开始冒险" : "回到我的冒险"}<ArrowRight size={17} /></button></form>{register && <div className="auth-note">用户名会显示在小镇右上角，请记住它。访客与账号的进度分别保存。</div>}<div className="auth-switch">{register ? "已经有账号？" : "第一次来？"}<Link to={register ? "/login" : "/register"}>{register ? "登录" : "创建冒险身份"}</Link></div><Link className="auth-guest" to="/">也可以先以访客体验 →</Link></section></div></div>;
}
