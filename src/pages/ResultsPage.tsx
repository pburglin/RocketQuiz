import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Remove useLocation
import Leaderboard from "../components/Leaderboard";
import { db } from "../firebaseClient";
// Import DocumentSnapshot
import { doc, getDoc, updateDoc, arrayUnion, increment, setDoc, onSnapshot, DocumentSnapshot } from "firebase/firestore";

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Define Quiz interface
  interface Quiz {
    id: string;
    title: string;
    averageRating?: number;
    ratingCount?: number;
    [key: string]: unknown;
  }
  const [quiz, setQuiz] = useState<Quiz | null>(null); // Use Quiz interface
  const [mpLeaderboard, setMpLeaderboard] = useState<string[]>([]);
  const [mpScores, setMpScores] = useState<{ [nickname: string]: number }>({});
  const [spScore] = useState<number>(() => { // Ensure setSpScore is removed
    if (typeof window !== "undefined") {
      const storedScore = localStorage.getItem("sp_score");
      return storedScore ? parseInt(storedScore, 10) : 0;
    }
    return 0;
  });
  const [nickname] = useState<string>(() => { // Ensure setNickname is removed
    if (typeof window !== "undefined") {
      return localStorage.getItem("mp_nickname") || "";
    }
    return "";
  });
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);
  // Multiplayer: fetch leaderboard and scores from Firestore if not in location.state
  useEffect(() => {
    async function fetchMultiplayerResults() {
      // First check localStorage for backup data
      let foundData = false;
      if (typeof window !== "undefined") {
        const storedScores = localStorage.getItem("mp_scores");
        const storedLeaderboard = localStorage.getItem("mp_leaderboard");
        
        if (storedScores && storedLeaderboard) {
          try {
            const scores = JSON.parse(storedScores);
            const leaderboard = JSON.parse(storedLeaderboard);
            console.log("Found backup scores and leaderboard in localStorage:", { scores, leaderboard });
            
            setMpScores(scores);
            setMpLeaderboard(leaderboard);
            setIsMultiplayer(true);
            foundData = true;
          } catch (error) {
            console.error("Error parsing backup data from localStorage:", error);
          }
        }
      }
      
      // Then try to fetch from Firestore
      if (!sessionId) {
        if (!foundData) {
          console.error("No sessionId and no backup data found");
        }
        return;
      }
      
      console.log("Fetching multiplayer results for session:", sessionId);
      
      const sessionRef = doc(db, "sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        console.log("Session data:", data);
        
        if (data.mpScores && data.mpLeaderboard) {
          console.log("Found scores and leaderboard in Firestore:", data.mpScores, data.mpLeaderboard);
          setMpScores(data.mpScores);
          setMpLeaderboard(data.mpLeaderboard);
          setIsMultiplayer(true);
          
          // Update localStorage with the latest data
          if (typeof window !== "undefined") {
            localStorage.setItem("mp_scores", JSON.stringify(data.mpScores));
            localStorage.setItem("mp_leaderboard", JSON.stringify(data.mpLeaderboard));
          }
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
              
              // Update localStorage with the latest data
              if (typeof window !== "undefined") {
                localStorage.setItem("mp_scores", JSON.stringify(scores));
                localStorage.setItem("mp_leaderboard", JSON.stringify(leaderboard));
              }
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
      const unsubscribe = onSnapshot(sessionRef, (snapshot: DocumentSnapshot) => { // Use imported DocumentSnapshot
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.mpScores && data.mpLeaderboard) {
            console.log("Real-time update - scores and leaderboard:", data.mpScores, data.mpLeaderboard);
            setMpScores(data.mpScores);
            setMpLeaderboard(data.mpLeaderboard);
            setIsMultiplayer(true);
            
            // Update localStorage with the latest data
            if (typeof window !== "undefined") {
              localStorage.setItem("mp_scores", JSON.stringify(data.mpScores));
              localStorage.setItem("mp_leaderboard", JSON.stringify(data.mpLeaderboard));
            }
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
        setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz); // Cast to Quiz
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

  // Create a fallback leaderboard if needed
  const finalLeaderboard = mpLeaderboard.length > 0 ? mpLeaderboard :
    Object.keys(mpScores).length > 0 ?
      Object.entries(mpScores as Record<string, number>)
        // Sort by top score (highest first)
        // Note: Currently we only have access to total scores, not individual question scores
        .sort((a, b) => b[1] - a[1])
        .map(([nick]) => nick) :
      [];

  // Create a fallback for multiplayer detection
  const finalIsMultiplayer = isMultiplayer || Object.keys(mpScores).length > 0 || sessionId !== null;

  return (
    <Leaderboard
      quiz={quiz}
      isMultiplayer={finalIsMultiplayer}
      mpLeaderboard={finalLeaderboard}
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