import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Mia from "@/components/Mia";
import "./auth.css";

export default function AuthLayout({ children, registering, welcome }) {
  return (
    <div className="adventure-app auth-world">
      <Link to="/" className="auth-back">
        <ArrowLeft size={16} />
        返回小镇
      </Link>
      <div className="auth-layout">
        <section className="auth-story" aria-label="Mia 的欢迎">
          <div className="eyebrow">GoForDeutsch</div>
          <h1>和 Mia 一起学德语</h1>
          <p>Kennenlernen</p>
          <Mia
            expression={welcome ? "proud" : registering ? "wink" : "smile"}
          />
        </section>
        {children}
      </div>
    </div>
  );
}
