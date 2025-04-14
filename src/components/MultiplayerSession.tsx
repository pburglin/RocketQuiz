import React from "react";
import ColorCardPlaceholder from "./ColorCardPlaceholder";
import { UserAvatar } from "./index";

export default function MultiplayerSession({
  quiz,
  questions,
  current,
  setCurrent,
  mpShowAnswer,
  setMpShowAnswer,
  mpTimer,
  setMpTimer,
  mpAnswered,
  setMpAnswered,
  mpAllAnswers,
  setMpAllAnswers,
  mpScores,
  setMpScores,
  mpLeaderboard,
  setMpLeaderboard,
  mpSelected,
  setMpSelected,
  nextQuestionTimer,
  setNextQuestionTimer,
  timerRef,
  players,
  nickname,
  sessionId,
  submitMpAnswer,
  onQuit,
  onFinish,
  isOrganizer,
}: any) {
  const q = questions.length > 0 ? questions[current] : null;
  const isLastQuestion = current === questions.length - 1;

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">Loading questions, get ready!</div>
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
        <span className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
          Time left: {mpTimer} second{mpTimer !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.answers.map((answer: string, idx: number) => (
          <button
            key={idx}
            className={`w-full px-4 py-2 rounded border text-left transition
              ${
                mpShowAnswer
                  ? idx === q.correctAnswer
                    ? "bg-green-200 border-green-400 font-bold"
                    : "bg-red-100 border-gray-200"
                  : mpSelected === idx
                  ? "bg-emerald-100 border-emerald-400"
                  : "bg-white border-gray-200 hover:bg-emerald-50"
              }
            `}
            disabled={mpShowAnswer || mpAnswered || (isOrganizer && !players.includes(nickname))}
            onClick={() => submitMpAnswer(idx)}
            style={{
              opacity: (mpAnswered && mpSelected !== idx) || (isOrganizer && !players.includes(nickname)) ? 0.5 : 1,
              pointerEvents: mpShowAnswer || (mpAnswered && mpSelected !== idx) || (isOrganizer && !players.includes(nickname)) ? "none" : "auto",
              borderWidth: mpSelected === idx ? 3 : undefined,
              borderColor: mpSelected === idx ? "#059669" : undefined, // emerald-600
            }}
          >
            {answer}
            {mpShowAnswer && idx === q.correctAnswer && (
              <span className="ml-2 text-green-700 font-bold">(Correct)</span>
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
              {mpAllAnswers.map((a: any, i: number) => (
                <li key={a.nickname} className="flex items-center mb-1">
                  <UserAvatar username={a.nickname} size="sm" />
                  <span className={`ml-1 ${a.nickname === nickname ? "font-bold text-emerald-700" : ""}`}>
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
        <div className="mb-4 text-center text-green-700 font-semibold">
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
        <div className="mb-4 text-center text-blue-700 font-semibold">
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
                const ans = mpAllAnswers.find((a: any) => a.nickname === nick && a.qIdx === current);
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
                <li key={item.nick} className={`flex items-center mb-1 ${item.nick === nickname ? "font-bold text-emerald-700" : ""}`}>
                  <UserAvatar username={item.nick} size="sm" />
                  <span className="ml-2">
                    {item.nick}: {item.points} pts
                    {item.points > 0 && (
                      <span className="text-sm text-gray-600 ml-1">
                        ({item.speedBonus > 0 ? `1000 + ${item.speedBonus} speed bonus` : "1000 pts"})
                      </span>
                    )}
                    {i === 0 && item.points > 0 && <span className="ml-1 text-yellow-600 font-bold">🏆</span>}
                    {item.nick === nickname && " (You)"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
      <div className="flex justify-between">
        <button
          className={`px-4 py-2 rounded font-bold transition-colors ${
            isOrganizer
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isOrganizer || nextQuestionTimer === null || nextQuestionTimer > 0}
          onClick={onQuit}
        >
          Quit
        </button>
        {mpShowAnswer && !isLastQuestion && (
          <button
            className={`px-4 py-2 rounded font-bold transition-colors ${
              isOrganizer && mpShowAnswer
                ? "bg-blue-600 text-white hover:bg-blue-700"
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
                ? "bg-blue-600 text-white hover:bg-blue-700"
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
    </div>
  );
}