import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Leaderboard from "../components/Leaderboard";
import { db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";

export default function ResultsPage() {
  // Multiplayer: fetch leaderboard and scores from Firestore session doc
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session")) setSessionId(params.get("session"));
    else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mp_sessionId");
      if (stored) setSessionId(stored);
    }
  }, []);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState<any>(null);
  const [mpLeaderboard, setMpLeaderboard] = useState<string[]>([]);
  const [mpScores, setMpScores] = useState<{ [nickname: string]: number }>({});
  const [spScore, setSpScore] = useState<number>(0);
  const [nickname, setNickname] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mp_nickname") || "";
    }
    return "";
  });
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  // Multiplayer: fetch leaderboard and scores from Firestore if not in location.state
  useEffect(() => {
    async function fetchMultiplayerResults() {
      if (!sessionId) return;
      const sessionRef = doc(db, "sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        if (data.mpScores && data.mpLeaderboard) {
          setMpScores(data.mpScores);
          setMpLeaderboard(data.mpLeaderboard);
          setIsMultiplayer(true);
        }
      }
    }
    fetchMultiplayerResults();
  }, [sessionId]);

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


  return (
    <Leaderboard
      quiz={quiz}
      isMultiplayer={isMultiplayer}
      mpLeaderboard={mpLeaderboard}
      mpScores={mpScores}
      nickname={nickname}
      spScore={spScore}
      onPlayAgain={() => navigate(`/play/quiz/${id}/details`)}
      onFindAnotherQuiz={() => navigate("/search")}
      showMedals={true}
    />
  );
}