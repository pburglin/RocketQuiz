import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Leaderboard from "../components/Leaderboard";
import { db } from "../firebaseClient";
import { doc, getDoc, getDocs, collection, updateDoc, arrayUnion, increment, setDoc, onSnapshot } from "firebase/firestore";

export default function ResultsPage() {
  // Multiplayer: fetch leaderboard and scores from Firestore session doc
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log("URL params:", params.toString());
    
    if (params.get("session")) {
      const sid = params.get("session");
      console.log("Found session ID in URL:", sid);
      setSessionId(sid);
      
      // Also store it in localStorage as a backup
      if (typeof window !== "undefined" && sid) {
        localStorage.setItem("mp_sessionId", sid);
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mp_sessionId");
      if (stored) {
        console.log("Using stored session ID from localStorage:", stored);
        setSessionId(stored);
      } else {
        console.error("No session ID found in URL or localStorage");
      }
    }
  }, []);

  // Clear multiplayer data if not in multiplayer mode (i.e., after single player game)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("session")) {
      // Not multiplayer: clear multiplayer data from localStorage and state
      if (typeof window !== "undefined") {
        localStorage.removeItem("mp_scores");
        localStorage.removeItem("mp_leaderboard");
        localStorage.removeItem("mp_sessionId");
      }
      setMpScores({});
      setMpLeaderboard([]);
    }
  }, []);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState<any>(null);
  const [mpLeaderboard, setMpLeaderboard] = useState<string[]>([]);
  const [mpScores, setMpScores] = useState<{ [nickname: string]: number }>({});
  const [spScore, setSpScore] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedScore = localStorage.getItem("sp_score");
      return storedScore ? parseInt(storedScore, 10) : 0;
    }
    return 0;
  });
  const [nickname, setNickname] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mp_nickname") || "";
    }
    return "";
  });
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(() => {
    // Check URL parameters first - if there's a session parameter, it's definitely multiplayer
    const params = new URLSearchParams(window.location.search);
    if (params.get("session")) {
      return true;
    }
    return false;
  });
  // Multiplayer: fetch leaderboard and scores from Firestore if not in location.state
  useEffect(() => {
    async function fetchMultiplayerResults() {
      if (!sessionId || !id) return;

      // Fetch all questions for this quiz
      let questionIds: string[] = [];
      try {
        const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
        questionIds = questionsSnap.docs.map((doc) => doc.id);
      } catch (e) {
        console.error("Error fetching questions:", e);
      }

      // If questionIds is empty, fallback to 5 questions (for compatibility)
      if (questionIds.length === 0) {
        questionIds = Array.from({ length: 5 }, (_, i) => String(i));
      }

      // Build a map of questionId -> correctAnswer
      const correctAnswersMap: { [qid: string]: number } = {};
      try {
        const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
        questionsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (typeof data.correctAnswer === "number") {
            correctAnswersMap[docSnap.id] = data.correctAnswer;
          }
        });
      } catch (e) {
        console.error("Error fetching correct answers:", e);
      }

      // Fetch all answers for all questions in this session
      let allAnswers: any[] = [];
      for (const qid of questionIds) {
        try {
          const responsesSnap = await getDocs(collection(db, "sessions", sessionId, "answers", qid, "responses"));
          responsesSnap.forEach((docSnap) => {
            const ans = docSnap.data();
            allAnswers.push({ ...ans, nickname: docSnap.id, qid });
          });
        } catch (e) {
          console.error(`Error fetching answers for question ${qid}:`, e);
        }
      }

      // Calculate total scores for each player
      const scores: { [nickname: string]: number } = {};
      allAnswers.forEach((ans) => {
        const correct = correctAnswersMap[ans.qid];
        if (typeof correct === "number" && ans.answer === correct) {
          const base = 1000;
          const maxTime = ans.timeLimit || 30;
          const timeTaken = ans.timeTaken || 0;
          const speedFactor = Math.max(0, 1 - (timeTaken / maxTime));
          const bonus = Math.round(1000 * Math.pow(speedFactor, 1.5));
          scores[ans.nickname] = (scores[ans.nickname] || 0) + base + bonus;
        }
      });

      // Build leaderboard
      const leaderboard = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([nick]) => nick);

      setMpScores(scores);
      setMpLeaderboard(leaderboard);
      setIsMultiplayer(true);
    }

    fetchMultiplayerResults();
  }, [sessionId, id]);

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


  const handleRateQuiz = async (rating: number) => {
    if (!id || !quiz) return;
    
    try {
      const quizRef = doc(db, "quizzes", id);
      
      // Update the quiz document with the new rating
      await updateDoc(quizRef, {
        // Add the rating to the ratings array
        ratings: arrayUnion(rating),
        // Increment the total ratings count
        ratingCount: increment(1),
        // Update the average rating
        // We'll calculate this on the client side for now
        // In a production app, you might want to use a Cloud Function for this
        averageRating: ((quiz.averageRating || 0) * (quiz.ratingCount || 0) + rating) /
                       ((quiz.ratingCount || 0) + 1)
      });
      
      console.log(`Quiz rated: ${rating} stars`);
    } catch (error) {
      console.error("Error rating quiz:", error);
    }
  };

  // Add debug output
  console.log("Rendering ResultsPage with:", {
    sessionId,
    isMultiplayer,
    mpLeaderboard,
    mpScores,
    nickname,
    spScore
  });

  // Create a fallback leaderboard if needed, but only if this is actually a multiplayer game
  const finalLeaderboard = isMultiplayer ?
    (mpLeaderboard.length > 0 ? mpLeaderboard :
      Object.keys(mpScores).length > 0 ?
        Object.entries(mpScores as Record<string, number>)
          // Sort by top score (highest first)
          .sort((a, b) => b[1] - a[1])
          .map(([nick]) => nick) :
        []) :
    [];

  // Don't override the isMultiplayer state based on localStorage data
  // This ensures we use the correct game mode based on the current session
  
  if (
    !quiz ||
    (isMultiplayer && (
      !mpScores ||
      Object.keys(mpScores).length === 0 ||
      !finalLeaderboard ||
      finalLeaderboard.length === 0
    ))
  ) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">Loading final results...</div>
      </div>
    );
  }

  return (
    <Leaderboard
      quiz={quiz}
      isMultiplayer={isMultiplayer}
      mpLeaderboard={finalLeaderboard}
      mpScores={isMultiplayer ? mpScores : {}}
      nickname={nickname}
      spScore={spScore}
      onPlayAgain={() => navigate(`/play/quiz/${id}/details`)}
      onFindAnotherQuiz={() => navigate("/search")}
      showMedals={true}
      onRateQuiz={handleRateQuiz}
    />
  );
}