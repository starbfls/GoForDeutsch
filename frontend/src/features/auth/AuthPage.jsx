import { Navigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import AuthLayout from "./AuthLayout";
import AuthForm from "./AuthForm";
import WelcomeCard from "./WelcomeCard";
import useAuthForm from "./useAuthForm";

export default function AuthPage({ mode }) {
  const form = useAuthForm(mode);
  if (form.user && !form.busy && !form.createdUsername)
    return <Navigate to="/" replace />;
  return (
    <AuthLayout
      registering={form.registering}
      welcome={Boolean(form.createdUsername)}
    >
      {form.restoring ? (
        <section className="auth-card auth-restoring" role="status">
          <LoaderCircle className="spin" size={24} />
          <p>正在登录…</p>
        </section>
      ) : form.createdUsername ? (
        <WelcomeCard username={form.createdUsername} />
      ) : (
        <AuthForm form={form} />
      )}
    </AuthLayout>
  );
}
