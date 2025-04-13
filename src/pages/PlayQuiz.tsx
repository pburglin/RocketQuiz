import React, { useEffect, useState, useRef } from "react";
import ColorCardPlaceholder from "../components/ColorCardPlaceholder";
import QuizDetails from "../components/QuizDetails";
import Leaderboard from "../components/Leaderboard";
import { useParams, useNavigate } from "react-router-dom";
import MultiplayerSession from "../components/MultiplayerSession";
import MultiplayerLobby from "../components/MultiplayerLobby";
import SinglePlayerSession from "../components/SinglePlayerSession";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs, setDoc, onSnapshot, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
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

// Memoize Leaderboard outside the component
const MemoizedLeaderboard = React.memo(Leaderboard);

const PlayQuiz: React.FC<{ user: FirebaseUser | null }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "pre" = quiz details, "single" = single player, "multi-lobby" = multiplayer lobby, "multi-playing" = multiplayer game
  const [gameState, setGameState] = useState<"pre" | "single" | "multi-lobby" | "multi-playing" | "results">("pre");
  const [quizFinished, setQuizFinished] = useState(false); // New state for transition
  console.log("[PlayQuiz] Render, gameState:", gameState);
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Single player scoring
  const [spScore, setSpScore] = useState(0);
  const [spSelected, setSpSelected] = useState<number | null>(null);

  // Countdown for next question
  const [nextQuestionTimer, setNextQuestionTimer] = useState<number | null>(null);

  // Collapsed state for questions
  const [questionsCollapsed, setQuestionsCollapsed] = useState(true);

  // Multiplayer session state

  // Multiplayer game state (must be at top level for React hooks)
  const [mpShowAnswer, setMpShowAnswer] = useState(false);
  const [mpTimer, setMpTimer] = useState(0);
  const [mpAnswered, setMpAnswered] = useState(false);
  const [mpAllAnswers, setMpAllAnswers] = useState<any[]>([]);
  const [mpScores, setMpScores] = useState<{ [nickname: string]: number }>({});
  const [mpLeaderboard, setMpLeaderboard] = useState<string[]>([]);
  const [mpSelected, setMpSelected] = useState<number | null>(null);

  // Helper for multiplayer answer submission
  const submitMpAnswer = async (idx: number) => {
    if (!sessionId || !questions[current] || mpAnswered) return;
    setMpAnswered(true);
    setMpSelected(idx);
    const answersRef = doc(db, "sessions", sessionId, "answers", questions[current].id, "responses", nickname);
    await setDoc(answersRef, {
      answer: idx,
      time: questions[current].time - mpTimer,
      submittedAt: serverTimestamp(),
    });
  };
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  const [lobbyLoading, setLobbyLoading] = useState<boolean>(false);

  // On mount, check for session param and set gameState/sessionId if present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (sid) {
      setGameState("multi-lobby");
      setSessionId(sid);
      setIsOrganizer(false);
    }
  }, []);

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
          setNextQuestionTimer(10); // Start 10s countdown
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup interval if question changes or on unmount
    return () => {
      console.log("[PlayQuiz] Cleanup single player timer effect");
      if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);
    };
    // eslint-disable-next-line
  }, [current, questions]);

  // Create multiplayer session when entering lobby
  // Create multiplayer session / Set session URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");

    // Organizer enters lobby: Create session if needed
    // Check isOrganizer flag which should be set by the button click
    if (gameState === "multi-lobby" && !sid && !sessionId && quiz && isOrganizer) {
      const newSessionId = uuidv4();
      const sessionRef = doc(collection(db, "sessions"), newSessionId);
      setLobbyLoading(true);
      // Create the session document
      setDoc(sessionRef, {
        quizId: quiz.id,
        createdAt: serverTimestamp(),
        started: false,
      }).then(() => {
        // Update state after session is created
        setSessionId(newSessionId);
        const url = `${window.location.origin}/play/quiz/${quiz.id}?session=${newSessionId}`;
        setSessionUrl(url);
        setLobbyLoading(false);
        // Organizer still needs to enter nickname and click Join
      });
    }

    // Player joins via URL: Set session URL when quiz is loaded
    // Check !isOrganizer flag which should be false if joined via URL
    if (gameState === "multi-lobby" && sid && quiz && !isOrganizer) {
      // sessionId is already set by the mount effect
      setSessionUrl(`${window.location.origin}/play/quiz/${quiz.id}?session=${sid}`);
    }
    // Removed nickname from dependency array, added isOrganizer
  }, [gameState, sessionId, quiz, isOrganizer]);

  // Listen for players joining the session
  useEffect(() => {
    if (sessionId && gameState === "multi-lobby") {
      const playersRef = collection(db, "sessions", sessionId, "players");
      const unsub = onSnapshot(playersRef, (snap) => {
        setPlayers(snap.docs.map((doc) => doc.id));
      });
      return () => unsub();
    }
  }, [sessionId, gameState]);

  // Countdown timer for next question
  useEffect(() => {
    if (nextQuestionTimer === null || nextQuestionTimer <= 0) {
      if (nextTimerRef.current) clearInterval(nextTimerRef.current);
      return;
    }
    let cancelled = false;
    nextTimerRef.current = setInterval(() => {
      setNextQuestionTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(nextTimerRef.current as NodeJS.Timeout);
          // Automatically go to next question
          if (!cancelled) {
            if (current < questions.length - 1) {
              setCurrent((c) => c + 1);
              setShowAnswer(false);
              setSpSelected(null); // Reset single player selection
              setMpShowAnswer(false); // Reset multiplayer state
              setMpAnswered(false);
              setMpSelected(null);
              setMpAllAnswers([]);
            } else {
              setTimeout(() => setGameState("results"), 0); // Show final results asynchronously
            }
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      cancelled = true;
      console.log("[PlayQuiz] Cleanup next question timer effect");
      if (nextTimerRef.current) clearInterval(nextTimerRef.current);
    };
  }, [nextQuestionTimer, current, questions.length]);

  // Reset next question timer when question changes
  useEffect(() => {
    setNextQuestionTimer(null);
    if (nextTimerRef.current) clearInterval(nextTimerRef.current);
  }, [current]);

  // Listen for session start
  useEffect(() => {
    if (sessionId && gameState === "multi-lobby") {
      const sessionRef = doc(db, "sessions", sessionId);
      const unsub = onSnapshot(sessionRef, (snap) => {
        const data = snap.data();
        if (data && data.started) {
          setGameState("multi-playing");
        }
      });
      return () => unsub();
    }
  }, [sessionId, gameState]);

  // Effect to handle transition to results state
  useEffect(() => {
    if (quizFinished) {
      console.log("[PlayQuiz] quizFinished is true, setting gameState to results");
      setGameState("results");
      setQuizFinished(false); // Reset the flag
    }
  }, [quizFinished]);

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

  // Do not define q here; define it inside each render block as needed

  // PRE-GAME: Show quiz details, collapsed questions, and start buttons
  if (gameState === "pre") {
    console.log("[PlayQuiz] Render block: pre");
    return (
      <QuizDetails
        quiz={quiz}
        questions={questions}
        questionsCollapsed={questionsCollapsed}
        setQuestionsCollapsed={setQuestionsCollapsed}
        onStartSinglePlayer={() => {
          console.log("[PlayQuiz] onStartSinglePlayer");
          setGameState("single");
        }}
        onStartMultiplayer={() => {
          console.log("[PlayQuiz] onStartMultiplayer");
          setTimeout(() => {
            setIsOrganizer(true);
            setGameState("multi-lobby");
          }, 0);
        }}
        onBackToSearch={() => {
          console.log("[PlayQuiz] onBackToSearch");
          navigate("/search");
        }}
      />
    );
  }

  // SINGLE PLAYER: Show original question/answer UI
  if (gameState === "single") {
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
        onQuit={() => setGameState("pre")}
        onFinish={() => {
          console.log("[PlayQuiz] onFinish triggered (from SinglePlayerSession)");
          setQuizFinished(true); // Set flag instead of direct state change
        }}
      />
    );

  // MULTIPLAYER LOBBY: Show multiplayer lobby UI
  if (gameState === "multi-lobby") {
    console.log("[PlayQuiz] Render block: multi-lobby");
    return (
      <MultiplayerLobby
        quiz={quiz}
        sessionId={sessionId}
        sessionUrl={sessionUrl}
        nickname={nickname}
        setNickname={setNickname}
        nicknameError={nicknameError}
        setNicknameError={setNicknameError}
        players={players}
        isOrganizer={isOrganizer}
        lobbyLoading={lobbyLoading}
        setLobbyLoading={setLobbyLoading}
        setSessionId={setSessionId}
        setSessionUrl={setSessionUrl}
        setPlayers={setPlayers}
        setIsOrganizer={setIsOrganizer}
        setGameState={setGameState}
        onBackToQuizDetails={() => {
          console.log("[PlayQuiz] onBackToQuizDetails (multi-lobby)");
          setGameState("pre");
          setSessionId(null);
          setPlayers([]);
          setNickname("");
          setIsOrganizer(false);
        }}
      />
    );
  }
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <div className="mb-4 text-gray-600">Multiplayer Lobby</div>
        {lobbyLoading ? (
          <div className="text-lg text-gray-700">Setting up session...</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="font-semibold">Session URL:</div>
              <div className="flex items-center gap-2">
                <input
                  className="w-full px-2 py-1 border rounded"
                  value={sessionUrl}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
                <button
                  className="px-2 py-1 bg-gray-200 rounded"
                  onClick={() => {
                    navigator.clipboard.writeText(sessionUrl);
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="mb-4 flex flex-col items-center">
              <QRCode value={sessionUrl} size={128} />
              <div className="text-xs text-gray-500 mt-2">Scan to join</div>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Enter your nickname to join:</div>
              <input
                className="px-2 py-1 border rounded w-full"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                disabled={players.includes(nickname)}
              />
              <button
                className="mt-2 px-4 py-1 bg-emerald-600 text-white rounded"
                disabled={
                  !nickname ||
                  players.includes(nickname) ||
                  nickname.trim().length < 2
                }
                onClick={async () => {
                  if (!nickname || players.includes(nickname)) {
                    setNicknameError("Nickname must be unique and at least 2 characters.");
                    return;
                  }
                  setNicknameError(null);
                  const playerRef = doc(db, "sessions", sessionId!, "players", nickname);
                  await setDoc(playerRef, {
                    joinedAt: serverTimestamp(),
                  });
                }}
              >
                Join
              </button>
              {nicknameError && (
                <div className="text-red-600 text-sm mt-1">{nicknameError}</div>
              )}
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Players in lobby:</div>
              <ul className="list-disc pl-6">
                {players.map((p) => (
                  <li key={p} className={p === nickname ? "font-bold text-emerald-700 flex items-center" : "flex items-center"}>
                    <span>{p}</span>
                    {isOrganizer && p === nickname && <span> (You, Organizer)</span>}
                    {!isOrganizer && p === nickname && <span> (You)</span>}
                    {isOrganizer && p !== nickname && (
                      <button
                        className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded text-xs"
                        onClick={async () => {
                          if (sessionId) {
                            const playerRef = doc(db, "sessions", sessionId, "players", p);
                            await deleteDoc(playerRef);
                          }
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {isOrganizer && (
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded font-bold"
                disabled={players.length < 2}
                onClick={async () => {
                  // Set started flag in session
                  const sessionRef = doc(db, "sessions", sessionId!);
                  await updateDoc(sessionRef, { started: true });
                }}
              >
                Start Game
              </button>
            )}
            <div className="mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
                onClick={() => {
                  setGameState("pre");
                  setSessionId(null);
                  setPlayers([]);
                  setNickname("");
                  setIsOrganizer(false);
                }}
              >
                Back to Quiz Details
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Listen for answers for this question (multiplayer)
  useEffect(() => {
    if (gameState !== "multi-playing" || !sessionId || !questions[current]) return;
    const answersRef = collection(
      db,
      "sessions",
      sessionId,
      "answers",
      questions[current].id,
      "responses"
    );
    const unsub = onSnapshot(answersRef, (snap) => {
      const all = snap.docs.map((doc) => ({ ...doc.data(), nickname: doc.id }));
      setMpAllAnswers(all);
      // If all players have answered, show answer
      if (all.length === players.length) {
        setMpShowAnswer(true);
        setNextQuestionTimer(10); // Start 10s countdown
      }
    });
    return () => unsub();
    // eslint-disable-next-line
  }, [gameState, sessionId, current, questions, players.length]);

  // Timer for multiplayer
  useEffect(() => {
    if (gameState !== "multi-playing") return;
    if (mpShowAnswer || !questions[current]) return;
    setMpTimer(questions[current].time);
    const interval = setInterval(() => {
      setMpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setMpShowAnswer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [gameState, current, questions, mpShowAnswer]);

  // Calculate scores after each question
  useEffect(() => {
    if (gameState !== "multi-playing") return;
    if (!mpShowAnswer || !questions[current]) return;
    // Calculate scores
    const correctIdx = questions[current].correctAnswer;
    let newScores = { ...mpScores };
    mpAllAnswers.forEach((ans) => {
      if (ans.answer === correctIdx) {
        // Base points + speed bonus
        const base = 100;
        const speed = Math.max(0, questions[current].time - ans.time);
        const bonus = Math.floor((speed / questions[current].time) * 100);
        newScores[ans.nickname] = (newScores[ans.nickname] || 0) + base + bonus;
      }
    });
    setMpScores(newScores);
    // Sort leaderboard
    const sorted = Object.entries(newScores)
      .sort((a, b) => b[1] - a[1])
      .map(([nick]) => nick);
    setMpLeaderboard(sorted);
    // eslint-disable-next-line
  }, [gameState, mpShowAnswer]);

  // Reset state for next question
  useEffect(() => {
    if (gameState !== "multi-playing") return;
    setMpShowAnswer(false);
    setMpAnswered(false);
    setMpSelected(null);
    setMpAllAnswers([]);
    // eslint-disable-next-line
  }, [gameState, current]);

  // MULTIPLAYER GAME: Show multiplayer question/answer UI and leaderboard
  if (gameState === "multi-playing") {
    console.log("[PlayQuiz] Render block: multi-playing");
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
        submitMpAnswer={submitMpAnswer}
        onQuit={() => {
          console.log("[PlayQuiz] onQuit (multi-playing)");
          setGameState("pre");
        }}
        onFinish={() => {
          console.log("[PlayQuiz] onFinish (multi-playing)");
          setQuizFinished(true); // Set flag instead of direct state change
        }}
      />
    );
  }
  // FINAL RESULTS SCREEN
  if (gameState === "results") {
    const isMultiplayer = sessionId !== null;
    return (
      <MemoizedLeaderboard
        key={`results-${Date.now()}`}
        quiz={quiz}
        isMultiplayer={isMultiplayer}
        mpLeaderboard={mpLeaderboard}
        mpScores={mpScores}
        nickname={nickname}
        spScore={spScore}
        onPlayAgain={() => {
          setCurrent(0);
          setShowAnswer(false);
          setSpScore(0);
          setSpSelected(null);
          setMpScores({});
          setMpLeaderboard([]);
          setNextQuestionTimer(null);
          setGameState("pre");
        }}
        onFindAnotherQuiz={() => navigate("/search")}
      />
    );
  }

  return null;
}

export default PlayQuiz;