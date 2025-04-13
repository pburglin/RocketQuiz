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

  // For demo: get scores/leaderboard from location state or set dummy data
  useEffect(() => {
    if (location.state) {
      setMpLeaderboard(location.state.mpLeaderboard || []);
      setMpScores(location.state.mpScores || {});
      setSpScore(location.state.spScore || 0);
      setNickname(location.state.nickname || "");
      setIsMultiplayer(location.state.isMultiplayer || false);
    }
  }, [location.state]);

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
    />
  );
}