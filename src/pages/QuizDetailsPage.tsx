import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuizDetails from "../components/QuizDetails";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs, DocumentData } from "firebase/firestore";
import { Helmet } from 'react-helmet-async';

// Define interfaces for better type safety
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
  // Add any other fields from your Firestore quiz document
  [key: string]: unknown; // Allow other potential fields, use unknown for better type safety
}

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number; // Assuming correctAnswer is the index
  image?: string;
  time: number;
}
export default function QuizDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsCollapsed, setQuestionsCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      setLoading(true);
      setError(null);
      try {
        if (!id) {
          setError("Quiz not found.");
          setLoading(false);
          return;
        }
        const quizDoc = await getDoc(doc(db, "quizzes", id));
        if (!quizDoc.exists()) {
          setError("Quiz not found.");
          setLoading(false);
          return;
        }
        const quizData = quizDoc.data() as DocumentData; // Cast to DocumentData initially
        setQuiz({
          id: quizDoc.id,
          ...quizData,
        } as Quiz); // Assert as Quiz type when setting state

        // Fetch questions
        const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
        const questionDocs = questionsSnap.docs;

        // Create promises to fetch answers for all questions concurrently
        const answerPromises = questionDocs.map(qDoc =>
          getDocs(collection(db, "quizzes", id, "questions", qDoc.id, "answers"))
        );

        // Wait for all answer fetches to complete
        const answerSnapshots = await Promise.all(answerPromises);

        // Process questions and their fetched answers
        const questionsArr = questionDocs.map((qDoc, index) => {
          const qData = qDoc.data();
          const answersSnap = answerSnapshots[index];
          const answersArr: string[] = [];
          answersSnap.forEach((aDoc) => {
            const aData = aDoc.data();
            // Ensure array is large enough, handle potential gaps if indices aren't sequential
            if (aData.index >= answersArr.length) {
              answersArr.length = aData.index + 1;
            }
            answersArr[aData.index] = aData.answer;
          });
          // Fill potential gaps with empty strings or a placeholder if needed
          for (let i = 0; i < answersArr.length; i++) {
            if (answersArr[i] === undefined) answersArr[i] = "";
          }

          return {
            id: qDoc.id,
            question: qData.question,
            answers: answersArr,
            correctAnswer: qData.correctAnswer,
            image: qData.image,
            time: typeof qData.time === "number" ? qData.time : 30,
          };
        });

        setQuestions(questionsArr);
      } catch { // Remove unused 'err' variable
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-primary">Loading quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-error">{error || "Quiz not found."}</div>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-accent transition"
          onClick={() => navigate("/search")}
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{quiz?.title ? `${quiz.title} - RocketQuiz` : 'Quiz Details - RocketQuiz'}</title>
        <meta name="description" content={quiz?.description || 'Details about a quiz on RocketQuiz.'} />
      </Helmet>
      <QuizDetails
        quiz={quiz!} // Use non-null assertion as we check for null earlier
        questions={questions}
        questionsCollapsed={questionsCollapsed}
        setQuestionsCollapsed={setQuestionsCollapsed}
        onStartSinglePlayer={() => navigate(`/play/quiz/${id}/single`)}
        onStartMultiplayer={() => navigate(`/play/quiz/${id}/multiplayer/lobby`)}
        onStartMillionaireChallenge={() => navigate(`/play/quiz/${id}/millionaire`)} // Add handler for new mode
        onBackToSearch={() => navigate("/search")}
      />
    </>
  );
}