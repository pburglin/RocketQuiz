import React from "react";
import ColorCardPlaceholder from "./ColorCardPlaceholder";
import StarRating from "./StarRating";

// Define interfaces locally for type safety
interface Quiz {
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
  [key: string]: unknown;
}

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  image?: string;
  time: number;
}

export default function QuizDetails({
  quiz,
  questions,
  questionsCollapsed,
  setQuestionsCollapsed,
  onStartSinglePlayer,
  onStartMultiplayer,
  onBackToSearch,
}: {
  quiz: Quiz; // Use Quiz interface
  questions: Question[]; // Use Question interface
  questionsCollapsed: boolean;
  setQuestionsCollapsed: (c: boolean) => void;
  onStartSinglePlayer: () => void;
  onStartMultiplayer: () => void;
  onBackToSearch: () => void;
}) {
  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">Quiz not found.</div>
        <button
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded"
          onClick={onBackToSearch}
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-primary">{quiz.title}</h1>
      {quiz.image && quiz.image.trim() !== "" ? (
        <img
          src={quiz.image}
          alt={quiz.title}
          className="w-full h-48 object-cover rounded mb-4"
        />
      ) : (
        <ColorCardPlaceholder
          id={quiz.id}
          text={quiz.title ? quiz.title.charAt(0).toUpperCase() : "?"}
          className="w-full h-48 rounded mb-4"
        />
      )}
      <div className="mb-4 text-gray-600">{quiz.description}</div>
      
      {/* Display rating if available */}
      {quiz.averageRating !== undefined && (
        <div className="mb-4 flex items-center gap-2">
          <StarRating
            rating={quiz.averageRating}
            size="md"
          />
          <span className="text-sm text-gray-600">
            {quiz.averageRating.toFixed(1)} out of 5 ({quiz.ratingCount || 0} {quiz.ratingCount === 1 ? 'rating' : 'ratings'})
          </span>
        </div>
      )}
      <div className="mb-2 flex flex-wrap gap-2">
        {quiz.tags?.map((tag: string) => (
          <span
            key={tag}
            className="inline-block bg-accent text-white px-2 py-0.5 rounded text-xs"
          >
            {tag}
          </span>
        ))}
        {quiz.language && (
          <span className="inline-block bg-secondary text-primary px-2 py-0.5 rounded text-xs font-medium">
            {quiz.language}
          </span>
        )}
      </div>
      {/* Collapsible Questions */}
      <div className="my-6">
        <button
          className="px-4 py-2 bg-neutral rounded border border-secondary text-primary font-semibold hover:bg-secondary/50 transition"
          onClick={() => setQuestionsCollapsed(!questionsCollapsed)}
        >
          {questionsCollapsed ? "Show Questions (Spoilers!)" : "Hide Questions"}
        </button>
        {!questionsCollapsed && (
          <div className="mt-4 space-y-2">
            {questions.map((q, idx) => (
              <details key={q.id} open={false} className="border rounded p-2">
                <summary className="font-semibold">
                  Question {idx + 1}
                </summary>
                <div className="mt-2">{q.question}</div>
              </details>
            ))}
          </div>
        )}
      </div>
      {/* Start Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          className="px-6 py-2 bg-primary text-white rounded font-bold hover:bg-accent transition"
          onClick={onStartSinglePlayer}
        >
          Start Single Player
        </button>
        <button
          className="px-6 py-2 bg-secondary text-primary rounded font-bold hover:bg-accent transition"
          onClick={onStartMultiplayer}
        >
          Start Multiplayer
        </button>
      </div>
      <div className="mt-6">
        <button
          className="px-4 py-2 bg-neutral border border-secondary text-primary rounded hover:bg-secondary/50 transition"
          onClick={onBackToSearch}
        >
          Back to Search
        </button>
      </div>
    </div>
  );
}