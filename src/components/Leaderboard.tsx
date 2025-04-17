import React, { useState } from "react"; // Remove useEffect if not needed
import StarRating from "./StarRating";

// Define interfaces for props
interface Quiz {
  id: string;
  title: string;
  averageRating?: number;
  ratingCount?: number;
  [key: string]: unknown;
}

interface LeaderboardProps {
  quiz: Quiz | null;
  isMultiplayer: boolean;
  mpLeaderboard: string[];
  mpScores: { [nickname: string]: number };
  nickname: string;
  spScore: number;
  onPlayAgain: () => void;
  onFindAnotherQuiz: () => void;
  onRateQuiz?: (rating: number) => void; // Make optional
  showMedals?: boolean; // Add missing prop
}


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
}: LeaderboardProps) { // Use the defined interface
  // Get the correct answers count from localStorage
  // Remove setCorrectAnswers as it's unused
  const [correctAnswers] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedCorrectAnswers = localStorage.getItem("sp_correctAnswers");
      return storedCorrectAnswers ? parseInt(storedCorrectAnswers, 10) : 0;
    }
    return 0;
  });
  const [userRating, setUserRating] = useState(0);
  console.log("[Leaderboard] Render", { quiz, isMultiplayer, mpLeaderboard, mpScores, nickname, spScore });

  return (
    <div className="max-w-2xl mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4 text-primary">Quiz Completed!</h1>
      <h2 className="text-xl font-semibold mb-6 text-accent">{quiz?.title}</h2>

      {isMultiplayer ? (
        <>
          <div className="font-bold mb-2 text-lg text-primary">Final Leaderboard</div>
          <ul className="list-decimal pl-6 text-left mb-8">
            {mpLeaderboard
              .map((nick: string) => {
                // mpScores already contains the total accumulated score for each player
                const totalScore = mpScores[nick] || 0;
                // Estimate the number of correct answers based on the total score
                // This is an approximation since we don't have the exact breakdown
                const estimatedCorrectAnswers = Math.floor(totalScore / 1000);
                const estimatedSpeedBonus = totalScore - (estimatedCorrectAnswers * 1000);
                return { nick, totalScore, correctAnswers: estimatedCorrectAnswers, totalSpeedBonus: estimatedSpeedBonus };
              })
              // Sort by top score (highest first)
              .sort((a: { totalScore: number }, b: { totalScore: number }) => {
                // For now, we're using totalScore as the sorting criteria
                // since we don't have individual question scores in the final leaderboard
                return b.totalScore - a.totalScore;
              })
              .map((item: { nick: string; totalScore: number; correctAnswers: number; totalSpeedBonus: number }, i: number) => (
                <li key={item.nick} className={item.nick === nickname ? "font-bold text-primary" : ""}>
                  {item.nick}: {item.totalScore} pts
                  <span className="text-sm text-gray-600 ml-1">
                    (approx. {item.correctAnswers} correct × 1000 + {item.totalSpeedBonus} total speed bonus)
                  </span>
                  {i === 0 && item.totalScore > 0 && <span className="ml-2 text-secondary font-bold">🏆</span>}
                  {item.nick === nickname && " (You)"}
                </li>
              ))}
          </ul>
        </>
      ) : (
        <div className="mb-8">
          <div className="font-bold mb-2 text-lg text-primary">Your Final Score</div>
          <div className="text-4xl text-accent font-bold">{spScore}</div>
          {spScore > 0 && (
            <div className="text-sm text-gray-600 mt-2">
              {correctAnswers} correct answers × 1000 + {spScore - (correctAnswers * 1000)} speed bonus
            </div>
          )}
        </div>
      )}

      <div className="mb-8">
        <div className="font-bold mb-2 text-lg text-primary">Rate this Quiz</div>
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
          className="px-6 py-2 bg-primary text-white rounded font-bold hover:bg-accent transition"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
        <button
          className="px-6 py-2 bg-secondary text-primary rounded font-bold hover:bg-accent transition"
          onClick={onFindAnotherQuiz}
        >
          Find Another Quiz
        </button>
      </div>
    </div>
  );
}