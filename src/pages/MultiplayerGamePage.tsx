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
  const [isOrganizer, setIsOrganizer] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mp_isOrganizer");
      if (stored) return stored === "true";
    }
    return false;
  });
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
  const [nickname, setNickname] = useState<string>(() => {
    // Try to get nickname from localStorage (set in lobby)
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mp_nickname");
      if (stored) return stored;
    }
    return "";
  });
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
      // Organizer initializes currentQuestion in Firestore
      if (questionsArr.length > 0 && sessionId && isOrganizer) {
        const sessionRef = doc(db, "sessions", sessionId);
        setDoc(sessionRef, { currentQuestion: 0 }, { merge: true });
      }
    }
    fetchQuiz();
  }, [id]);

  // On mount, try to get isOrganizer from localStorage if not already set
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mp_isOrganizer");
      if (stored) setIsOrganizer(stored === "true");
    }
  }, []);

  // On mount, try to get nickname from localStorage if not already set
  useEffect(() => {
    if (!nickname && typeof window !== "undefined") {
      const stored = localStorage.getItem("mp_nickname");
      if (stored) setNickname(stored);
    }
  }, [nickname]);

  // Session logic: get sessionId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (sid) setSessionId(sid);
  }, []);

  // Listen for currentQuestion in session doc (sync all clients)
  // Only reset state when question index changes
  const prevQuestionRef = useRef<number | null>(null);
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, "sessions", sessionId);
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (snap.exists() && typeof snap.data().currentQuestion === "number") {
        const newCurrent = snap.data().currentQuestion;
        setCurrent((prev) => {
          if (prev !== newCurrent) {
            prevQuestionRef.current = prev;
            setMpAnswered(false);
            setMpSelected(null);
            setMpShowAnswer(false);
            setNextQuestionTimer(null);
          }
          return newCurrent;
        });
      }
    });
    return () => unsub();
  }, [sessionId]);

  // Listen for players
  // Listen for gameFinished and navigate to results for all clients
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, "sessions", sessionId);
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (snap.exists() && snap.data().gameFinished) {
        navigate(`/play/quiz/${id}/results?session=${sessionId}`);
      }
    });
    return () => unsub();
  }, [sessionId, id, navigate]);

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


 // Next question countdown logic (organizer controls progression)
 useEffect(() => {
   if (!mpShowAnswer || nextQuestionTimer === null) return;
   
   // We no longer automatically advance to the next question when timer reaches 0
   // Instead, we just let the timer count down to 0 and then the Next button will be enabled
   if (nextQuestionTimer <= 0) {
     return;
   }
   const timer = setTimeout(() => {
     setNextQuestionTimer((t) => (t !== null ? Math.max(0, t - 1) : null));
   }, 1000);
   return () => clearTimeout(timer);
 }, [nextQuestionTimer, mpShowAnswer, isOrganizer, sessionId, current, questions.length, id, navigate]);

  // Listen for answers for the current question
  useEffect(() => {
    if (!sessionId || !questions.length || current >= questions.length) return;
    const answersRef = collection(db, "sessions", sessionId, "answers");
    const unsub = onSnapshot(answersRef, (snap) => {
      const allAnswers = snap.docs
        .map((doc) => ({ nickname: doc.id, ...(doc.data() as any) }))
        .filter((a) => typeof a.qIdx === "number" && a.qIdx === current);
      setMpAllAnswers(allAnswers);
      // If all players have answered, show answer and start next question timer
      if (
        allAnswers.length === players.length &&
        players.length > 0 &&
        !mpShowAnswer
      ) {
        setMpShowAnswer(true);
        setNextQuestionTimer(10);
      }
    });
    return () => unsub();
  }, [sessionId, current, questions, players.length]);

  // Calculate scores and leaderboard when answers are shown
  useEffect(() => {
    if (!mpShowAnswer || !questions.length) return;
    // Calculate scores for this question, including speed bonus
    const q = questions[current];
    const newScores = { ...mpScores };

    // Fetch questionStart from session doc
    async function calcScores() {
      let questionStart: number | null = null;
      if (sessionId) {
        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists() && sessionSnap.data().questionStart?.toMillis) {
          questionStart = sessionSnap.data().questionStart.toMillis();
        }
      }
      mpAllAnswers.forEach((a) => {
        if (a.answer === q.correctAnswer && typeof a.answeredAt?.toMillis === "function" && questionStart) {
          const answeredAt = a.answeredAt.toMillis();
          const timeTaken = Math.max(0, (answeredAt - questionStart) / 1000); // in seconds
          // Scoring: 1000 base + up to 1000 bonus (faster = more bonus, slower = less)
          const maxTime = q.time || 30;
          // Enhanced speed bonus calculation - more weight on speed
          const speedFactor = Math.max(0, 1 - (timeTaken / maxTime));
          // Exponential scoring to reward faster answers more significantly
          const speedBonus = Math.round(1000 * Math.pow(speedFactor, 1.5));
          const points = 1000 + speedBonus;
          newScores[a.nickname] = (newScores[a.nickname] || 0) + points;
        }
      });
      setMpScores(newScores);
      // Update leaderboard
      const sorted = Object.entries(newScores)
        .sort((a, b) => b[1] - a[1])
        .map(([nick]) => nick);
      setMpLeaderboard(sorted);
    }
    calcScores();
  }, [mpShowAnswer]);

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-gray-700">Loading quiz...</div>
      </div>
    );
  }

  return (
    <MultiplayerSession
      onFinish={async () => {
        if (!isOrganizer || !sessionId) return;
        
        if (current < questions.length - 1) {
          // Move to next question
          const sessionRef = doc(db, "sessions", sessionId);
          await setDoc(sessionRef, {
            currentQuestion: current + 1,
            [`questionStarts.${current + 1}`]: serverTimestamp()
          }, { merge: true });
        } else {
          // Last question - finish the game
          // Fetch all answers for the session
          const answersSnap = await getDocs(collection(db, "sessions", sessionId, "answers"));
          const allAnswers = answersSnap.docs.map((doc) => ({ nickname: doc.id, ...(doc.data() as any) }));
          // Fetch session for questionStart times
          const sessionRef = doc(db, "sessions", sessionId);
          const sessionSnap = await getDoc(sessionRef);
          let scores: { [nickname: string]: number } = {};
          let leaderboard: string[] = [];
          if (sessionSnap.exists()) {
            // For each question, get questionStart
            const sessionData = sessionSnap.data();
            const questionsStart: { [qIdx: number]: number } = {};
            if (sessionData.questionStartTimes) {
              Object.entries(sessionData.questionStartTimes).forEach(([qIdx, ts]: [string, any]) => {
                if (ts?.toMillis) questionsStart[Number(qIdx)] = ts.toMillis();
              });
            }
            // Calculate scores
            allAnswers.forEach((a) => {
              if (typeof a.qIdx === "number" && typeof a.answer === "number" && typeof a.answeredAt?.toMillis === "function") {
                const qIdx = a.qIdx;
                const q = questions[qIdx];
                if (q && a.answer === q.correctAnswer && questionsStart[qIdx]) {
                  const answeredAt = a.answeredAt.toMillis();
                  const timeTaken = Math.max(0, (answeredAt - questionsStart[qIdx]) / 1000);
                  const maxTime = q.time || 30;
                  // Enhanced speed bonus calculation - more weight on speed
                  const speedFactor = Math.max(0, 1 - (timeTaken / maxTime));
                  // Exponential scoring to reward faster answers more significantly
                  const speedBonus = Math.round(1000 * Math.pow(speedFactor, 1.5));
                  const points = 1000 + speedBonus;
                  scores[a.nickname] = (scores[a.nickname] || 0) + points;
                }
              }
            });
            leaderboard = Object.entries(scores)
              .sort((a, b) => b[1] - a[1])
              .map(([nick]) => nick);
              
            console.log("Calculated final scores and leaderboard:", { scores, leaderboard });
            
            // Make sure we have at least some data
            if (leaderboard.length === 0 && players.length > 0) {
              console.log("No scores calculated but we have players. Creating default leaderboard.");
              leaderboard = players;
              players.forEach(player => {
                if (!scores[player]) scores[player] = 0;
              });
            }
            
            // Write to session doc
            try {
              await setDoc(sessionRef, {
                mpScores: scores,
                mpLeaderboard: leaderboard,
                gameFinished: true,
              }, { merge: true });
              console.log("Successfully saved final scores and leaderboard to Firestore");
              
              // Store in localStorage as backup
              if (typeof window !== "undefined") {
                localStorage.setItem("mp_scores", JSON.stringify(scores));
                localStorage.setItem("mp_leaderboard", JSON.stringify(leaderboard));
              }
            } catch (error) {
              console.error("Error saving final scores to Firestore:", error);
            }
          }
        }
      }}
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
      isOrganizer={isOrganizer}
      submitMpAnswer={async (idx: number) => {
        console.log("submitMpAnswer called", { idx, sessionId, nickname, current });
        if (!sessionId || !nickname) {
          console.error("Missing sessionId or nickname", { sessionId, nickname });
          return;
        }
        setMpSelected(idx);
        setMpAnswered(true);
        try {
          // Write answer to Firestore
          const answerRef = doc(db, "sessions", sessionId, "answers", nickname);
          await setDoc(answerRef, {
            qIdx: current,
            answer: idx,
            answeredAt: serverTimestamp(),
          });
          console.log("Answer written to Firestore", { sessionId, nickname, idx, current });
        } catch (err) {
          console.error("Error writing answer to Firestore", err);
        }
      }}
      onQuit={() => navigate(`/play/quiz/${id}/details`)}
    />
  );
}