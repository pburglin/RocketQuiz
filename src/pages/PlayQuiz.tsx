import React, { useEffect, useState, useRef } from "react";
import ColorCardPlaceholder from "../components/ColorCardPlaceholder";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  image?: string;
  time: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  image?: string;
  language?: string;
  tags?: string[];
}

const PlayQuiz: React.FC<{ user: FirebaseUser | null }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
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
          title: quizData.title,
          description: quizData.description,
          image: quizData.image,
          language: quizData.language,
          tags: quizData.tags,
        });

        const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
        const questionsArr: Question[] = [];
        for (const qDoc of questionsSnap.docs) {
          const qData = qDoc.data();
          // Fetch answers for this question
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
        setCurrent(0);
        setShowAnswer(false);
        setLoading(false);
      } catch (err) {
        setError("Failed to load quiz.");
        setLoading(false);
      }
    };
    fetchQuiz();
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id]);

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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup interval if question changes or on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);
    };
    // eslint-disable-next-line
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

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">No questions found for this quiz.</div>
        <button
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded"
          onClick={() => navigate("/search")}
        >
          Back to Search
        </button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
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
      <div className="mb-2 flex flex-wrap gap-2">
        {quiz.tags?.map((tag) => (
          <span
            key={tag}
            className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs"
          >
            {tag}
          </span>
        ))}
        {quiz.language && (
          <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
            {quiz.language}
          </span>
        )}
      </div>
      <div className="mt-6 mb-2 text-lg font-semibold">
        Question {current + 1} of {questions.length}
      </div>
      <div className="mb-2 font-bold">{q.question}</div>
      {q.image && q.image.trim() !== "" ? (
        <img
          src={q.image}
          alt={`Question ${current + 1}`}
          className="w-full h-40 object-cover rounded mb-4"
        />
      ) : (
        <ColorCardPlaceholder
          id={q.id}
          text={q.question ? q.question.charAt(0).toUpperCase() : "?"}
          className="w-full h-40 rounded mb-4"
        />
      )}
      <div className="mb-4">
        <span className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
          Time left: {timer} second{timer !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.answers.map((answer, idx) => (
          <button
            key={idx}
            className={`w-full px-4 py-2 rounded border text-left transition
              ${
                showAnswer
                  ? idx === q.correctAnswer
                    ? "bg-green-200 border-green-400 font-bold"
                    : "bg-red-100 border-gray-200"
                  : "bg-white border-gray-200 hover:bg-emerald-50"
              }
            `}
            disabled={!showAnswer}
          >
            {answer}
            {showAnswer && idx === q.correctAnswer && (
              <span className="ml-2 text-green-700 font-bold">(Correct)</span>
            )}
          </button>
        ))}
      </div>
      {!showAnswer && (
        <div className="mb-4 text-center text-gray-600">
          Waiting {timer} second{timer !== 1 ? "s" : ""} before showing the correct answer...
        </div>
      )}
      {showAnswer && (
        <div className="mb-4 text-center text-green-700 font-semibold">
          Correct answer shown!{" "}
          {current < questions.length - 1 ? "Click Next to continue." : "Quiz complete."}
        </div>
      )}
      <div className="flex justify-between">
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
          onClick={() => navigate("/search")}
        >
          Quit
        </button>
        {showAnswer && current < questions.length - 1 && (
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded"
            onClick={() => {
              setCurrent((c) => c + 1);
              setShowAnswer(false);
            }}
          >
            Next
          </button>
        )}
        {showAnswer && current === questions.length - 1 && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => navigate("/search")}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayQuiz;