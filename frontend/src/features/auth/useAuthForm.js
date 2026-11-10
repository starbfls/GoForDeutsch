import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function explainError(error) {
  if (!error.response)
    return "暂时没有连接到学习服务，请确认启动窗口仍在运行。";
  if (error.response.status === 401)
    return "用户名或密码不正确，请再检查一下。";
  if (error.response.status === 429) return "操作有点快，请稍等片刻再试。";
  return "暂时没有完成，请稍后再试；你也可以先以访客体验。";
}

export default function useAuthForm(mode) {
  const auth = useAuth();
  const navigate = useNavigate();
  const registering = mode === "register";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdUsername, setCreatedUsername] = useState("");
  const submitting = useRef(false);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    if (registering && password !== confirmation) {
      setError("两次密码不一致，请再检查一下。");
      return;
    }
    if (registering && password.length < 8) {
      setError("密码至少需要 8 个字符。");
      return;
    }
    if (registering && new TextEncoder().encode(password).length > 72) {
      setError("密码过长，请缩短后再试。");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      if (registering) {
        const result = await auth.register(password);
        setCreatedUsername(result.username);
        setPassword("");
        setConfirmation("");
      } else {
        await auth.login(username.trim(), password);
        navigate("/", { replace: true });
      }
    } catch (cause) {
      setError(explainError(cause));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return {
    user: auth.user,
    restoring: auth.loading,
    registering,
    username,
    setUsername,
    password,
    setPassword,
    confirmation,
    setConfirmation,
    visible,
    setVisible,
    error,
    busy,
    createdUsername,
    submit,
  };
}
