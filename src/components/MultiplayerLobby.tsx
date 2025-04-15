import React from "react";
import QRCode from "react-qr-code";
import { useState, useEffect } from "react";
import { db } from "../firebaseClient";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { UserAvatar } from "./index";

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
  onStartGame,
}: any) {
  // State for "Copied" tooltip
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);
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
            <div className="flex items-center gap-2 relative">
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
                  setCopied(true);
                }}
              >
                Copy
              </button>
              {copied && (
                <span className="absolute right-0 top-[-1.5rem] bg-black text-white text-xs rounded px-2 py-1 z-10">
                  Copied
                </span>
              )}
            </div>
          </div>
          <div className="mb-4 flex flex-col items-center">
            <QRCode value={sessionUrl} size={128} />
            <div className="text-xs text-gray-500 mt-2">Scan to join</div>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1">
              {isOrganizer && !players.includes(nickname)
                ? "Enter your nickname to join as a player (optional):"
                : "Enter your nickname to join:"}
            </div>
            {isOrganizer && !players.includes(nickname) && (
              <div className="text-sm text-gray-600 mb-2">
                As the organizer, you can manage the game without playing. You can either join as a player or just start the game once players have joined.
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                className="px-2 py-1 border rounded w-full"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                disabled={players.includes(nickname)}
              />
              <button
                className={`px-4 py-1 rounded transition-colors ${
                  players.includes(nickname)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
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
                  if (sessionId && nickname.trim().length >= 2) {
                    try {
                      await setDoc(
                        doc(db, "sessions", sessionId, "players", nickname),
                        { joinedAt: serverTimestamp() },
                        { merge: true }
                      );
                      setPlayers((prev: string[]) => [...new Set([...prev, nickname])]); // Use Set to prevent duplicates
                      // Persist nickname and isOrganizer in localStorage for multiplayer game page
                      if (typeof window !== "undefined") {
                        localStorage.setItem("mp_nickname", nickname);
                        localStorage.setItem("mp_isOrganizer", isOrganizer ? "true" : "false");
                      }
                    } catch (err) {
                      setNicknameError("Failed to join lobby. Please try again.");
                    }
                  }
                }}
              >
                Join
              </button>
            </div>
            {nicknameError && (
              <div className="text-red-600 text-sm mt-1">{nicknameError}</div>
            )}
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Players in lobby:</div>
            <ul className="space-y-2">
              {players.map((p: string) => (
                <li key={p} className={`flex items-center justify-between ${p === nickname ? "font-bold text-emerald-700" : ""}`}>
                  <div className="flex items-center">
                    <UserAvatar username={p} size="md" />
                    <span className="ml-2">{p}</span>
                    {isOrganizer && p === nickname && <span className="ml-1">(You, Organizer)</span>}
                    {!isOrganizer && p === nickname && <span className="ml-1">(You)</span>}
                  </div>
                  {isOrganizer && p !== nickname && (
                    <button
                      className="px-2 py-0.5 bg-red-500 text-white rounded text-xs"
                      onClick={async () => {
                        // Firestore logic to remove player
                        if (sessionId && p) {
                          await deleteDoc(doc(db, "sessions", sessionId, "players", p));
                        }
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
              disabled={players.length < 1}
              onClick={onStartGame}
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