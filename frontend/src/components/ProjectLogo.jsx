import logo from "@/assets/logo.png";
import "./projectLogo.css";

export default function ProjectLogo({ className = "" }) {
  return <img src={logo} className={`project-logo ${className}`} alt="GoForDeutsch" width="1536" height="1024" decoding="async" />;
}
