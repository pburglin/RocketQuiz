import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MultiplayerLobby from "../components/MultiplayerLobby";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export default function MultiplayerLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  const [lobbyLoading, setLobbyLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchQuiz() {
      if (!id) return;
      const quizDoc = await getDoc(doc(db, "quizzes", id));
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      }
    }
    fetchQuiz();
  }, [id]);

  // Session logic: create or join session
  useEffect(() => {
    if (!id) return;
    // Check for session param in URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (sid) {
      setSessionId(sid);
      setSessionUrl(`${window.location.origin}/play/quiz/${id}/multiplayer/lobby?session=${sid}`);
      setIsOrganizer(false);
    } else {
      // Organizer: create session
      const newSessionId = Math.random().toString(36).substring(2, 10);
      setLobbyLoading(true);
      const sessionRef = doc(db, "sessions", newSessionId);
      setDoc(sessionRef, {
        quizId: id,
        createdAt: serverTimestamp(),
        started: false,
      }).then(() => {
        setSessionId(newSessionId);
        setSessionUrl(`${window.location.origin}/play/quiz/${id}/multiplayer/lobby?session=${newSessionId}`);
        setIsOrganizer(true);
        setLobbyLoading(false);
      });
    }
  }, [id]);

  // Listen for players
  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(collection(db, "sessions", sessionId, "players"), (snap) => {
      setPlayers(snap.docs.map((doc) => doc.id));
    });
    return () => unsub();
  }, [sessionId]);


  // Start game: set started flag and redirect
  const handleStartGame = async () => {
    if (!sessionId) return;
    const sessionRef = doc(db, "sessions", sessionId);
    await setDoc(sessionRef, { started: true }, { merge: true });
    navigate(`/play/quiz/${id}/multiplayer/game?session=${sessionId}`);
  };

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">Loading quiz...</div>
      </div>
    );
  }

  return (
    <MultiplayerLobby
      quiz={quiz}
      sessionId={sessionId}
      sessionUrl={sessionUrl}
      nickname={nickname}
      setNickname={setNickname}
      nicknameError={nicknameError}
      setNicknameError={setNicknameError}
      players={players}
      isOrganizer={isOrganizer}
      lobbyLoading={lobbyLoading}
      setLobbyLoading={setLobbyLoading}
      setSessionId={setSessionId}
      setSessionUrl={setSessionUrl}
      setPlayers={setPlayers}
      setIsOrganizer={setIsOrganizer}
      setGameState={() => {}}
      onBackToQuizDetails={() => navigate(`/play/quiz/${id}/details`)}
      // Add start game handler for organizer
      onStartGame={handleStartGame}
    />
  );
}