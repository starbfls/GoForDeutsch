import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  LockKeyhole,
  LoaderCircle,
  Croissant,
  TreeDeciduous,
  GraduationCap,
} from "lucide-react";
import { WORLD, mapCamera, mapPoint } from "./camera";
import { MAP_LOCATIONS } from "./locations";
const PLACE_ICONS = {
  bakery: Croissant,
  park: TreeDeciduous,
  school: GraduationCap,
};
export default function TownMap({ scenes, travel, onSelect, available, busy }) {
  const viewport = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const camera = mapCamera(
    size.width,
    size.height,
    (travel && MAP_LOCATIONS[travel.id]?.focus) || travel?.map,
  );
  return (
    <section
      ref={viewport}
      className={`town-stage ${travel ? "is-entering" : ""}`}
      aria-label="小镇学习地图"
      aria-busy={busy}
      data-focused={travel?.id || "overview"}
    >
      <div
        className="map-world"
        data-camera-x={camera.x}
        data-camera-y={camera.y}
        data-camera-scale={camera.scale}
        style={{
          width: WORLD.width,
          height: WORLD.height,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
        }}
      />
      {size.width > 0 &&
        scenes.map((scene) => {
          const location = MAP_LOCATIONS[scene.id] || scene.map;
          const point = mapPoint(
            camera,
            size.width < 340 && location.compact ? location.compact : location,
          );
          const PlaceIcon = PLACE_ICONS[scene.id];
          return (
            <button
              key={scene.id}
              data-chapter={scene.id}
              className={`map-pin ${available(scene) ? "" : "is-locked"}`}
              style={{ left: point.x, top: point.y }}
              onClick={() => onSelect(scene)}
              disabled={busy}
              aria-label={`进入${scene.location}`}
            >
              {PlaceIcon && (
                <span className="map-pin-icon" aria-hidden="true">
                  <PlaceIcon size={25} strokeWidth={1.8} />
                </span>
              )}
              <span className="map-pin-copy">
                <strong>{scene.location}</strong>
                <span lang="de">{scene.de}</span>
              </span>
              {available(scene) ? (
                <ArrowUpRight size={18} />
              ) : (
                <LockKeyhole size={17} />
              )}
            </button>
          );
        })}
      {busy && (
        <div className="map-travel-status" role="status">
          <LoaderCircle className="spin" size={20} />
          正在进入{travel?.location || "场景"}…
        </div>
      )}
    </section>
  );
}
