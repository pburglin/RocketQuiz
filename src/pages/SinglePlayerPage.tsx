import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SinglePlayerSession from "../components/SinglePlayerSession";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Helmet } from 'react-helmet-async';

export default function SinglePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Define interfaces
  interface Quiz {
    id: string;
    title: string;
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
  const [quiz, setQuiz] = useState<Quiz | null>(null); // Use Quiz type
  const [questions, setQuestions] = useState<Question[]>([]); // Use Question type
  const [current, setCurrent] = useState(0);
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [spScore, setSpScore] = useState(0);
  const [spCorrectAnswers, setSpCorrectAnswers] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedCorrectAnswers = localStorage.getItem("sp_correctAnswers");
      return storedCorrectAnswers ? parseInt(storedCorrectAnswers, 10) : 0;
    }
    return 0;
  });
  const [spCurrentSpeedBonus, setSpCurrentSpeedBonus] = useState(0);
  const [spSelected, setSpSelected] = useState<number | null>(null);
  const [nextQuestionTimer, setNextQuestionTimer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear previous game data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("Clearing previous game data from localStorage...");
      localStorage.removeItem("sp_score");
      localStorage.removeItem("sp_correctAnswers");
      localStorage.removeItem("mp_sessionId");
      localStorage.removeItem("mp_scores");
      localStorage.removeItem("mp_leaderboard");
      localStorage.removeItem("mp_nickname");     
    }
  }, []); // Empty dependency array ensures this runs only once on mount

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
          title: quizData.title || "Untitled Quiz", // Ensure title exists
          ...quizData,
        } as Quiz); // Cast to Quiz type

        const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
        const questionsArr: Question[] = []; // Use Question type
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
      } catch { // Remove unused err
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

  // Next question countdown logic
  useEffect(() => {
    if (!showAnswer || nextQuestionTimer === null || nextQuestionTimer <= 0) return;

    const countdownTimer = setTimeout(() => {
      setNextQuestionTimer((t) => (t !== null ? Math.max(0, t - 1) : null));
    }, 1000);

    return () => clearTimeout(countdownTimer);
  }, [nextQuestionTimer, showAnswer]);


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
        <title>{quiz?.title ? `${quiz.title} - Single Player - RocketQuiz` : 'Single Player Quiz - RocketQuiz'}</title>
        <meta name="description" content={quiz?.title ? `Play the ${quiz.title} quiz in single-player mode on RocketQuiz.` : 'Play a quiz in single-player mode on RocketQuiz.'} />
      </Helmet>
      <SinglePlayerSession
        quiz={quiz}
        questions={questions}
        current={current}
        setCurrent={setCurrent}
        timer={timer}
        //setTimer={setTimer} // Remove unused prop
        showAnswer={showAnswer}
        setShowAnswer={setShowAnswer}
        spScore={spScore}
        setSpScore={setSpScore}
        spCorrectAnswers={spCorrectAnswers}
        setSpCorrectAnswers={setSpCorrectAnswers}
        spCurrentSpeedBonus={spCurrentSpeedBonus}
        setSpCurrentSpeedBonus={setSpCurrentSpeedBonus}
        spSelected={spSelected}
        setSpSelected={setSpSelected}
        nextQuestionTimer={nextQuestionTimer}
        setNextQuestionTimer={setNextQuestionTimer}
        timerRef={timerRef}
        onQuit={() => navigate(`/play/quiz/${id}/details`)}
        onFinish={() => {
          // Store the score and correct answers count in localStorage so ResultsPage can access it
          localStorage.setItem('sp_score', spScore.toString());
          localStorage.setItem('sp_correctAnswers', spCorrectAnswers.toString());
          navigate(`/play/quiz/${id}/results`);
        }}
      />
    </>
  );
}