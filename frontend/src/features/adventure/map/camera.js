export const WORLD = { width: 2172, height: 724 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function mapCamera(width, height, focus = null) {
  const baseScale = Math.max(width / WORLD.width, height / WORLD.height);
  if (!focus) {
    return {
      scale: baseScale,
      x: (width - WORLD.width * baseScale) / 2,
      y: (height - WORLD.height * baseScale) / 2,
    };
  }
  const scale = baseScale * 2.3;
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
    y: camera.y + point.y * WORLD.height * camera.scale,
  };
}
