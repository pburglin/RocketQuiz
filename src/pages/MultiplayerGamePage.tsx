import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MultiplayerSession from "../components/MultiplayerSession";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export default function MultiplayerGamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [mpShowAnswer, setMpShowAnswer] = useState(false);
  const [mpTimer, setMpTimer] = useState(0);
  const [mpAnswered, setMpAnswered] = useState(false);
  const [mpAllAnswers, setMpAllAnswers] = useState<any[]>([]);
  const [mpScores, setMpScores] = useState<{ [nickname: string]: number }>({});
  const [mpLeaderboard, setMpLeaderboard] = useState<string[]>([]);
  const [mpSelected, setMpSelected] = useState<number | null>(null);
  const [nextQuestionTimer, setNextQuestionTimer] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [nickname, setNickname] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      if (!id) return;
      const quizDoc = await getDoc(doc(db, "quizzes", id));
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      }
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
      setMpTimer(questionsArr[0]?.time || 30);
    }
    fetchQuiz();
  }, [id]);

  // Session logic: get sessionId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (sid) setSessionId(sid);
  }, []);

  // Listen for players
  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(collection(db, "sessions", sessionId, "players"), (snap) => {
      setPlayers(snap.docs.map((doc) => doc.id));
    });
    return () => unsub();
  }, [sessionId]);

  // Timer logic
  useEffect(() => {
    if (questions.length === 0 || current >= questions.length) return;
    setMpShowAnswer(false);
    setMpTimer(questions[current].time);

    if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);

    timerRef.current = setInterval(() => {
      setMpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          setMpShowAnswer(true);
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

  // Listen for answers (stub, should be implemented for real-time multiplayer)
  // useEffect(() => { ... });

  // Calculate scores and leaderboard (stub, should be implemented for real-time multiplayer)
  // useEffect(() => { ... });

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">Loading quiz...</div>
      </div>
    );
  }

  return (
    <MultiplayerSession
      quiz={quiz}
      questions={questions}
      current={current}
      setCurrent={setCurrent}
      mpShowAnswer={mpShowAnswer}
      setMpShowAnswer={setMpShowAnswer}
      mpTimer={mpTimer}
      setMpTimer={setMpTimer}
      mpAnswered={mpAnswered}
      setMpAnswered={setMpAnswered}
      mpAllAnswers={mpAllAnswers}
      setMpAllAnswers={setMpAllAnswers}
      mpScores={mpScores}
      setMpScores={setMpScores}
      mpLeaderboard={mpLeaderboard}
      setMpLeaderboard={setMpLeaderboard}
      mpSelected={mpSelected}
      setMpSelected={setMpSelected}
      nextQuestionTimer={nextQuestionTimer}
      setNextQuestionTimer={setNextQuestionTimer}
      timerRef={timerRef}
      players={players}
      nickname={nickname}
      sessionId={sessionId}
      submitMpAnswer={() => {}} // TODO: Implement answer submission
      onQuit={() => navigate(`/play/quiz/${id}/details`)}
      onFinish={() => navigate(`/play/quiz/${id}/results`)}
    />
  );
}