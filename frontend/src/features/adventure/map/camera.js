export const WORLD = { width: 2400, height: 1600 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function mapCamera(width, height, focus) {
  const scale = Math.max(width / WORLD.width, height / WORLD.height) * 1.9;
  return {
    scale,
    x: clamp(
      width * 0.5 - focus.x * WORLD.width * scale,
      width - WORLD.width * scale,
      0,
    ),
    y: clamp(
      height * 0.48 - focus.y * WORLD.height * scale,
      height - WORLD.height * scale,
      0,
    ),
  };
}
export function mapPoint(camera, point) {
  return {
    x: camera.x + point.x * WORLD.width * camera.scale,
    y: camera.y + (point.y - 0.11) * WORLD.height * camera.scale,
  };
}
