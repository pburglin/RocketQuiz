import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SinglePlayerSession from "../components/SinglePlayerSession";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export default function SinglePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [spScore, setSpScore] = useState(0);
  const [spSelected, setSpSelected] = useState<number | null>(null);
  const [nextQuestionTimer, setNextQuestionTimer] = useState<number | null>(null);
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
        setTimer(questionsArr[0]?.time || 30);
      } catch (err) {
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [id]);

  // Timer logic
  useEffect(() => {
    if (questions.length === 0 || current >= questions.length) return;
    setShowAnswer(false);
    setTimer(questions[current].time);

    if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          setShowAnswer(true);
          setNextQuestionTimer(10); // Start 10s countdown
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);
    };
  }, [current, questions]);

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
    <SinglePlayerSession
      quiz={quiz}
      questions={questions}
      current={current}
      setCurrent={setCurrent}
      timer={timer}
      setTimer={setTimer}
      showAnswer={showAnswer}
      setShowAnswer={setShowAnswer}
      spScore={spScore}
      setSpScore={setSpScore}
      spSelected={spSelected}
      setSpSelected={setSpSelected}
      nextQuestionTimer={nextQuestionTimer}
      setNextQuestionTimer={setNextQuestionTimer}
      timerRef={timerRef}
      onQuit={() => navigate(`/play/quiz/${id}/details`)}
      onFinish={() => {
        // Store the score in localStorage so ResultsPage can access it
        localStorage.setItem('sp_score', spScore.toString());
        navigate(`/play/quiz/${id}/results`);
      }}
    />
  );
}