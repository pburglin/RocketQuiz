import { Tag, Play, Users } from "lucide-react";
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
    totalPlays?: number;
    uniqueUsers?: number;
  };
}) {
  return (
    <Link
      to={`/play/quiz/${quiz.id}/details`}
      className="min-w-[300px] max-w-xs bg-base-100 rounded-xl shadow-lg hover:shadow-2xl transition flex flex-col overflow-hidden border border-accent"
      itemScope
      itemProp="mainEntityOfPage"
      itemType="https://schema.org/LearningResource"
      aria-label={`Quiz: ${quiz.title}`}
    >
      {/* Add hidden structured data */}
      <meta itemProp="identifier" content={quiz.id} />
      <meta itemProp="inLanguage" content={quiz.language} />
      {typeof quiz.totalPlays === "number" && <meta itemProp="interactionCount" content={`UserPlays:${quiz.totalPlays}`} />}
      {typeof quiz.uniqueUsers === "number" && <meta itemProp="userInteractionCount" content={`${quiz.uniqueUsers}`} />}
      {quiz.averageRating !== undefined && <meta itemProp="aggregateRating" content={`${quiz.averageRating}`} />}
      
      {quiz.image && quiz.image.trim() !== "" ? (
        <img
          src={quiz.image}
          alt={`Cover image for ${quiz.title} quiz`}
          className="h-40 w-full object-cover"
          loading="lazy"
          itemProp="image"
        />
      ) : (
        <ColorCardPlaceholder
          id={quiz.id}
          text={quiz.title ? quiz.title.charAt(0).toUpperCase() : "?"}
          className="h-40 w-full"
          aria-hidden="true"
        />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg text-primary mb-1" itemProp="name">{quiz.title}</h3>
        
        {/* Display star rating if available */}
        {quiz.averageRating !== undefined && (
          <div
            className="flex items-center gap-2 mb-1"
            itemProp="aggregateRating"
            itemScope
            itemType="https://schema.org/AggregateRating"
          >
            <meta itemProp="ratingValue" content={`${quiz.averageRating}`} />
            <meta itemProp="ratingCount" content={`${quiz.ratingCount || 0}`} />
            <meta itemProp="bestRating" content="5" />
            <meta itemProp="worstRating" content="1" />
            
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
        
        <p className="text-gray-500 text-sm mb-2 line-clamp-2" itemProp="description">{quiz.description}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {quiz.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-white rounded text-xs font-medium"
              itemProp="keywords"
            >
              <Tag className="w-3 h-3" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>
        {/* Stats Section */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
          {typeof quiz.totalPlays === "number" && (
            <span className="inline-flex items-center gap-1">
              <Play className="w-3 h-3" aria-hidden="true" /> {quiz.totalPlays} Play(s)
            </span>
          )}
          {typeof quiz.uniqueUsers === "number" && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" aria-hidden="true" /> {quiz.uniqueUsers} Players
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs text-gray-400" itemProp="inLanguage">{quiz.language}</span>
          <span className="text-xs text-gray-400 font-medium text-right flex-1">
            {typeof quiz.questionCount === "number" ? (
              <>
                <span itemProp="educationalAlignment" itemScope itemType="https://schema.org/AlignmentObject">
                  <meta itemProp="targetName" content={`${quiz.questionCount} Questions`} />
                </span>
                {quiz.questionCount} Questions
              </>
            ) : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
