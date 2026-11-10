export const WORLD = { width: 4800, height: 1600 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function mapCamera(width, height, focus = null) {
  if (!focus) {
    const scale = Math.max(width / WORLD.width, height / WORLD.height);
    return {
      scale,
      x: (width - WORLD.width * scale) / 2,
      y: (height - WORLD.height * scale) / 2,
    };
  }
  // The original town occupies the central half of the outpainted panorama.
  const target = { x: 0.25 + focus.x * 0.5, y: focus.y };
  const scale = Math.max(width / WORLD.width, height / WORLD.height) * 2.3;
  return {
    scale,
    x: clamp(
      width * 0.5 - target.x * WORLD.width * scale,
      width - WORLD.width * scale,
      0,
    ),
    y: clamp(
      height * 0.48 - target.y * WORLD.height * scale,
      height - WORLD.height * scale,
      0,
    ),
  };
}
export function mapPoint(camera, point) {
  return {
    x: camera.x + point.x * WORLD.width * camera.scale,
    y: camera.y + point.y * WORLD.height * camera.scale,
  };
}
