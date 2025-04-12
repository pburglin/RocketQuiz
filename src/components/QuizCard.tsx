import { Tag } from "lucide-react";
import ColorCardPlaceholder from "./ColorCardPlaceholder";

export default function QuizCard({
  quiz,
}: {
  quiz: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    image: string;
    popularity: number;
    language: string;
  };
}) {
  return (
    <a
      href={`/quiz/${quiz.id}`}
      className="min-w-[300px] max-w-xs bg-white rounded-xl shadow-lg hover:shadow-2xl transition flex flex-col overflow-hidden border border-gray-100"
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
        <h3 className="font-semibold text-lg text-gray-800 mb-1">{quiz.title}</h3>
        <p className="text-gray-500 text-sm mb-2 line-clamp-2">{quiz.description}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {quiz.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs text-gray-400">{quiz.language}</span>
          <span className="text-xs text-emerald-500 font-bold">
            {quiz.popularity}% Popular
          </span>
        </div>
      </div>
    </a>
  );
}
