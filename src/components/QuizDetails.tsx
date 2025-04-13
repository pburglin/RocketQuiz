import React from "react";
import ColorCardPlaceholder from "./ColorCardPlaceholder";

export default function QuizDetails({
  quiz,
  questions,
  questionsCollapsed,
  setQuestionsCollapsed,
  onStartSinglePlayer,
  onStartMultiplayer,
  onBackToSearch,
}: {
  quiz: any;
  questions: any[];
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
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
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
      <div className="mb-2 flex flex-wrap gap-2">
        {quiz.tags?.map((tag: string) => (
          <span
            key={tag}
            className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs"
          >
            {tag}
          </span>
        ))}
        {quiz.language && (
          <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
            {quiz.language}
          </span>
        )}
      </div>
      {/* Collapsible Questions */}
      <div className="my-6">
        <button
          className="px-4 py-2 bg-gray-100 rounded border text-gray-700 font-semibold"
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
          className="px-6 py-2 bg-emerald-600 text-white rounded font-bold"
          onClick={onStartSinglePlayer}
        >
          Start Single Player
        </button>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded font-bold"
          onClick={onStartMultiplayer}
        >
          Start Multiplayer
        </button>
      </div>
      <div className="mt-6">
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
          onClick={onBackToSearch}
        >
          Back to Search
        </button>
      </div>
    </div>
  );
}