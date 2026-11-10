import useMiaBlink from "./useMiaBlink";
const BASE = {
  thinking: [1, 0],
  talking: [2, 0],
  happy: [0, 1],
  encourage: [1, 1],
  celebrate: [2, 1],
};
const EXTRA = {
  wink: [0, 0],
  surprised: [1, 0],
  proud: [2, 0],
  ponder: [0, 1],
  focus: [1, 1],
};
const LABELS = {
  smile: "Mia 微笑",
  thinking: "Mia 思考",
  talking: "Mia 说话",
  happy: "Mia 微笑",
  encourage: "Mia 提示",
  celebrate: "Mia 开心",
  wink: "Mia 眨眼",
  surprised: "Mia 惊讶",
  proud: "Mia 微笑",
  ponder: "Mia 思考",
  focus: "Mia 专注思考",
};
export default function Mia({ expression = "smile", className = "" }) {
  const blink = useMiaBlink(expression === "smile");
  let kind = "base",
    position;
  if (expression === "smile") {
    kind = "idle";
    position = blink ? "100% 0%" : "0% 0%";
  } else if (EXTRA[expression]) {
    kind = "extra-v3";
    const [x, y] = EXTRA[expression];
    position = `${x * 50}% ${y * 100}%`;
  } else {
    const [x, y] = BASE[expression] || [0, 0];
    position = `${x * 50}% ${y * 100}%`;
  }
  return (
    <div
      className={`mia-portrait ${className}`}
      role="img"
      aria-label={LABELS[expression] || LABELS.smile}
      data-expression={expression}
      data-blink={blink ? "closed" : "open"}
    >
      <div
        key={expression}
        className={`mia-sprite mia-${kind}`}
        style={{ backgroundPosition: position }}
      />
    </div>
  );
}
