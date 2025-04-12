import React from "react";

// A palette of visually distinct, pleasant colors
const COLORS = [
  "#f87171", // red-400
  "#fbbf24", // yellow-400
  "#34d399", // emerald-400
  "#60a5fa", // blue-400
  "#a78bfa", // purple-400
  "#f472b6", // pink-400
  "#38bdf8", // sky-400
  "#facc15", // amber-400
  "#4ade80", // green-400
  "#fb7185", // rose-400
];

// Simple hash function to pick a color index based on a string
function getColorIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % COLORS.length;
  }
  return Math.abs(hash) % COLORS.length;
}

type ColorCardPlaceholderProps = {
  id: string;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
};

const ColorCardPlaceholder: React.FC<ColorCardPlaceholderProps> = ({
  id,
  text,
  className = "",
  style = {},
}) => {
  const color = COLORS[getColorIndex(id)];
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        backgroundColor: color,
        color: "#fff",
        fontWeight: 600,
        fontSize: "1.5rem",
        ...style,
      }}
      aria-label={text || "Quiz placeholder"}
    >
      {text ? (
        <span className="truncate px-2">{text}</span>
      ) : (
        <span className="text-3xl">?</span>
      )}
    </div>
  );
};

export default ColorCardPlaceholder;