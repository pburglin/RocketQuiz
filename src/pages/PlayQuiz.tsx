import React, { useEffect, useState, useRef } from "react";
import ColorCardPlaceholder from "../components/ColorCardPlaceholder";
import { useParams, useNavigate } from "react-router-dom";
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

const PlayQuiz: React.FC<{ user: FirebaseUser | null }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "pre" = quiz details, "single" = single player, "multi-lobby" = multiplayer lobby, "multi-playing" = multiplayer game
  const [gameState, setGameState] = useState<"pre" | "single" | "multi-lobby" | "multi-playing" | "results">("pre");
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
      if (timerRef.current) clearInterval(timerRef.current as NodeJS.Timeout);
    };
    // eslint-disable-next-line
  }, [current, questions]);

  // Create multiplayer session when entering lobby
  useEffect(() => {
    // Only create a new session if there is no session param in the URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (gameState === "multi-lobby" && !sessionId && quiz && !sid) {
      // Organizer creates session
      const newSessionId = uuidv4();
      const sessionRef = doc(collection(db, "sessions"), newSessionId);
      setLobbyLoading(true);
      setDoc(sessionRef, {
        quizId: quiz.id,
        createdAt: serverTimestamp(),
        started: false,
      }).then(async () => {
        setSessionId(newSessionId);
        setIsOrganizer(true);
        const url = `${window.location.origin}/play/quiz/${quiz.id}?session=${newSessionId}`;
        setSessionUrl(url);
        // Automatically add organizer as a player with their nickname
        if (nickname && nickname.trim().length >= 2) {
          const playerRef = doc(db, "sessions", newSessionId, "players", nickname);
          await setDoc(playerRef, {
            joinedAt: serverTimestamp(),
          });
        }
        setLobbyLoading(false);
      });
    }
    // If joining as a player, set the sessionUrl when quiz is loaded
    if (gameState === "multi-lobby" && sessionId && quiz && sid) {
      setSessionUrl(`${window.location.origin}/play/quiz/${quiz.id}?session=${sid}`);
    }
  }, [gameState, sessionId, quiz, nickname]);

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
    nextTimerRef.current = setInterval(() => {
      setNextQuestionTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(nextTimerRef.current as NodeJS.Timeout);
          // Automatically go to next question
          if (current < questions.length - 1) {
            setCurrent((c) => c + 1);
            setShowAnswer(false);
            setSpSelected(null); // Reset single player selection
            setMpShowAnswer(false); // Reset multiplayer state
            setMpAnswered(false);
            setMpSelected(null);
            setMpAllAnswers([]);
          } else {
            setGameState("results"); // Show final results
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
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

  // PRE-GAME: Show quiz details, collapsed questions, and start buttons
  if (gameState === "pre") {
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
        {/* Collapsible Questions */}
        <div className="my-6">
          <button
            className="px-4 py-2 bg-gray-100 rounded border text-gray-700 font-semibold"
            onClick={() => setQuestionsCollapsed((c) => !c)}
          >
            {questionsCollapsed ? "Show Questions (Spoilers!)" : "Hide Questions"}
          </button>
          {!questionsCollapsed && (
            <div className="mt-4 space-y-2">
              {questions.map((q, idx) => (
                <details key={q.id} open={false} className="border rounded p-2">
                  <summary className="font-semibold">
                    Question {idx + 1}
                  </summary>
                  <div className="mt-2">{q.question}</div>
                  {/* Optionally, show answers here if desired */}
                </details>
              ))}
            </div>
          )}
        </div>
        {/* Start Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            className="px-6 py-2 bg-emerald-600 text-white rounded font-bold"
            onClick={() => setGameState("single")}
          >
            Start Single Player
          </button>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded font-bold"
            onClick={() => setGameState("multi-lobby")}
          >
            Start Multiplayer
          </button>
        </div>
        <div className="mt-6">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
            onClick={() => navigate("/search")}
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // SINGLE PLAYER: Show original question/answer UI
  if (gameState === "single") {
    // Single player: handle answer click
    const handleSinglePlayerAnswer = (idx: number) => {
      if (showAnswer) return;
      setSpSelected(idx);
      setShowAnswer(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setNextQuestionTimer(10); // Start 10s countdown
      // Scoring
      if (idx === q.correctAnswer) {
        const base = 100;
        const bonus = Math.floor((timer / q.time) * 100);
        setSpScore((prev) => prev + base + bonus);
      }
    };

    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
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
                      : idx === spSelected
                      ? "bg-red-100 border-gray-200"
                      : "bg-white border-gray-200"
                    : "bg-white border-gray-200 hover:bg-emerald-50"
                }
              `}
              disabled={showAnswer}
              onClick={() => handleSinglePlayerAnswer(idx)}
            >
              {answer}
              {showAnswer && idx === q.correctAnswer && (
                <span className="ml-2 text-green-700 font-bold">(Correct)</span>
              )}
              {showAnswer && idx === spSelected && idx !== q.correctAnswer && (
                <span className="ml-2 text-red-700 font-bold">(Your pick)</span>
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
        {/* Show score after each question */}
        <div className="mb-4 text-center text-blue-700 font-bold">
          Score: {spScore}
        </div>
        <div className="flex justify-between">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
            onClick={() => setGameState("pre")}
          >
            Quit
          </button>
          {showAnswer && current < questions.length - 1 && (
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded"
              onClick={() => {
                setCurrent((c) => c + 1);
                setShowAnswer(false);
                setSpSelected(null);
              }}
            >
              Next {nextQuestionTimer !== null ? `(${nextQuestionTimer}s)` : ""}
            </button>
          )}
          {showAnswer && current === questions.length - 1 && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setGameState("results")}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    );
  }

  // MULTIPLAYER LOBBY: Show multiplayer lobby UI
  if (gameState === "multi-lobby") {
    if (loading || !quiz) {
      return (
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="text-lg text-gray-700">Loading quiz and setting up lobby...</div>
        </div>
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
    if (
      gameState !== "multi-playing" ||
      !sessionId ||
      !questions[current]
    )
      return;
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
    if (mpShowAnswer) return;
    setMpTimer(questions[current]?.time || 0);
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
    if (!mpShowAnswer) return;
    // Calculate scores
    const correctIdx = questions[current]?.correctAnswer;
    let newScores = { ...mpScores };
    mpAllAnswers.forEach((ans) => {
      if (ans.answer === correctIdx) {
        // Base points + speed bonus
        const base = 100;
        const speed = Math.max(0, questions[current]?.time - ans.time);
        const bonus = Math.floor((speed / (questions[current]?.time || 1)) * 100);
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
    // End of quiz
    const isLastQuestion = current === questions.length - 1;

    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
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
        <div className="mb-2 font-bold">{questions[current].question}</div>
        {questions[current].image && questions[current].image.trim() !== "" ? (
          <img
            src={questions[current].image}
            alt={`Question ${current + 1}`}
            className="w-full h-40 object-cover rounded mb-4"
          />
        ) : (
          <ColorCardPlaceholder
            id={questions[current].id}
            text={questions[current].question ? questions[current].question.charAt(0).toUpperCase() : "?"}
            className="w-full h-40 rounded mb-4"
          />
        )}
        <div className="mb-4">
          <span className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
            Time left: {mpTimer} second{mpTimer !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {questions[current].answers.map((answer, idx) => (
            <button
              key={idx}
              className={`w-full px-4 py-2 rounded border text-left transition
                ${
                  mpShowAnswer
                    ? idx === questions[current].correctAnswer
                      ? "bg-green-200 border-green-400 font-bold"
                      : "bg-red-100 border-gray-200"
                    : mpSelected === idx
                    ? "bg-emerald-100 border-emerald-400"
                    : "bg-white border-gray-200 hover:bg-emerald-50"
                }
              `}
              disabled={mpShowAnswer || mpAnswered}
              onClick={() => submitMpAnswer(idx)}
            >
              {answer}
              {mpShowAnswer && idx === questions[current].correctAnswer && (
                <span className="ml-2 text-green-700 font-bold">(Correct)</span>
              )}
            </button>
          ))}
        </div>
        {!mpShowAnswer && (
          <div className="mb-4 text-center text-gray-600">
            Waiting for all players to answer or time to run out...
          </div>
        )}
        {mpShowAnswer && (
          <div className="mb-4 text-center text-green-700 font-semibold">
            Correct answer shown!{" "}
            {isLastQuestion ? "Quiz complete." : "Click Next to continue."}
          </div>
        )}
        {/* Leaderboard */}
        {mpShowAnswer && (
          <div className="mb-6">
            <div className="font-bold mb-2">Leaderboard</div>
            <ul className="list-decimal pl-6">
              {mpLeaderboard.map((nick, i) => (
                <li key={nick} className={nick === nickname ? "font-bold text-emerald-700" : ""}>
                  {nick}: {mpScores[nick] || 0} pts
                  {i === 0 && <span className="ml-2 text-yellow-600 font-bold">🏆</span>}
                  {nick === nickname && " (You)"}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-between">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
            onClick={() => setGameState("pre")}
          >
            Quit
          </button>
          {mpShowAnswer && !isLastQuestion && (
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded"
              onClick={() => {
                setCurrent((c) => c + 1);
                setNextQuestionTimer(null); // Clear timer on manual click
                if (nextTimerRef.current) clearInterval(nextTimerRef.current);
              }}
            >
              Next {nextQuestionTimer !== null ? `(${nextQuestionTimer}s)` : ""}
            </button>
          )}
          {mpShowAnswer && isLastQuestion && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setGameState("results")}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// FINAL RESULTS SCREEN
if (gameState === "results") {
  const isMultiplayer = sessionId !== null; // Check if it was a multiplayer game
  return (
    <div className="max-w-2xl mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Quiz Complete!</h1>
      <h2 className="text-xl font-semibold mb-6">{quiz.title}</h2>

      {isMultiplayer ? (
        <>
          <div className="font-bold mb-2 text-lg">Final Leaderboard</div>
          <ul className="list-decimal pl-6 text-left mb-8">
            {mpLeaderboard.map((nick, i) => (
              <li key={nick} className={nick === nickname ? "font-bold text-emerald-700" : ""}>
                {nick}: {mpScores[nick] || 0} pts
                {i === 0 && <span className="ml-2 text-yellow-600 font-bold">🏆</span>}
                {nick === nickname && " (You)"}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mb-8">
          <div className="font-bold mb-2 text-lg">Your Final Score</div>
          <div className="text-4xl text-blue-700 font-bold">{spScore}</div>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <button
          className="px-6 py-2 bg-emerald-600 text-white rounded font-bold"
          onClick={() => {
            // Reset state for replay
            setCurrent(0);
            setShowAnswer(false);
            setSpScore(0);
            setSpSelected(null);
            setMpScores({});
            setMpLeaderboard([]);
            setNextQuestionTimer(null);
            setGameState("pre");
          }}
        >
          Play Again
        </button>
        <button
          className="px-6 py-2 bg-gray-600 text-white rounded font-bold"
          onClick={() => navigate("/search")}
        >
          Find Another Quiz
        </button>
      </div>
    </div>
  );
}

return null;
}

export default PlayQuiz;