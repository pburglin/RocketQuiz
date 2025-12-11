import React from "react";
import QRCode from "react-qr-code";
import { useState, useEffect } from "react";
import { db } from "../firebaseClient";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { UserAvatar } from "./index";

// Define interfaces for props
interface Quiz {
  id: string;
  title: string;
  [key: string]: unknown;
}

interface MultiplayerLobbyProps {
  quiz: Quiz | null;
  sessionId: string | null;
  sessionUrl: string;
  nickname: string;
  setNickname: (n: string) => void;
  nicknameError: string | null;
  setNicknameError: (e: string | null) => void;
  players: string[];
  isOrganizer: boolean;
  lobbyLoading: boolean;
  setLobbyLoading: (l: boolean) => void;
  setSessionId: (s: string | null) => void;
  setSessionUrl: (u: string) => void;
  setPlayers: (p: string[] | ((prev: string[]) => string[])) => void;
  setIsOrganizer: (o: boolean) => void;
  setGameState: (g: unknown) => void; // Use unknown instead of any
  onBackToQuizDetails: () => void;
  onStartGame: () => void;
  // Add music volume props
  hostMusicVolume: number;
  onMusicVolumeChange: (volume: number) => void;
}


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
  // Remove unused props: setLobbyLoading, setSessionId, setSessionUrl, setIsOrganizer, setGameState
  setPlayers,
  onBackToQuizDetails,
  onStartGame,
  // Add music volume props
  hostMusicVolume,
  onMusicVolumeChange,
}: MultiplayerLobbyProps) { // Use the defined interface
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
        <div className="text-lg text-primary">Quiz not found.</div>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-accent transition"
          onClick={onBackToQuizDetails}
        >
          Back to Quiz Details
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-primary">{quiz.title}</h1>
      <div className="mb-4 text-gray-600">Multiplayer Lobby</div>
      {lobbyLoading ? (
        <div className="text-lg text-primary">Setting up session...</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="font-semibold">Session URL:</div>
            <div className="flex items-center gap-2 relative">
              <input
                className="w-full px-2 py-1 border border-neutral rounded bg-base-100"
                value={sessionUrl}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <button
                className="px-2 py-1 bg-neutral border border-secondary text-primary rounded hover:bg-secondary/50 transition"
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
                className="px-2 py-1 border border-neutral rounded w-full bg-base-100"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                disabled={players.includes(nickname)}
              />
              <button
                className={`px-4 py-1 rounded transition-colors ${
                  players.includes(nickname)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-accent"
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
                      setPlayers((prev: string[]) => [...prev, nickname]);
                      // Persist nickname and isOrganizer in localStorage for multiplayer game page
                      if (typeof window !== "undefined") {
                        localStorage.setItem("mp_nickname", nickname);
                        localStorage.setItem("mp_isOrganizer", isOrganizer ? "true" : "false");
                      }
                    } catch { // Remove unused 'err' variable
                      setNicknameError("Failed to join lobby. Please try again.");
                    }
                  }
                }}
              >
                Join
              </button>
            </div>
            {nicknameError && (
              <div className="text-error text-sm mt-1">{nicknameError}</div>
            )}
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1">Players in lobby:</div>
            <ul className="space-y-2">
              {players.map((p: string) => (
                <li key={p} className={`flex items-center justify-between ${p === nickname ? "font-bold text-primary" : ""}`}>
                  <div className="flex items-center">
                    <UserAvatar username={p} size="md" />
                    <span className="ml-2">{p}</span>
                    {isOrganizer && p === nickname && <span className="ml-1">(You, Organizer)</span>}
                    {!isOrganizer && p === nickname && <span className="ml-1">(You)</span>}
                  </div>
                  {isOrganizer && p !== nickname && (
                    <button
                      className="px-2 py-0.5 bg-error text-white rounded text-xs hover:bg-red-700 transition"
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
          {/* Music Volume Control for Host */}
          {isOrganizer && (
            <div className="mb-4 p-4 bg-base-100 rounded-lg border border-neutral">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.414 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.414l3.969-3.816a1 1 0 011.617.816zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                Music Volume Control (Host Only)
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Adjust the music volume for all players in this quiz session.
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={hostMusicVolume}
                  onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Off</span>
                  <span className="font-semibold text-primary">{Math.round(hostMusicVolume * 100)}%</span>
                  <span>Max</span>
                </div>
              </div>
            </div>
          )}
          {isOrganizer && (
            <button
              className="px-6 py-2 bg-secondary text-primary rounded font-bold hover:bg-accent disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition"
              disabled={players.length < 1}
              onClick={onStartGame}
            >
              Start Game
            </button>
          )}
          <div className="mt-6">
            <button
              className="px-4 py-2 bg-neutral border border-secondary text-primary rounded hover:bg-secondary/50 transition"
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