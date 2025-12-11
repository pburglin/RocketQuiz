import React, { useState, useEffect } from "react";
import ColorCardPlaceholder from "./ColorCardPlaceholder";
import SmartImage from "./SmartImage";
import { UserAvatar } from "./index";
import { Timestamp } from "firebase/firestore"; // Import Timestamp
import ConfirmModal from "./ConfirmModal";

// Define interfaces for props
interface Quiz {
  id: string;
  title: string;
  description?: string; // Make optional
  tags?: string[]; // Make optional
  image?: string; // Make optional
  popularity?: number;
  language?: string; // Make optional
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

interface AnswerData {
  nickname: string;
  qIdx: number;
  answer: number;
  answeredAt: Timestamp;
  isCorrect: boolean;
  questionStart?: Timestamp | null;
}

interface MultiplayerSessionProps {
  quiz: Quiz | null;
  questions: Question[];
  current: number;
  setCurrent: (c: number) => void;
  mpShowAnswer: boolean;
  setMpShowAnswer: (s: boolean) => void;
  mpTimer: number;
  setMpTimer: (t: number) => void;
  mpAnswered: boolean;
  setMpAnswered: (a: boolean) => void;
  mpAllAnswers: AnswerData[];
  setMpAllAnswers: (a: AnswerData[]) => void;
  mpScores: { [nickname: string]: number };
  setMpScores: (s: { [nickname: string]: number }) => void;
  mpLeaderboard: string[];
  setMpLeaderboard: (l: string[]) => void;
  mpSelected: number | null;
  setMpSelected: (s: number | null) => void;
  nextQuestionTimer: number | null;
  setNextQuestionTimer: (t: number | null) => void;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  players: string[];
  nickname: string;
  sessionId: string | null;
  submitMpAnswer: (idx: number) => Promise<void>;
  onQuit?: () => void; // Make optional if not always provided
  onFinish: () => Promise<void>;
  isOrganizer: boolean;
  triggerExplosion?: boolean;
  onExplosionComplete?: () => void;
  onTriggerExplosion?: () => void;
  // Add music volume props
  hostMusicVolume?: number;
  onMusicVolumeChange?: (volume: number) => void;
}

// Define the structure for shuffled answers
interface ShuffledAnswer {
  text: string;
  originalIndex: number;
}


export default function MultiplayerSession({
  // Destructure only the needed props, removing duplicates and unused ones
  quiz,
  questions,
  current,
  // setCurrent, // Unused
  mpShowAnswer,
  // setMpShowAnswer, // Unused
  mpTimer,
  // setMpTimer, // Unused
  mpAnswered,
  // setMpAnswered, // Unused
  mpAllAnswers,
  // setMpAllAnswers, // Unused
  // mpScores, // Unused
  // setMpScores, // Unused
  // mpLeaderboard, // Unused
  // setMpLeaderboard, // Unused
  mpSelected,
  // setMpSelected, // Unused
  nextQuestionTimer,
  // setNextQuestionTimer, // Unused
  // timerRef, // Unused
  players,
  nickname,
  // sessionId, // Unused
  submitMpAnswer,
  onQuit,
  onFinish,
  isOrganizer,
  triggerExplosion = false,
  onExplosionComplete,
  onTriggerExplosion,
  // Add music volume props
  hostMusicVolume = 0.7,
  onMusicVolumeChange,
}: MultiplayerSessionProps) { // Use the defined interface
  const q = questions.length > 0 ? questions[current] : null;
  const isLastQuestion = current === questions.length - 1;

  // State to hold the shuffled answers for the current question
  const [shuffledAnswers, setShuffledAnswers] = useState<ShuffledAnswer[]>([]);
  // State for quit confirmation modal
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Fisher-Yates (aka Knuth) Shuffle function
  const shuffleArray = (array: ShuffledAnswer[]) => { // Use specific type
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  // Effect to shuffle answers when the question changes
  useEffect(() => {
    if (q) {
      const answersWithOriginalIndex = q.answers.map((text, index) => ({ text, originalIndex: index }));
      setShuffledAnswers(shuffleArray(answersWithOriginalIndex));
    }
  }, [q]); // Dependency array includes q, so it runs when the question object changes

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-primary">Loading questions, get ready!</div>
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
      <SmartImage
        imageUrl={q.image}
        fallbackId={q.id}
        fallbackText={q.question ? q.question.charAt(0).toUpperCase() : "?"}
        alt={`Question ${current + 1}`}
        className="w-full h-40 object-cover rounded mb-2"
        aria-label={`Question ${current + 1} image`}
      />
      <div className="mb-1 font-bold">{q.question}</div>
      <div className="mb-2">
        <span className="inline-block bg-secondary text-primary px-3 py-1 rounded text-sm font-medium">
          Time left: {mpTimer} second{mpTimer !== 1 ? "s" : ""}
        </span>
      </div>
      {/* Music Volume Control for Host during game */}
      {isOrganizer && (
        <div className="mb-4 p-3 bg-base-100 rounded-lg border border-neutral">
          <div className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.414 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.414l3.969-3.816a1 1 0 011.617.816zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            Music Volume: {Math.round(hostMusicVolume * 100)}%
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={hostMusicVolume}
            onChange={(e) => onMusicVolumeChange && onMusicVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      )}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shuffledAnswers.map((answer: ShuffledAnswer, displayIndex: number) => (
          <button
            key={displayIndex} // Use displayIndex for React key, originalIndex for logic
            className={`w-full px-4 py-2 rounded border text-left transition
              ${
                mpShowAnswer
                  ? answer.originalIndex === q.correctAnswer
                    ? "bg-success/30 border-success font-bold" // Correct answer shown
                    : "bg-error/20 border-error" // Incorrect answer shown
                  : mpSelected === answer.originalIndex
                  ? "bg-secondary/50 border-secondary" // Selected answer
                  : "bg-base-100 border-neutral hover:bg-secondary/20" // Default answer
              }
            `}
            disabled={mpShowAnswer || mpAnswered || (isOrganizer && !players.includes(nickname))}
            onClick={() => {
              // Trigger explosion animation via callback
              if (onTriggerExplosion) {
                onTriggerExplosion();
              }
              submitMpAnswer(answer.originalIndex);
            }} // Pass original index
            style={{
              opacity: (mpAnswered && mpSelected !== answer.originalIndex) || (isOrganizer && !players.includes(nickname)) ? 0.5 : 1,
              pointerEvents: mpShowAnswer || (mpAnswered && mpSelected !== answer.originalIndex) || (isOrganizer && !players.includes(nickname)) ? "none" : "auto",
              borderWidth: mpSelected === answer.originalIndex || (mpShowAnswer && answer.originalIndex === q.correctAnswer) ? 3 : 1, // Thicker border for selected/correct
              // Use theme colors for border
              borderColor: mpShowAnswer ? (answer.originalIndex === q.correctAnswer ? 'var(--color-success)' : 'var(--color-error)') : (mpSelected === answer.originalIndex ? 'var(--color-secondary)' : 'var(--color-neutral)')
            }}
          >
            {answer.text} {/* Display the answer text */}
            {mpShowAnswer && answer.originalIndex === q.correctAnswer && (
              <span className="ml-2 text-success font-bold">(Correct)</span>
            )}
          </button>
        ))}
      </div>
      {!mpShowAnswer && (
        <div className="mb-4 text-center text-gray-600">
          {isOrganizer && !players.includes(nickname)
            ? "Waiting for players to answer or time to run out..."
            : "Waiting for all players to answer or time to run out..."}
          <div className="mt-2 flex flex-col items-center">
            <div className="font-semibold text-sm mb-1">Answered:</div>
            <ul className="text-xs">
              {mpAllAnswers.map((a: AnswerData, i: number) => ( // Use AnswerData type
                <li key={a.nickname} className="flex items-center mb-1">
                  <UserAvatar username={a.nickname} size="sm" />
                  <span className={`ml-1 ${a.nickname === nickname ? "font-bold text-primary" : ""}`}>
                    {i + 1}. {a.nickname}
                  </span>
                  {a.nickname === nickname && " (You)"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {mpShowAnswer && (
        <div className="mb-4 text-center text-success font-semibold">
          Correct answer shown!{" "}
          {isLastQuestion
            ? "Quiz complete."
            : isOrganizer
              ? "Click Next to continue."
              : "Waiting on the game organizer to continue."
          }
        </div>
      )}
      {isOrganizer && !players.includes(nickname) && (
        <div className="mb-4 text-center text-accent font-semibold">
          You are managing this game as the organizer (not playing).
        </div>
      )}
      {/* Leaderboard */}
      {mpShowAnswer && (
        <div className="mb-6">
          <div className="font-bold mb-2">Leaderboard (This Question)</div>
          <ul className="list-decimal pl-6">
            {players
              .map((nick: string) => {
                // Find this player's answer for the current question
                const ans = mpAllAnswers.find((a: AnswerData) => a.nickname === nick && a.qIdx === current); // Use AnswerData type
                let points = 0;
                let speedBonus = 0;
                if (ans && ans.answer === q.correctAnswer && typeof ans.answeredAt?.toMillis === "function" && q.time) {
                  // Calculate speed bonus
                  const answeredAt = ans.answeredAt.toMillis();
                  // Get the question start time from the answer object
                  if (ans.questionStart && typeof ans.questionStart.toMillis === "function") {
                    const questionStart = ans.questionStart.toMillis();
                    const timeTaken = Math.max(0, (answeredAt - questionStart) / 1000);
                    const maxTime = q.time || 30;
                    const speedFactor = Math.max(0, 1 - (timeTaken / maxTime));
                    // Exponential scoring to reward faster answers more significantly
                    speedBonus = Math.round(1000 * Math.pow(speedFactor, 1.5));
                    points = 1000 + speedBonus;
                  } else {
                    points = 1000; // fallback if no timing
                  }
                }
                return { nick, points, speedBonus };
              })
              // Sort players by their top score for this question
              .sort((a: { points: number }, b: { points: number }) => {
                // First sort by points for this question (highest first)
                return b.points - a.points;
              })
              .map((item: { nick: string; points: number; speedBonus: number }, i: number) => (
                <li key={item.nick} className={`flex items-center mb-1 ${item.nick === nickname ? "font-bold text-primary" : ""}`}>
                  <UserAvatar username={item.nick} size="sm" />
                  <span className="ml-2">
                    {item.nick}: {item.points} pts
                    {item.points > 0 && (
                      <span className="text-sm text-gray-600 ml-1">
                        ({item.speedBonus > 0 ? `1000 + ${item.speedBonus} speed bonus` : "1000 pts"})
                      </span>
                    )}
                    {i === 0 && item.points > 0 && <span className="ml-1 text-secondary font-bold">🏆</span>}
                    {item.nick === nickname && " (You)"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
      <div className="flex justify-between">
        <button
          className="px-4 py-2 bg-neutral border border-secondary text-primary rounded hover:bg-secondary/50 transition"
          disabled={!isOrganizer}
          onClick={() => setShowQuitModal(true)}
        >
          Quit
        </button>
        {mpShowAnswer && !isLastQuestion && (
          <button
            className={`px-4 py-2 rounded font-bold transition-colors ${
              isOrganizer && mpShowAnswer
                ? "bg-secondary text-primary hover:bg-accent"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isOrganizer || !mpShowAnswer}
            onClick={isOrganizer && mpShowAnswer ? onFinish : undefined}
          >
            {isOrganizer && mpShowAnswer
              ? nextQuestionTimer && nextQuestionTimer > 0
                ? `Next (${nextQuestionTimer})`
                : "Next Question"
              : "Next"}
          </button>
        )}
        {mpShowAnswer && isLastQuestion && (
          <button
            className={`px-4 py-2 rounded font-bold transition-colors ${
              isOrganizer && mpShowAnswer
                ? "bg-secondary text-primary hover:bg-accent"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isOrganizer || !mpShowAnswer}
            onClick={isOrganizer && mpShowAnswer ? onFinish : undefined}
          >
            {isOrganizer && mpShowAnswer
              ? nextQuestionTimer && nextQuestionTimer > 0
                ? `Finish (${nextQuestionTimer})`
                : "Finish Quiz"
              : "Finish"}
          </button>
        )}
      </div>
      
      {/* Quit Confirmation Modal */}
      <ConfirmModal
        isOpen={showQuitModal}
        onClose={() => setShowQuitModal(false)}
        onConfirm={() => {
          if (onQuit) {
            onQuit();
          }
        }}
        title="Quit Multiplayer Quiz"
        message="Are you sure you want to quit this multiplayer quiz? This will end the game for all players and take you back to the quiz details page."
        confirmText="Quit Quiz"
        cancelText="Continue Playing"
        variant="danger"
      />
    </div>
  );
}