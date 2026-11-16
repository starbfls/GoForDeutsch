import useMiaBlink from "./useMiaBlink";
import {
  MIA_APPEARANCE,
  MIA_EXPRESSIONS,
  miaSpriteStyle,
} from "./miaAppearance";

export default function Mia({ expression = "smile", className = "" }) {
  const name = Object.hasOwn(MIA_EXPRESSIONS, expression)
    ? expression
    : "smile";
  const blink = useMiaBlink(name === "smile");
  const frame = blink ? "blink" : name;
  return (
    <div
      className={`mia-portrait ${className}`}
      role="img"
      aria-label={MIA_EXPRESSIONS[name].label}
      data-expression={name}
      data-blink={blink ? "closed" : "open"}
      data-outfit={MIA_APPEARANCE.id}
    >
      <div
        key={name}
        className={`mia-sprite ${name === "smile" ? "is-idle" : ""}`}
        style={miaSpriteStyle(frame)}
      />
    </div>
  );
}
