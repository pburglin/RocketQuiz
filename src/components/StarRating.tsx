import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const starSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = interactive
          ? starValue <= (hoverRating || rating)
          : starValue <= rating;

        return (
          <button
            key={index}
            type="button"
            className={`${
              interactive ? "cursor-pointer" : "cursor-default"
            } transition-colors`}
            onClick={() => {
              if (interactive && onRatingChange) {
                onRatingChange(starValue);
              }
            }}
            onMouseEnter={() => {
              if (interactive) {
                setHoverRating(starValue);
              }
            }}
            onMouseLeave={() => {
              if (interactive) {
                setHoverRating(0);
              }
            }}
            disabled={!interactive}
          >
            <Star
              className={`${starSize} ${
                isFilled
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}