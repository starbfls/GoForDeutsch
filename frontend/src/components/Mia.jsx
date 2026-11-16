import { useWardrobe } from "@/context/WardrobeContext";
import useMiaBlink from "./useMiaBlink";
import {
  OUTFIT_APPEARANCES,
  MIA_EXPRESSIONS,
  miaSpriteStyle,
} from "./miaAppearance";

export default function Mia({ expression = "smile", className = "", outfit }) {
  const wardrobe = useWardrobe();
  const outfitId = outfit || wardrobe?.inventory.equipped || "school-uniform";
  const appearance = OUTFIT_APPEARANCES[outfitId] || OUTFIT_APPEARANCES["school-uniform"];
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
      data-outfit={appearance.id}
    >
      <div
        key={appearance.id + name}
        className={`mia-sprite ${name === "smile" ? "is-idle" : ""}`}
        style={miaSpriteStyle(frame, appearance.id)}
      />
    </div>
  );
}
