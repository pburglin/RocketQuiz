import React, { useState } from "react";
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
  const [userRating, setUserRating] = useState(0);
  console.log("[Leaderboard] Render", { quiz, isMultiplayer, mpLeaderboard, mpScores, nickname, spScore });

  return (
    <div className="max-w-2xl mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Quiz Complete!</h1>
      <h2 className="text-xl font-semibold mb-6">{quiz?.title}</h2>

      {isMultiplayer ? (
        <>
          <div className="font-bold mb-2 text-lg">Final Leaderboard</div>
          <ul className="list-decimal pl-6 text-left mb-8">
            {mpLeaderboard.map((nick: string, i: number) => {
              const totalScore = mpScores[nick] || 0;
              const baseScore = 1000 * Math.floor(totalScore / 1000); // Estimate base score (1000 per correct answer)
              const speedBonus = totalScore - baseScore; // Estimate speed bonus
              
              return (
                <li key={nick} className={nick === nickname ? "font-bold text-emerald-700" : ""}>
                  {nick}: {totalScore} pts 
                  {totalScore > 0 && (
                    <span className="text-sm text-gray-600 ml-1">
                      ({Math.floor(totalScore / 1000)} correct × 1000 + {speedBonus} speed bonus)
                    </span>
                  )}
                  {i === 0 && <span className="ml-2 text-yellow-600 font-bold">🏆</span>}
                  {nick === nickname && " (You)"}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="mb-8">
          <div className="font-bold mb-2 text-lg">Your Final Score</div>
          <div className="text-4xl text-blue-700 font-bold">{spScore}</div>
          {spScore > 0 && (
            <div className="text-sm text-gray-600 mt-2">
              {Math.floor(spScore / 1000)} correct answers × 1000 + {spScore % 1000} speed bonus
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