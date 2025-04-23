import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Leaderboard from "../components/Leaderboard";
import MultiplayerStatsReport from "../components/MultiplayerStatsReport"; // Import the new component
import { db, auth } from "../firebaseClient"; // Import auth
import {
  doc, getDoc, updateDoc, arrayUnion, increment, setDoc, onSnapshot,
  collection, addDoc, serverTimestamp, getDocs, Timestamp, DocumentSnapshot // Add Firestore functions
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth"; // Import auth listener and User type

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

  // Define Question structure
  interface Question {
    id: string;
    question: string;
    answers: string[];
    correctAnswer: number;
    image?: string;
    time: number;
  }

  // Define AnswerData structure
  interface AnswerData {
    nickname: string;
    qIdx: number;
    answer: number;
    answeredAt: Timestamp;
    isCorrect: boolean;
    questionStart?: Timestamp | null;
    questionId?: string; // Add questionId if available/needed
  }

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]); // State for questions
  const [mpLeaderboard, setMpLeaderboard] = useState<string[]>([]);
  const [mpScores, setMpScores] = useState<{ [nickname: string]: number }>({});
  const [mpAllAnswers, setMpAllAnswers] = useState<AnswerData[]>([]); // State for all answers
  const [players, setPlayers] = useState<string[]>([]); // State for player list
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false); // Loading state for stats data
  const [spScore] = useState<number>(() => {
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
  const [currentUser, setCurrentUser] = useState<User | null>(null); // State for current user
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuggestion, setReportSuggestion] = useState("");


  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

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
          // Also try to get players from session data if available
          if (data.players && Array.isArray(data.players)) {
            setPlayers(data.players);
          } else {
            // Fallback: derive players from scores if not in session doc
            setPlayers(Object.keys(data.mpScores));
          }

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
            setPlayers(Object.keys(scores)); // Derive players from scores

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

    // Set up a listener for changes to the session document (scores, leaderboard, players)
    if (sessionId) {
      const sessionRef = doc(db, "sessions", sessionId);
      const unsubscribe = onSnapshot(sessionRef, (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.mpScores && data.mpLeaderboard) {
            console.log("Real-time update - scores and leaderboard:", data.mpScores, data.mpLeaderboard);
            setMpScores(data.mpScores);
            setMpLeaderboard(data.mpLeaderboard);
            setIsMultiplayer(true);

            // Update players list from session data or scores
            if (data.players && Array.isArray(data.players)) {
              setPlayers(data.players);
            } else {
              setPlayers(Object.keys(data.mpScores));
            }

            // Update localStorage with the latest data
            if (typeof window !== "undefined") {
              localStorage.setItem("mp_scores", JSON.stringify(data.mpScores));
              localStorage.setItem("mp_leaderboard", JSON.stringify(data.mpLeaderboard));
            }
          }
        }
      });

      // Also listen for players subcollection if session doc doesn't have players array
      const playersRef = collection(db, "sessions", sessionId, "players");
      const unsubPlayers = onSnapshot(playersRef, (snap) => {
        const playerNicks = snap.docs.map(d => d.id);
        if (playerNicks.length > 0) {
           // Only update if the session doc didn't provide players
           setPlayers(prevPlayers => prevPlayers.length === 0 ? playerNicks : prevPlayers);
        }
      });


      return () => {
        unsubscribe();
        unsubPlayers();
      };
    }
  }, [sessionId]);

  // Fetch Quiz Details and Questions
  useEffect(() => {
    async function fetchQuizAndQuestions() {
      if (!id) return;
      // Fetch quiz details
      const quizDoc = await getDoc(doc(db, "quizzes", id));
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz);
      }

      // Fetch questions (needed for stats report)
      const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
      const questionsArr: Question[] = [];
      for (const qDoc of questionsSnap.docs) {
        const qData = qDoc.data();
        const answersSnap = await getDocs(collection(db, "quizzes", id, "questions", qDoc.id, "answers"));
        const answersArr: string[] = [];
        answersSnap.forEach((aDoc) => {
          const aData = aDoc.data();
          answersArr[aData.index] = aData.answer;
        });
        questionsArr.push({
          id: qDoc.id,
          question: qData.question,
          answers: answersArr,
          correctAnswer: qData.correctAnswer,
          image: qData.image,
          time: typeof qData.time === "number" ? qData.time : 30,
        });
      }
      setQuestions(questionsArr);
    }
    fetchQuizAndQuestions();
  }, [id]);

  // Fetch Detailed Multiplayer Answers for Stats Report
  useEffect(() => {
    // Determine if it's multiplayer based on available data
    const finalIsMultiplayer = isMultiplayer || Object.keys(mpScores).length > 0 || sessionId !== null;

    async function fetchMultiplayerAnswers() {
      if (!sessionId || !finalIsMultiplayer) return;

      console.log("Fetching detailed answers for session:", sessionId);
      setIsLoadingStats(true);
      try {
        const answersRef = collection(db, "sessions", sessionId, "answers");
        const answersSnap = await getDocs(answersRef);
        const allAnswers = answersSnap.docs.map(doc => {
            const data = doc.data();
            // Ensure questionStart is included if present
            return {
                ...data,
                questionStart: data.questionStart || null // Handle missing questionStart
            } as AnswerData;
        });
        setMpAllAnswers(allAnswers);
        console.log("Fetched detailed answers:", allAnswers);
      } catch (error) {
        console.error("Error fetching detailed answers:", error);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchMultiplayerAnswers();
  }, [sessionId, isMultiplayer, mpScores]); // Re-run if session ID changes or multiplayer status is confirmed


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

  // --- Report Modal Logic ---
  const handleOpenReportModal = () => {
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setReportReason(""); // Clear form on close
    setReportSuggestion("");
  };

  const handleReportSubmit = async () => {
    if (!currentUser || !quiz || !reportReason.trim()) return; // Ensure user, quiz, and reason exist

    try {
      const reportsCollectionRef = collection(db, "reports");
      await addDoc(reportsCollectionRef, {
        quizId: quiz.id,
        quizTitle: quiz.title, // Store title for easier review
        userId: currentUser.uid,
        userEmail: currentUser.email, // Store email for potential contact
        reason: reportReason.trim(),
        suggestion: reportSuggestion.trim(), // Store trimmed suggestion
        timestamp: serverTimestamp(), // Use server timestamp
        status: "pending", // Initial status
      });
      console.log("Report submitted successfully!");
      alert("Report submitted successfully. Thank you!");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again later.");
    } finally {
      handleCloseReportModal(); // Close modal regardless of success/failure
    }
  };
  // --- End Report Modal Logic ---

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
    <div className="container mx-auto p-4">
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
      {/* Conditionally render Report button */}
      {currentUser && quiz && (
        <div className="text-center mt-4">
          <button
            className="text-sm text-gray-500 hover:text-red-600 underline"
            onClick={handleOpenReportModal}
          >
            Report Quiz Content
          </button>
        </div>
      )}

      {/* Conditionally render the stats report for multiplayer */}
      {finalIsMultiplayer && (
        isLoadingStats ? (
          <div className="mt-8 text-center text-primary">Loading statistics...</div>
        ) : mpAllAnswers.length > 0 && questions.length > 0 && players.length > 0 ? (
          <MultiplayerStatsReport
            players={players}
            answers={mpAllAnswers}
            questions={questions}
            scores={mpScores}
          />
        ) : (
          !isLoadingStats && <div className="mt-8 text-center text-secondary">Could not load detailed statistics for this session.</div>
        )
      )}
      {/* Report Modal Component */}
      {isReportModalOpen && quiz && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
           <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
             <h2 className="text-xl font-semibold mb-4">Report Quiz Content</h2>
             <p className="text-sm text-gray-600 mb-2">Quiz: {quiz.title}</p>
             <div className="mb-4">
               <label htmlFor="reportReason" className="block text-sm font-medium text-gray-700 mb-1">
                 Reason for reporting:
               </label>
               <textarea
                 id="reportReason"
                 rows={3}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                 placeholder="Describe the issue (e.g., incorrect answer, inappropriate content)"
                 value={reportReason}
                 onChange={(e) => setReportReason(e.target.value)}
               />
             </div>
             <div className="mb-6">
               <label htmlFor="reportSuggestion" className="block text-sm font-medium text-gray-700 mb-1">
                 Suggested correction (optional):
               </label>
               <textarea
                 id="reportSuggestion"
                 rows={3}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                 placeholder="How should this be corrected?"
                 value={reportSuggestion}
                 onChange={(e) => setReportSuggestion(e.target.value)}
               />
             </div>
             <div className="flex justify-end gap-3">
               <button
                 type="button"
                 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                 onClick={handleCloseReportModal}
               >
                 Cancel
               </button>
               <button
                 type="button"
                 className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                 onClick={handleReportSubmit}
                 disabled={!reportReason.trim()} // Disable if reason is empty
               >
                 Submit Report
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}