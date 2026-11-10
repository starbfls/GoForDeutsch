import TownMap from "../map/TownMap";
import MapCompanion from "@/features/companion/MapCompanion";
import { nextInChapter, unlocked } from "../catalog";
export default function TownView({ game }) {
  const scenes = game.data?.chapters || [];
  const available = (scene) => {
    const next = nextInChapter(
      game.data?.missions || [],
      game.progress,
      scene.id,
    );
    return Boolean(next && unlocked(next, game.progress));
  };
  return (
    <div className="map-shell">
      <TownMap
        scenes={scenes}
        travel={game.travel}
        onSelect={game.enterScene}
        available={available}
        busy={game.busy}
      />
      <MapCompanion game={game} />
    </div>
  );
}
