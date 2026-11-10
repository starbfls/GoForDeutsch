// A round bread roll is visually distinct from the baguette emoji.
export default function VocabularyIcon({ emoji }) {
  if (emoji !== "🥖") return emoji;
  return (
    <svg
      viewBox="0 0 64 64"
      width="1em"
      height="1em"
      role="img"
      aria-label="小面包"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <ellipse cx="32" cy="39" rx="27" ry="19" fill="#cb8a42" />
      <ellipse cx="32" cy="34" rx="26" ry="19" fill="#edb967" />
      <path
        d="M16 38C19 26 25 21 28 20M27 43C30 29 36 23 39 22M39 44C42 33 47 28 49 28"
        stroke="#fff0c9"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 43C22 54 45 54 55 43"
        stroke="#d89b50"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
