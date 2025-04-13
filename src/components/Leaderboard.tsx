import React from "react";

export default function Leaderboard({
  quiz,
  isMultiplayer,
  mpLeaderboard,
  mpScores,
  nickname,
  spScore,
  onPlayAgain,
  onFindAnotherQuiz,
}: any) {
  console.log("[Leaderboard] Render", { quiz, isMultiplayer, mpLeaderboard, mpScores, nickname, spScore });

  return (
    <div className="max-w-2xl mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Quiz Complete!</h1>
      <h2 className="text-xl font-semibold mb-6">{quiz?.title}</h2>

      {isMultiplayer ? (
        <>
          <div className="font-bold mb-2 text-lg">Final Leaderboard</div>
          <ul className="list-decimal pl-6 text-left mb-8">
            {mpLeaderboard.map((nick: string, i: number) => (
              <li key={nick} className={nick === nickname ? "font-bold text-emerald-700" : ""}>
                {nick}: {mpScores[nick] || 0} pts
                {i === 0 && <span className="ml-2 text-yellow-600 font-bold">🏆</span>}
                {nick === nickname && " (You)"}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mb-8">
          <div className="font-bold mb-2 text-lg">Your Final Score</div>
          <div className="text-4xl text-blue-700 font-bold">{spScore}</div>
        </div>
      )}

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