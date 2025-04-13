import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuizDetails from "../components/QuizDetails";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export default function QuizDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
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
        const quizData = quizDoc.data();
        setQuiz({
          id: quizDoc.id,
          ...quizData,
        });

        const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
        const questionsArr: any[] = [];
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
      } catch (err) {
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
        <div className="text-lg text-gray-700">Loading quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-red-600">{error || "Quiz not found."}</div>
        <button
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded"
          onClick={() => navigate("/search")}
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <QuizDetails
      quiz={quiz}
      questions={questions}
      questionsCollapsed={questionsCollapsed}
      setQuestionsCollapsed={setQuestionsCollapsed}
      onStartSinglePlayer={() => navigate(`/play/quiz/${id}/single`)}
      onStartMultiplayer={() => navigate(`/play/quiz/${id}/multiplayer/lobby`)}
      onBackToSearch={() => navigate("/search")}
    />
  );
}