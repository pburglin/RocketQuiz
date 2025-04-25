import React, { useState, useEffect } from "react";
import ColorCardPlaceholder from "./ColorCardPlaceholder";
import StarRating from "./StarRating";
import QuizPerformanceGraphs from "./QuizPerformanceGraphs"; // Import the new component
import { auth, db } from "../firebaseClient"; // Import auth object and db
import { onAuthStateChanged, User } from "firebase/auth"; // Import listener and User type
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions
import { Play, Users, UsersRound, TrendingUp } from "lucide-react"; // Import icons

// Define interfaces locally for type safety
interface Quiz {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  popularity?: number;
  language: string;
  averageRating?: number;
  ratingCount?: number;
  questionCount?: number;
  totalPlays?: number;
  uniqueUsers?: number;
  averageUsersPerSession?: number;
  maxUsersPerSession?: number;
  totalPlayerCountSum?: number; // Added for average calculation
  [key: string]: unknown;
}

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  image?: string;
  time: number;
}

export default function QuizDetails({
  quiz,
  questions,
  questionsCollapsed,
  setQuestionsCollapsed,
  onStartSinglePlayer,
  onStartMultiplayer,
  onBackToSearch,
}: {
  quiz: Quiz; // Use Quiz interface
  questions: Question[]; // Use Question interface
  questionsCollapsed: boolean;
  setQuestionsCollapsed: (c: boolean) => void;
  onStartSinglePlayer: () => void;
  onStartMultiplayer: () => void;
  onBackToSearch: () => void;
}) {
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
      // Optionally: Add a success message/toast for the user
      alert("Report submitted successfully. Thank you!");
    } catch (error) {
      console.error("Error submitting report:", error);
      // Optionally: Add an error message/toast for the user
      alert("Failed to submit report. Please try again later.");
    } finally {
      handleCloseReportModal(); // Close modal regardless of success/failure
    }
  };


  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">Quiz not found.</div>
        <button
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded"
          onClick={onBackToSearch}
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2 text-primary">{quiz.title}</h1>
      {quiz.image && quiz.image.trim() !== "" ? (
        <img
          src={quiz.image}
          alt={quiz.title}
          className="w-full h-48 object-cover rounded mb-4"
        />
      ) : (
        <ColorCardPlaceholder
          id={quiz.id}
          text={quiz.title ? quiz.title.charAt(0).toUpperCase() : "?"}
          className="w-full h-48 rounded mb-4"
        />
      )}
      <div className="mb-4 text-gray-600">{quiz.description}</div>

      {/* Display rating if available */}
      {quiz.averageRating !== undefined && (
        <div className="mb-4 flex items-center gap-2">
          <StarRating
            rating={quiz.averageRating}
            size="md"
          />
          <span className="text-sm text-gray-600">
            {quiz.averageRating.toFixed(1)} out of 5 ({quiz.ratingCount || 0} {quiz.ratingCount === 1 ? 'rating' : 'ratings'})
          </span>
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2"> {/* Increased bottom margin */}
        {quiz.tags?.map((tag: string) => (
          <span
            key={tag}
            className="inline-block bg-accent text-white px-2 py-0.5 rounded text-xs"
          >
            {tag}
          </span>
        ))}
        {quiz.language && (
          <span className="inline-block bg-secondary text-primary px-2 py-0.5 rounded text-xs font-medium">
            {quiz.language}
          </span>
        )}
      </div>

      {/* --- Quiz Statistics --- */}
      <div className="my-6 p-4 border rounded bg-base-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        {typeof quiz.totalPlays === 'number' && (
          <div className="flex flex-col items-center">
            <Play className="w-6 h-6 mb-1 text-primary" />
            <span className="text-xl font-semibold">{quiz.totalPlays.toLocaleString()}</span>
            <span className="text-xs text-gray-500">Total Play(s)</span>
          </div>
        )}
        {typeof quiz.uniqueUsers === 'number' && (
          <div className="flex flex-col items-center">
            <Users className="w-6 h-6 mb-1 text-primary" />
            <span className="text-xl font-semibold">{quiz.uniqueUsers.toLocaleString()}</span>
            <span className="text-xs text-gray-500">Unique Players</span>
          </div>
        )}
        {/* Calculate Average Players Per Session */}
        {typeof quiz.totalPlays === 'number' && quiz.totalPlays > 0 && typeof quiz.totalPlayerCountSum === 'number' ? (
           <div className="flex flex-col items-center">
            <UsersRound className="w-6 h-6 mb-1 text-secondary" />
            <span className="text-xl font-semibold">{(quiz.totalPlayerCountSum / quiz.totalPlays).toFixed(1)}</span>
            <span className="text-xs text-gray-500">Avg. Players/Session</span>
          </div>
        ) : typeof quiz.totalPlays === 'number' && ( // Show 0 if totalPlays is 0 but exists
           <div className="flex flex-col items-center opacity-50"> {/* Dim if zero */}
            <UsersRound className="w-6 h-6 mb-1 text-secondary" />
            <span className="text-xl font-semibold">0.0</span>
            <span className="text-xs text-gray-500">Avg. Players/Session</span>
          </div>
        )}
        {typeof quiz.maxUsersPerSession === 'number' && (
           <div className="flex flex-col items-center">
            <TrendingUp className="w-6 h-6 mb-1 text-secondary" />
            <span className="text-xl font-semibold">{quiz.maxUsersPerSession}</span>
            <span className="text-xs text-gray-500">Max Players/Session</span>
          </div>
        )}
      </div>
      {/* --- End Quiz Statistics --- */}

      {/* --- Historical Performance Graphs --- */}
      <div className="my-8 p-4 border rounded bg-neutral">
        <h2 className="text-lg font-semibold mb-4 text-primary">Quiz Performance Insights</h2>
        {/* Render the actual graph component */}
        <QuizPerformanceGraphs quizId={quiz.id} />
      </div>
      {/* --- End Historical Performance Graphs --- */}


      {/* Start Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8"> {/* Stack vertically on small screens */}
        <button
          className="flex-1 px-6 py-3 bg-primary text-white rounded font-bold hover:bg-accent transition text-center" // Increased padding, centered text
          onClick={onStartSinglePlayer}
        >
          Start Single Player
        </button>
        <button
          className="flex-1 px-6 py-3 bg-secondary text-primary rounded font-bold hover:bg-accent transition text-center" // Increased padding, centered text
          onClick={onStartMultiplayer}
        >
          Start Multiplayer
        </button>
      </div>

      {/* Collapsible Questions & Other Links */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4"> {/* Adjusted layout */}
         <button
          className="px-4 py-2 bg-neutral rounded border border-secondary text-primary font-semibold hover:bg-secondary/50 transition text-sm" // Smaller text
          onClick={() => setQuestionsCollapsed(!questionsCollapsed)}
        >
          {questionsCollapsed ? "Show Questions (Spoilers!)" : "Hide Questions"}
        </button>

        <div className="flex gap-4 items-center"> {/* Group Back and Report */}
          <button
            className="text-sm text-primary hover:underline" // Simple link style
            onClick={onBackToSearch}
          >
            Back to Search
          </button>
          {/* Conditionally render Report button */}
          {currentUser && (
            <button
              className="text-sm text-red-600 hover:underline" // Simple link style, red color
              onClick={handleOpenReportModal}
            >
              Report Content
            </button>
          )}
        </div>
      </div>

       {/* Questions List (conditionally rendered) */}
       {!questionsCollapsed && (
          <div className="mt-4 space-y-2 border-t pt-4"> {/* Added top border */}
            <h3 className="text-md font-semibold mb-2">Questions:</h3>
            {questions.map((q, idx) => (
              <details key={q.id} open={false} className="border rounded p-2 bg-white"> {/* Added bg */}
                <summary className="font-semibold cursor-pointer"> {/* Added cursor */}
                  Question {idx + 1}
                </summary>
                <div className="mt-2 text-sm">{q.question}</div> {/* Smaller text */}
              </details>
            ))}
          </div>
        )}


      {/* Report Modal */}
      {isReportModalOpen && (
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