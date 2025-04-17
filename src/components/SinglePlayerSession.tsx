import React from "react";
import ColorCardPlaceholder from "./ColorCardPlaceholder";

// Define interfaces for props
interface Quiz {
  id: string;
  title: string;
  tags?: string[];
  language?: string;
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

interface SinglePlayerSessionProps {
  quiz: Quiz | null;
  questions: Question[];
  current: number;
  setCurrent: React.Dispatch<React.SetStateAction<number>>;
  timer: number;
  // setTimer: React.Dispatch<React.SetStateAction<number>>; // Remove unused prop
  showAnswer: boolean;
  setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>;
  spScore: number;
  setSpScore: React.Dispatch<React.SetStateAction<number>>;
  spCorrectAnswers: number;
  setSpCorrectAnswers: React.Dispatch<React.SetStateAction<number>>;
  spCurrentSpeedBonus: number;
  setSpCurrentSpeedBonus: React.Dispatch<React.SetStateAction<number>>;
  spSelected: number | null;
  setSpSelected: React.Dispatch<React.SetStateAction<number | null>>;
  nextQuestionTimer: number | null;
  setNextQuestionTimer: React.Dispatch<React.SetStateAction<number | null>>;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>; // Correct type
  onQuit: () => void;
  onFinish: () => void;
}


export default function SinglePlayerSession({
  quiz,
  questions,
  current,
  setCurrent,
  timer,
  //setTimer, // Remove unused prop
  showAnswer,
  setShowAnswer,
  spScore,
  setSpScore,
  spCorrectAnswers,
  setSpCorrectAnswers,
  spCurrentSpeedBonus,
  setSpCurrentSpeedBonus,
  spSelected,
  setSpSelected,
  nextQuestionTimer,
  setNextQuestionTimer,
  timerRef,
  onQuit,
  onFinish,
}: SinglePlayerSessionProps) { // Use the defined interface

  // Reset correctAnswers when starting a new game (when current is 0 and not showing answer)
  React.useEffect(() => {
    if (current === 0 && !showAnswer) {
      // Reset the correct answers count at the start of a new game
      setSpCorrectAnswers(0);
      if (typeof window !== "undefined") {
        localStorage.setItem("sp_correctAnswers", "0");
      }
    }
  }, [current, showAnswer, setSpCorrectAnswers]);

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
      setSpCurrentSpeedBonus(speedBonus); // Store the current speed bonus
      setSpScore((prev) => prev + base + speedBonus);
      setSpCorrectAnswers((prev) => prev + 1); // Increment correct answers count
      
      // Store correct answers count in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("sp_correctAnswers", String(spCorrectAnswers + 1));
      }
    } else {
      setSpCurrentSpeedBonus(0); // No speed bonus for incorrect answers
    }
  };

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-primary">No question data available.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-primary">{quiz?.title}</h1>
      <div className="mb-2 flex flex-wrap gap-2">
        {quiz?.tags?.map((tag: string) => (
          <span
            key={tag}
            className="inline-block bg-accent text-white px-2 py-0.5 rounded text-xs"
          >
            {tag}
          </span>
        ))}
        {quiz?.language && (
          <span className="inline-block bg-secondary text-primary px-2 py-0.5 rounded text-xs font-medium">
            {quiz.language}
          </span>
        )}
      </div>
      <div className="mt-6 mb-2 text-lg font-semibold text-primary">
        Question {current + 1} of {questions.length}
      </div>
      {q.image && q.image.trim() !== "" ? (
        <img
          src={q.image}
          alt={`Question ${current + 1}`}
          className="w-full h-40 object-cover rounded mb-2"
        />
      ) : (
        <ColorCardPlaceholder
          id={q.id}
          text={q.question ? q.question.charAt(0).toUpperCase() : "?"}
          className="w-full h-40 rounded mb-2"
        />
      )}
      <div className="mb-1 font-bold">{q.question}</div>
      <div className="mb-2">
        <span className="inline-block bg-secondary text-primary px-3 py-1 rounded text-sm font-medium">
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
                    ? "bg-success/30 border-success font-bold" // Correct answer shown
                    : idx === spSelected
                    ? "bg-error/20 border-error" // Incorrect selected answer shown
                    : "bg-base-100 border-neutral opacity-60" // Other incorrect answers shown
                  : "bg-base-100 border-neutral hover:bg-secondary/20" // Default answer
              }
            `}
            disabled={showAnswer}
            onClick={() => handleSinglePlayerAnswer(idx)}
          >
            {answer}
            {showAnswer && idx === q.correctAnswer && (
              <span className="ml-2 text-success font-bold">(Correct)</span>
            )}
            {showAnswer && idx === spSelected && idx !== q.correctAnswer && (
              <span className="ml-2 text-error font-bold">(Your pick)</span>
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
        <div className="mb-4 text-center text-success font-semibold">
          Correct answer shown!{" "}
          {current < questions.length - 1 ? "Click Next to continue." : "Quiz complete."}
        </div>
      )}
      {/* Show score after each question */}
      <div className="mb-4 text-center text-accent font-bold">
        <div className="text-2xl">Score: {spScore}</div>
        {showAnswer && spSelected === q.correctAnswer && (
          <div className="text-sm text-gray-600">
            (Last answer: 1000 base + {spCurrentSpeedBonus} speed bonus)
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <button
          className="px-4 py-2 bg-neutral border border-secondary text-primary rounded hover:bg-secondary/50 transition"
          onClick={onQuit}
        >
          Quit
        </button>
        {showAnswer && current < questions.length - 1 && (
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-accent transition"
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
            className="px-4 py-2 bg-accent text-white rounded hover:bg-blue-700 transition"
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