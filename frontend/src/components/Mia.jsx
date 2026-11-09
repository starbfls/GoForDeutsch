const frames = { smile: [0, 0], thinking: [1, 0], talking: [2, 0], happy: [0, 1], encourage: [1, 1], celebrate: [2, 1] };
const descriptions = { smile: "Mia 微笑", thinking: "Mia 思考", talking: "Mia 说话", happy: "Mia 开心地笑", encourage: "Mia 给出提示", celebrate: "Mia 庆祝完成" };

export default function Mia({ expression = "smile", className = "" }) {
  const [x, y] = frames[expression] || frames.smile;
  return <div className={`mia-portrait ${className}`} role="img" aria-label={descriptions[expression]}>
    <div className="mia-sprite" style={{ backgroundPosition: `${x * 50}% ${y * 100}%` }} />
  </div>;
}
