import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MultiplayerSession from "../components/MultiplayerSession";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc, serverTimestamp, updateDoc, addDoc, Timestamp, increment } from "firebase/firestore"; // Import Timestamp and increment
// Define the structure of an answer document
interface AnswerData {
  nickname: string;
  qIdx: number;
  answer: number;
  answeredAt: Timestamp; // Use Timestamp type
  isCorrect: boolean;
  questionStart?: Timestamp | null; // Optional Timestamp
}


export default function MultiplayerGamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
// Define Quiz structure
interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  questionCount: number;
  tags?: string[]; // Add optional tags
  image?: string; // Add optional image
  language?: string; // Add optional language
  // Add other relevant quiz fields if needed
}

// Define Question structure (including answers)
interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  image?: string; // Optional image URL
  time: number;
}

  const [quiz, setQuiz] = useState<Quiz | null>(null); // Use Quiz type
  const [questions, setQuestions] = useState<Question[]>([]); // Use Question type
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
  const [mpAllAnswers, setMpAllAnswers] = useState<AnswerData[]>([]); // Use AnswerData type
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
        setQuiz({ id: quizDoc.id, ...quizDoc.data() } as Quiz); // Cast to Quiz type
      }
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
        // Ensure data matches Question interface
        const questionData: Question = {
          id: qDoc.id,
          question: qData.question,
          answers: answersArr,
          correctAnswer: qData.correctAnswer,
          image: qData.image,
          time: typeof qData.time === "number" ? qData.time : 30,
        };
        questionsArr.push(questionData);
      }
      setQuestions(questionsArr);
      setMpTimer(questionsArr[0]?.time || 30);
      // Organizer initializes currentQuestion and questionStartTimes in Firestore
      if (questionsArr.length > 0 && sessionId && isOrganizer) {
        const sessionRef = doc(db, "sessions", sessionId);
        setDoc(sessionRef, {
          currentQuestion: 0,
          questionStartTimes: { 0: serverTimestamp() },
          questionStart: serverTimestamp() // For backward compatibility
        }, { merge: true });
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
        .map((doc) => doc.data() as AnswerData) // Use AnswerData type
        .filter((a) => typeof a.qIdx === "number" && a.qIdx === current);
      setMpAllAnswers(allAnswers);
      // If all players have answered, show answer and start next question timer
      // Note: We only count actual players, not the organizer if they're not playing
      const activePlayers = isOrganizer && !players.includes(nickname)
        ? players
        : players;
        
      if (
        allAnswers.length === activePlayers.length &&
        activePlayers.length > 0 &&
        !mpShowAnswer
      ) {
        console.log("All players have answered. Showing answers and enabling Next button.");
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current as NodeJS.Timeout);
        }
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
        if (sessionSnap.exists()) {
          const sessionData = sessionSnap.data();
          // First try to get the question start time from questionStartTimes
          if (sessionData.questionStartTimes && sessionData.questionStartTimes[current]?.toMillis) {
            questionStart = sessionData.questionStartTimes[current].toMillis();
          }
          // Fallback to questionStart for backward compatibility
          else if (sessionData.questionStart?.toMillis) {
            questionStart = sessionData.questionStart.toMillis();
          }
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
        // Sort by top score (highest first)
        // Note: Currently we only have access to total scores, not individual question scores
        .sort((a, b) => b[1] - a[1])
        .map(([nick]) => nick);
      setMpLeaderboard(sorted);
    }
    calcScores();
  }, [mpShowAnswer]);

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-lg text-primary">Loading quiz...</div>
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
            [`questionStartTimes.${current + 1}`]: serverTimestamp(),
            questionStart: serverTimestamp() // For backward compatibility
          }, { merge: true });
        } else {
          // Last question - finish the game
          // Fetch all answers for the session
          console.log("Fetching answers for session:", sessionId);
          
          // The structure of answers in Firestore is:
          // sessions/{sessionId}/answers/{nickname}
          // with fields: qIdx, answer, answeredAt
          const answersSnap = await getDocs(collection(db, "sessions", sessionId, "answers"));
          // Map documents to AnswerData type
          const allAnswers: AnswerData[] = answersSnap.docs.map((doc) => {
            return doc.data() as AnswerData; // Cast data to our defined type
          });
          
          console.log("Retrieved answers:", allAnswers);
          
          // Fetch session for questionStart times
          const sessionRef = doc(db, "sessions", sessionId);
          const sessionSnap = await getDoc(sessionRef);
          const scores: { [nickname: string]: number } = {}; // Use const
          let leaderboard: string[] = [];
          if (sessionSnap.exists()) {
            // For each question, get questionStart
            const sessionData = sessionSnap.data();
            const questionsStart: { [qIdx: number]: number } = {};
            // Check both field names for backward compatibility
            if (sessionData.questionStartTimes) {
              Object.entries(sessionData.questionStartTimes).forEach(([qIdx, ts]) => { // Remove explicit type annotation
                if (ts && typeof (ts as Timestamp).toMillis === 'function') { // Check if ts is a Timestamp
                  questionsStart[Number(qIdx)] = (ts as Timestamp).toMillis();
                }
              });
            } else if (sessionData.questionStarts) {
              Object.entries(sessionData.questionStarts).forEach(([qIdx, ts]) => { // Remove explicit type annotation
                 if (ts && typeof (ts as Timestamp).toMillis === 'function') { // Check if ts is a Timestamp
                   questionsStart[Number(qIdx)] = (ts as Timestamp).toMillis();
                 }
              });
            }
            // Calculate scores
            console.log("Calculating scores for questions:", questions);
            
            // Initialize scores for all players
            players.forEach(player => {
              scores[player] = 0;
            });
            
            // Process each answer
            allAnswers.forEach((a: AnswerData) => { // Use AnswerData type for 'a'
              console.log("Processing answer:", a);
              
              // For each question the player answered
              if (typeof a.qIdx === "number" && typeof a.answer === "number") {
                const qIdx = a.qIdx;
                const q = questions[qIdx];
                
                console.log(`Question ${qIdx}:`, q);
                console.log(`Player answer: ${a.answer}, Correct answer: ${q?.correctAnswer}`);
                
                // Award points for correct answers
                if (q && a.answer === q.correctAnswer) {
                  // Base points for correct answer
                  let points = 1000;
                  
                  // Add speed bonus if timing data is available
                  // First try to use the question start time from the answer object
                  let questionStartTime = null;
                  if (a.questionStart && typeof a.questionStart.toMillis === "function") {
                    questionStartTime = a.questionStart.toMillis();
                  }
                  // Fallback to the question start time from the session document
                  else if (questionsStart[qIdx]) {
                    questionStartTime = questionsStart[qIdx];
                  }
                  
                  if (typeof a.answeredAt?.toMillis === "function" && questionStartTime) {
                    const answeredAt = a.answeredAt.toMillis();
                    const timeTaken = Math.max(0, (answeredAt - questionStartTime) / 1000);
                    const maxTime = q.time || 30;
                    
                    // Enhanced speed bonus calculation - more weight on speed
                    const speedFactor = Math.max(0, 1 - (timeTaken / maxTime));
                    // Exponential scoring to reward faster answers more significantly
                    const speedBonus = Math.round(1000 * Math.pow(speedFactor, 1.5));
                    points += speedBonus;
                    
                    console.log(`Awarded ${points} points (1000 base + ${speedBonus} speed bonus) to ${a.nickname}`);
                  } else {
                    console.log(`Awarded ${points} points (no speed bonus) to ${a.nickname}`);
                  }
                  
                  scores[a.nickname] = (scores[a.nickname] || 0) + points;
                } else {
                  console.log(`No points awarded to ${a.nickname} for question ${qIdx}`);
                }
              }
            });
            
            console.log("Final calculated scores:", scores);
            leaderboard = Object.entries(scores)
              // Sort by top score (highest first)
              // Note: Currently we only have access to total scores, not individual question scores
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

            // --- BEGIN: Update Quiz Statistics ---
            if (quiz?.id) {
              const quizRef = doc(db, "quizzes", quiz.id);
              try {
                const currentQuizSnap = await getDoc(quizRef);
                const currentQuizData = currentQuizSnap.data();
                const currentMaxPlayers = currentQuizData?.maxUsersPerSession || 0;
                const sessionPlayerCount = players.length; // Number of players in this session

                await updateDoc(quizRef, {
                  totalPlays: increment(1),
                  totalPlayerCountSum: increment(sessionPlayerCount), // Add current session players to sum
                  maxUsersPerSession: Math.max(currentMaxPlayers, sessionPlayerCount),
                  lastPlayedAt: serverTimestamp(),
                });
                console.log("Successfully updated quiz statistics:", quiz.id);
              } catch (error) {
                console.error("Error updating quiz statistics:", error);
              }
            }
            // --- END: Update Quiz Statistics ---
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
          // Get the current question
          const q = questions[current];
          const isCorrect = q && idx === q.correctAnswer;
          
          // Get the question start time from the session document
          const sessionRef = doc(db, "sessions", sessionId);
          const sessionSnap = await getDoc(sessionRef);
          let questionStart = null;
          
          if (sessionSnap.exists()) {
            const sessionData = sessionSnap.data();
            // Try both field names for backward compatibility
            if (sessionData.questionStartTimes && sessionData.questionStartTimes[current]) {
              questionStart = sessionData.questionStartTimes[current];
            } else if (sessionData.questionStarts && sessionData.questionStarts[current]) {
              questionStart = sessionData.questionStarts[current];
            } else if (sessionData.questionStart) {
              questionStart = sessionData.questionStart;
            }
          }
          
          // Write answer to Firestore
          // Create a reference to the 'answers' subcollection
          const answersCollectionRef = collection(db, "sessions", sessionId, "answers");
          // Add a new document for this answer, including the nickname
          await addDoc(answersCollectionRef, {
            nickname: nickname, // Store the nickname within the answer document
            qIdx: current,
            answer: idx,
            answeredAt: serverTimestamp(),
            isCorrect: isCorrect,
            questionStart: questionStart // Include the question start time
          });
          
          console.log("Answer written to Firestore", {
            sessionId,
            nickname,
            idx,
            current,
            isCorrect,
            correctAnswer: q?.correctAnswer,
            questionStart: questionStart
          });
          
          // Update running score in session document
          if (isCorrect) {
            // We'll calculate the actual score when all questions are answered
            // This is just to keep track of correct answers
            await updateDoc(sessionRef, {
              [`playerCorrectAnswers.${nickname}.${current}`]: true
            });
          }
        } catch (err) {
          console.error("Error writing answer to Firestore", err);
        }
      }}
      onQuit={() => navigate(`/play/quiz/${id}/details`)}
    />
  );
}