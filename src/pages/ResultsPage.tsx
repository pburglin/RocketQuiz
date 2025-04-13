import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Leaderboard from "../components/Leaderboard";
import { db } from "../firebaseClient";
import { doc, getDoc } from "firebase/firestore";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState<any>(null);
  const [mpLeaderboard, setMpLeaderboard] = useState<string[]>([]);
  const [mpScores, setMpScores] = useState<{ [nickname: string]: number }>({});
  const [spScore, setSpScore] = useState<number>(0);
  const [nickname, setNickname] = useState<string>("");
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  // Multiplayer: fetch leaderboard and scores from Firestore if not in location.state
  useEffect(() => {
    async function fetchMultiplayerResults() {
      // Try to get sessionId from URL or localStorage
      let sessionId = null;
      const params = new URLSearchParams(window.location.search);
      if (params.get("session")) sessionId = params.get("session");
      if (!sessionId && typeof window !== "undefined") {
        sessionId = localStorage.getItem("mp_sessionId");
      }
      if (!sessionId) return;
      // Fetch all answers
      const answersSnap = await getDoc(doc(db, "sessions", sessionId));
      let leaderboard: string[] = [];
      let scores: { [nickname: string]: number } = {};
      if (answersSnap.exists()) {
        scores = answersSnap.data().mpScores || {};
        leaderboard = Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .map(([nick]) => nick);
        setMpScores(scores);
        setMpLeaderboard(leaderboard);
        setIsMultiplayer(true);
      }
    }
    if (!location.state || !location.state.mpLeaderboard) {
      fetchMultiplayerResults();
    }
  }, [location.state]);

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

  // Multiplayer: fetch all answers, recalculate scores and leaderboard
  useEffect(() => {
    async function fetchMultiplayerResults() {
      let sessionId = null;
      const params = new URLSearchParams(window.location.search);
      if (params.get("session")) sessionId = params.get("session");
      if (!sessionId && typeof window !== "undefined") {
        sessionId = localStorage.getItem("mp_sessionId");
      }
      if (!sessionId) return;
      // Fetch all answers
      const answersSnap = await getDoc(doc(db, "sessions", sessionId));
      let scores: { [nickname: string]: number } = {};
      let leaderboard: string[] = [];
      if (answersSnap.exists()) {
        // Get all answers for all questions
        // For each answer, calculate score with speed bonus
        // (Assume answers are stored in a subcollection "answers")
        // We'll need to fetch all answers for the session
        // (This is a simplified version; in production, use getDocs)
        // For now, just set dummy data if not available
        // TODO: Implement getDocs for all answers and recalc scores
        scores = answersSnap.data().mpScores || {};
        leaderboard = Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .map(([nick]) => nick);
        setMpScores(scores);
        setMpLeaderboard(leaderboard);
        setIsMultiplayer(true);
      }
    }
    fetchMultiplayerResults();
  }, []);

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