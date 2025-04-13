import React from "react";
import QRCode from "react-qr-code";

export default function MultiplayerLobby({
  quiz,
  sessionId,
  sessionUrl,
  nickname,
  setNickname,
  nicknameError,
  setNicknameError,
  players,
  isOrganizer,
  lobbyLoading,
  setLobbyLoading,
  setSessionId,
  setSessionUrl,
  setPlayers,
  setIsOrganizer,
  setGameState,
  onBackToQuizDetails,
}: any) {
  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">Quiz not found.</div>
        <button
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded"
          onClick={onBackToQuizDetails}
        >
          Back to Quiz Details
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
      <div className="mb-4 text-gray-600">Multiplayer Lobby</div>
      {lobbyLoading ? (
        <div className="text-lg text-gray-700">Setting up session...</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="font-semibold">Session URL:</div>
            <div className="flex items-center gap-2">
              <input
                className="w-full px-2 py-1 border rounded"
                value={sessionUrl}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => {
                  navigator.clipboard.writeText(sessionUrl);
                }}
              >
                Copy
              </button>
            </div>
          </div>
          <div className="mb-4 flex flex-col items-center">
            <QRCode value={sessionUrl} size={128} />
            <div className="text-xs text-gray-500 mt-2">Scan to join</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Enter your nickname to join:</div>
            <input
              className="px-2 py-1 border rounded w-full"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              disabled={players.includes(nickname)}
            />
            <button
              className="mt-2 px-4 py-1 bg-emerald-600 text-white rounded"
              disabled={
                !nickname ||
                players.includes(nickname) ||
                nickname.trim().length < 2
              }
              onClick={async () => {
                if (!nickname || players.includes(nickname)) {
                  setNicknameError("Nickname must be unique and at least 2 characters.");
                  return;
                }
                setNicknameError(null);
                // Firestore logic to add player
                // (This logic should be in PlayQuiz, but for demo, we call setPlayers here)
                setPlayers((prev: string[]) => [...prev, nickname]);
              }}
            >
              Join
            </button>
            {nicknameError && (
              <div className="text-red-600 text-sm mt-1">{nicknameError}</div>
            )}
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Players in lobby:</div>
            <ul className="list-disc pl-6">
              {players.map((p: string) => (
                <li key={p} className={p === nickname ? "font-bold text-emerald-700 flex items-center" : "flex items-center"}>
                  <span>{p}</span>
                  {isOrganizer && p === nickname && <span> (You, Organizer)</span>}
                  {!isOrganizer && p === nickname && <span> (You)</span>}
                  {isOrganizer && p !== nickname && (
                    <button
                      className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded text-xs"
                      onClick={async () => {
                        // Firestore logic to remove player
                        setPlayers((prev: string[]) => prev.filter((x) => x !== p));
                      }}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {isOrganizer && (
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded font-bold"
              disabled={players.length < 2}
              onClick={() => setGameState("multi-playing")}
            >
              Start Game
            </button>
          )}
          <div className="mt-6">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
              onClick={onBackToQuizDetails}
            >
              Back to Quiz Details
            </button>
          </div>
        </>
      )}
    </div>
  );
}