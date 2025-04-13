import React from "react";
import ColorCardPlaceholder from "./ColorCardPlaceholder";

export default function SinglePlayerSession({
  quiz,
  questions,
  current,
  setCurrent,
  timer,
  setTimer,
  showAnswer,
  setShowAnswer,
  spScore,
  setSpScore,
  spSelected,
  setSpSelected,
  nextQuestionTimer,
  setNextQuestionTimer,
  timerRef,
  onQuit,
  onFinish,
}: {
  quiz: any;
  questions: any[];
  current: number;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  timer: number;
  setTimer: React.Dispatch<React.SetStateAction<number>>;
  showAnswer: boolean;
  setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>;
  spScore: number;
  setSpScore: React.Dispatch<React.SetStateAction<number>>;
  spSelected: number | null;
  setSpSelected: React.Dispatch<React.SetStateAction<number | null>>;
  nextQuestionTimer: number | null;
  setNextQuestionTimer: React.Dispatch<React.SetStateAction<number | null>>;
  timerRef: React.MutableRefObject<any>;
  onQuit: () => void;
  onFinish: () => void;
}) {
  console.log("[SinglePlayerSession] Render, current:", current, "showAnswer:", showAnswer);

  const q = questions.length > 0 ? questions[current] : null;

  // Single player: handle answer click
  const handleSinglePlayerAnswer = (idx: number) => {
    if (showAnswer || !q) return;
    setSpSelected(idx);
    setShowAnswer(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setNextQuestionTimer(10); // Start 10s countdown
    // Scoring
    if (q && idx === q.correctAnswer) {
      const base = 1000; // Match multiplayer base score
      // Calculate speed bonus based on remaining time
      const timeElapsed = q.time - timer;
      const maxTime = q.time || 30;
      const speedFactor = Math.max(0, 1 - (timeElapsed / maxTime));
      // Exponential scoring to reward faster answers more significantly
      const speedBonus = Math.round(1000 * Math.pow(speedFactor, 1.5));
      setSpScore((prev) => prev + base + speedBonus);
    }
  };

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">No question data available.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{quiz?.title}</h1>
      <div className="mb-2 flex flex-wrap gap-2">
        {quiz?.tags?.map((tag: string) => (
          <span
            key={tag}
            className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs"
          >
            {tag}
          </span>
        ))}
        {quiz?.language && (
          <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
            {quiz.language}
          </span>
        )}
      </div>
      <div className="mt-6 mb-2 text-lg font-semibold">
        Question {current + 1} of {questions.length}
      </div>
      <div className="mb-2 font-bold">{q.question}</div>
      {q.image && q.image.trim() !== "" ? (
        <img
          src={q.image}
          alt={`Question ${current + 1}`}
          className="w-full h-40 object-cover rounded mb-4"
        />
      ) : (
        <ColorCardPlaceholder
          id={q.id}
          text={q.question ? q.question.charAt(0).toUpperCase() : "?"}
          className="w-full h-40 rounded mb-4"
        />
      )}
      <div className="mb-4">
        <span className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
          Time left: {timer} second{timer !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.answers.map((answer: string, idx: number) => (
          <button
            key={idx}
            className={`w-full px-4 py-2 rounded border text-left transition
              ${
                showAnswer
                  ? idx === q.correctAnswer
                    ? "bg-green-200 border-green-400 font-bold"
                    : idx === spSelected
                    ? "bg-red-100 border-gray-200"
                    : "bg-white border-gray-200"
                  : "bg-white border-gray-200 hover:bg-emerald-50"
              }
            `}
            disabled={showAnswer}
            onClick={() => handleSinglePlayerAnswer(idx)}
          >
            {answer}
            {showAnswer && idx === q.correctAnswer && (
              <span className="ml-2 text-green-700 font-bold">(Correct)</span>
            )}
            {showAnswer && idx === spSelected && idx !== q.correctAnswer && (
              <span className="ml-2 text-red-700 font-bold">(Your pick)</span>
            )}
          </button>
        ))}
      </div>
      {!showAnswer && (
        <div className="mb-4 text-center text-gray-600">
          Waiting {timer} second{timer !== 1 ? "s" : ""} before showing the correct answer...
        </div>
      )}
      {showAnswer && (
        <div className="mb-4 text-center text-green-700 font-semibold">
          Correct answer shown!{" "}
          {current < questions.length - 1 ? "Click Next to continue." : "Quiz complete."}
        </div>
      )}
      {/* Show score after each question */}
      <div className="mb-4 text-center text-blue-700 font-bold">
        <div className="text-2xl">Score: {spScore}</div>
        {showAnswer && spSelected === q.correctAnswer && (
          <div className="text-sm text-gray-600">
            (Last answer: 1000 base + {Math.round(spScore % 1000)} speed bonus)
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
          onClick={onQuit}
        >
          Quit
        </button>
        {showAnswer && current < questions.length - 1 && (
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded"
            onClick={() => {
              setCurrent(current + 1);
              setShowAnswer(false);
              setSpSelected(null);
            }}
          >
            Next {nextQuestionTimer !== null ? `(${nextQuestionTimer}s)` : ""}
          </button>
        )}
        {showAnswer && current === questions.length - 1 && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              console.log("[SinglePlayerSession] onFinish (last question)");
              onFinish();
            }}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}