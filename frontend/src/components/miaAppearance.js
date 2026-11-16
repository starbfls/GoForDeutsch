// Every Mia outfit uses this same frame order and expression vocabulary.
export const MIA_APPEARANCE = {
  id: "school-uniform",
  image: "/assets/characters/mia/school-uniform.png",
  columns: 4,
  rows: 3,
  zoom: 1.12,
  // Align the generated closed-eye portrait to the open-eye pose.
  offsets: { blink: [4.57, 0] },
};

export const MIA_EXPRESSIONS = {
  smile: { cell: [0, 0], label: "Mia 微笑" },
  blink: { cell: [1, 0], label: "Mia 闭眼眨眼" },
  thinking: { cell: [2, 0], label: "Mia 思考" },
  talking: { cell: [3, 0], label: "Mia 说话" },
  happy: { cell: [0, 1], label: "Mia 开心微笑" },
  encourage: { cell: [1, 1], label: "Mia 鼓励" },
  celebrate: { cell: [2, 1], label: "Mia 庆祝" },
  wink: { cell: [3, 1], label: "Mia 眨眼招手" },
  surprised: { cell: [0, 2], label: "Mia 惊讶" },
  proud: { cell: [1, 2], label: "Mia 欣慰" },
  ponder: { cell: [2, 2], label: "Mia 好奇思考" },
  focus: { cell: [3, 2], label: "Mia 友好专注" },
};

export function miaSpriteStyle(name) {
  const [x, y] = MIA_EXPRESSIONS[name].cell;
  const [offsetX, offsetY] = MIA_APPEARANCE.offsets[name] || [0, 0];
  return {
    transform: `scale(${MIA_APPEARANCE.zoom}) translate(${offsetX}%, ${offsetY}%)`,
    backgroundImage: `url("${MIA_APPEARANCE.image}")`,
    backgroundSize: `${MIA_APPEARANCE.columns * 100}% ${MIA_APPEARANCE.rows * 100}%`,
    backgroundPosition: `${(x / (MIA_APPEARANCE.columns - 1)) * 100}% ${(y / (MIA_APPEARANCE.rows - 1)) * 100}%`,
  };
}
