import { Tag } from "lucide-react";
import { Link } from "react-router-dom";
import ColorCardPlaceholder from "./ColorCardPlaceholder";
import StarRating from "./StarRating";

export default function QuizCard({
  quiz,
}: {
  quiz: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    image: string;
    popularity?: number;
    language: string;
    averageRating?: number;
    ratingCount?: number;
    questionCount?: number;
  };
}) {
  return (
    <Link
      to={`/play/quiz/${quiz.id}/details`}
      className="min-w-[300px] max-w-xs bg-base-100 rounded-xl shadow-lg hover:shadow-2xl transition flex flex-col overflow-hidden border border-accent"
    >
      {quiz.image && quiz.image.trim() !== "" ? (
        <img
          src={quiz.image}
          alt={quiz.title}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <ColorCardPlaceholder
          id={quiz.id}
          text={quiz.title ? quiz.title.charAt(0).toUpperCase() : "?"}
          className="h-40 w-full"
        />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg text-primary mb-1">{quiz.title}</h3>
        
        {/* Display star rating if available */}
        {quiz.averageRating !== undefined && (
          <div className="flex items-center gap-2 mb-1">
            <StarRating
              rating={quiz.averageRating}
              size="sm"
              className="flex-shrink-0"
            />
            <span className="text-xs text-gray-500">
              {quiz.averageRating.toFixed(1)} ({quiz.ratingCount || 0} {quiz.ratingCount === 1 ? 'rating' : 'ratings'})
            </span>
          </div>
        )}
        
        <p className="text-gray-500 text-sm mb-2 line-clamp-2">{quiz.description}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {quiz.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-white rounded text-xs font-medium"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs text-gray-400">{quiz.language}</span>
          <span className="text-xs text-gray-600 font-medium text-center flex-1">
            {typeof quiz.questionCount === "number" ? `${quiz.questionCount} Questions` : ""}
          </span>
          <span className="text-xs text-primary font-bold">
            {typeof quiz.popularity === "number" && !isNaN(quiz.popularity)
              ? `${quiz.popularity}% Popular`
              : "0% Popular"}
          </span>
        </div>
      </div>
    </Link>
  );
}
