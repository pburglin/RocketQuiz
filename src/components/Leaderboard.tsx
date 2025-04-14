import React, { useState, useEffect } from "react";
import StarRating from "./StarRating";

export default function Leaderboard({
  quiz,
  isMultiplayer,
  mpLeaderboard,
  mpScores,
  nickname,
  spScore,
  onPlayAgain,
  onFindAnotherQuiz,
  onRateQuiz,
}: any) {
  // Get the correct answers count from localStorage
  const [correctAnswers, setCorrectAnswers] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedCorrectAnswers = localStorage.getItem("sp_correctAnswers");
      return storedCorrectAnswers ? parseInt(storedCorrectAnswers, 10) : 0;
    }
    return 0;
  });
  const [userRating, setUserRating] = useState(0);

  return (
    <div className="max-w-2xl mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Quiz Completed!</h1>
      <h2 className="text-xl font-semibold mb-6">{quiz?.title}</h2>

      {isMultiplayer ? (
        <>
          <div className="font-bold mb-2 text-lg">Final Leaderboard</div>
          <ul className="list-decimal pl-6 text-left mb-8">
            {mpLeaderboard
              .map((nick: string) => {
                // mpScores contains the total accumulated score for each player from all questions
                const totalScore = mpScores[nick] || 0;
                return { nick, totalScore };
              })
              // Sort by top score (highest first)
              .sort((a: { totalScore: number }, b: { totalScore: number }) => {
                // For now, we're using totalScore as the sorting criteria
                // since we don't have individual question scores in the final leaderboard
                return b.totalScore - a.totalScore;
              })
              .map((item: { nick: string; totalScore: number }, i: number) => (
                <li key={item.nick} className={item.nick === nickname ? "font-bold text-emerald-700" : ""}>
                  {item.nick}: {item.totalScore} pts
                  {i === 0 && item.totalScore > 0 && <span className="ml-2 text-yellow-600 font-bold">🏆</span>}
                  {item.nick === nickname && " (You)"}
                </li>
              ))}
          </ul>
        </>
      ) : (
        <div className="mb-8">
          <div className="font-bold mb-2 text-lg">Your Final Score</div>
          <div className="text-4xl text-blue-700 font-bold">{spScore}</div>
          {spScore > 0 && (
            <div className="text-sm text-gray-600 mt-2">
              {correctAnswers} correct answers × 1000 + {spScore - (correctAnswers * 1000)} speed bonus
            </div>
          )}
        </div>
      )}

      <div className="mb-8">
        <div className="font-bold mb-2 text-lg">Rate this Quiz</div>
        <div className="flex flex-col items-center">
          <StarRating
            rating={userRating}
            size="lg"
            interactive={true}
            onRatingChange={(rating) => {
              setUserRating(rating);
              if (onRateQuiz) {
                onRateQuiz(rating);
              }
            }}
            className="mb-2"
          />
          <div className="text-sm text-gray-500">
            {userRating > 0
              ? `You rated this quiz ${userRating} ${userRating === 1 ? 'star' : 'stars'}`
              : "Click to rate this quiz"}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          className="px-6 py-2 bg-emerald-600 text-white rounded font-bold"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
        <button
          className="px-6 py-2 bg-gray-600 text-white rounded font-bold"
          onClick={onFindAnotherQuiz}
        >
          Find Another Quiz
        </button>
      </div>
    </div>
  );
}