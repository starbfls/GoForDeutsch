import { useEffect, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { WORLD, mapCamera, mapPoint } from "./camera";
import Mia from "@/components/Mia";
export default function TownMap({
  scenes,
  selected,
  onSelect,
  available,
  children,
}) {
  const viewport = useRef(null);
  const [size, setSize] = useState({ width: 1000, height: 650 });
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
    selected?.map || { x: 0.27, y: 0.58 },
  );
  return (
    <section
      ref={viewport}
      className="town-stage"
      aria-label="小镇学习地图"
      data-focused={selected?.id}
    >
      <div
        className="map-world"
        data-camera-x={camera.x}
        data-camera-y={camera.y}
        style={{
          width: WORLD.width,
          height: WORLD.height,
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
        }}
      />
      <div className="map-edge" />
      {scenes.map((scene) => {
        const point = mapPoint(camera, scene.map);
        return (
          <button
            key={scene.id}
            data-chapter={scene.id}
            className={`map-pin ${scene.id}-pin ${scene.id === selected?.id ? "selected" : ""}`}
            style={{ left: point.x, top: point.y }}
            onClick={() => onSelect(scene.id)}
            aria-pressed={scene.id === selected?.id}
            aria-label={`查看${scene.location}`}
          >
            <span>{scene.de}</span>
            {!available(scene) && <LockKeyhole size={15} />}
          </button>
        );
      })}
      <div className="map-mia">
        <Mia expression="smile" />
      </div>
      {children}
    </section>
  );
}
