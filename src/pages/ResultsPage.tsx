import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Leaderboard from "../components/Leaderboard";
import { db } from "../firebaseClient";
import { doc, getDoc, updateDoc, arrayUnion, increment, setDoc, onSnapshot } from "firebase/firestore";

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
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  // Multiplayer: fetch leaderboard and scores from Firestore if not in location.state
  useEffect(() => {
    async function fetchMultiplayerResults() {
      if (!sessionId) return;
      console.log("Fetching multiplayer results for session:", sessionId);
      
      const sessionRef = doc(db, "sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        console.log("Session data:", data);
        
        if (data.mpScores && data.mpLeaderboard) {
          console.log("Found scores and leaderboard:", data.mpScores, data.mpLeaderboard);
          setMpScores(data.mpScores);
          setMpLeaderboard(data.mpLeaderboard);
          setIsMultiplayer(true);
        } else {
          console.error("Missing mpScores or mpLeaderboard in session data");
          
          // If leaderboard is missing but scores exist, create it
          if (data.mpScores && !data.mpLeaderboard) {
            console.log("Creating leaderboard from scores");
            const scores = data.mpScores;
            const leaderboard = Object.entries(scores as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .map(([nick]) => nick);
            
            setMpLeaderboard(leaderboard);
            setMpScores(scores);
            setIsMultiplayer(true);
            
            // Update the session with the leaderboard
            try {
              await setDoc(sessionRef, { mpLeaderboard: leaderboard }, { merge: true });
              console.log("Updated session with leaderboard");
            } catch (error) {
              console.error("Error updating session with leaderboard:", error);
            }
          }
        }
      } else {
        console.error("Session document does not exist");
      }
    }
    
    fetchMultiplayerResults();
    
    // Set up a listener for changes to the session document
    if (sessionId) {
      const sessionRef = doc(db, "sessions", sessionId);
      const unsubscribe = onSnapshot(sessionRef, (snapshot: any) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.mpScores && data.mpLeaderboard) {
            console.log("Real-time update - scores and leaderboard:", data.mpScores, data.mpLeaderboard);
            setMpScores(data.mpScores);
            setMpLeaderboard(data.mpLeaderboard);
            setIsMultiplayer(true);
          }
        }
      });
      
      return () => unsubscribe();
    }
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
      onRateQuiz={handleRateQuiz}
    />
  );
}