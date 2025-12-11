import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SinglePlayerSession from "../components/SinglePlayerSession";
import BeatSyncAnimation from "../components/BeatSyncAnimation";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { Helmet } from 'react-helmet-async';
import { fetchQuizWithCache } from "../utils/quizCache";

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
  
  // Music playback state
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [triggerExplosion, setTriggerExplosion] = useState(false);
  const [isAnimationActive, setIsAnimationActive] = useState(false);
  
  // Track explosion state for animation
  useEffect(() => {
    if (triggerExplosion) {
      setIsAnimationActive(true);
      setTimeout(() => {
        setIsAnimationActive(false);
      }, 2000); // Allow 2 seconds for explosion animation
    }
  }, [triggerExplosion]);

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
        
        // Use cached quiz data
        const quizData = await fetchQuizWithCache(id, async () => {
          // Fetch quiz document
          const quizDoc = await getDoc(doc(db, "quizzes", id));
          if (!quizDoc.exists()) {
            throw new Error("Quiz not found");
          }
          
          const quizInfo = quizDoc.data();
          
          // Fetch questions
          const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
          const questionsArr: Question[] = [];
          
          // Fetch questions and answers in batch
          const questionPromises = questionsSnap.docs.map(async (qDoc) => {
            const qData = qDoc.data();
            const answersSnap = await getDocs(collection(db, "quizzes", id, "questions", qDoc.id, "answers"));
            const answersArr: string[] = [];
            
            answersSnap.forEach((aDoc) => {
              const aData = aDoc.data();
              answersArr[aData.index] = aData.answer;
            });
            
            return {
              id: qDoc.id,
              question: qData.question,
              answers: answersArr,
              correctAnswer: qData.correctAnswer,
              image: qData.image,
              time: typeof qData.time === "number" ? qData.time : 30,
            };
          });
          
          const resolvedQuestions = await Promise.all(questionPromises);
          
          return {
            id: quizDoc.id,
            title: quizInfo.title || "Untitled Quiz",
            description: quizInfo.description,
            image: quizInfo.image,
            language: quizInfo.language,
            tags: quizInfo.tags,
            questions: resolvedQuestions,
            createdAt: quizInfo.createdAt,
            updatedAt: quizInfo.updatedAt,
          };
        });
        
        // Set quiz data
        setQuiz({
          id: quizData.id,
          title: quizData.title,
          description: quizData.description,
          image: quizData.image,
          language: quizData.language,
          tags: quizData.tags,
          ...quizData,
        });
        
        // Set questions
        setQuestions(quizData.questions);
        setTimer(quizData.questions[0]?.time || 30);
        
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [id]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio('/TickTockTrivia.mp3');
    audio.loop = true;
    audio.volume = 0.7; // Set initial volume
    setAudioRef(audio);

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  // Fade out and stop music
  const fadeOutAndStopMusic = () => {
    if (!audioRef || !isMusicPlaying) return;
    
    const fadeOut = () => {
      if (audioRef.volume > 0.1) {
        audioRef.volume = Math.max(0, audioRef.volume - 0.1);
        setTimeout(fadeOut, 100);
      } else {
        audioRef.pause();
        audioRef.currentTime = 0;
        audioRef.volume = 0.7; // Reset volume for next time
        setIsMusicPlaying(false);
      }
    };
    fadeOut();
  };

  // Start music playback
  const startMusic = () => {
    if (audioRef && !isMusicPlaying) {
      audioRef.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(error => {
        console.log('Music autoplay prevented:', error);
      });
    }
  };

  // Timer logic with music control
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
          fadeOutAndStopMusic(); // Stop music when timer finishes
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start music when timer begins
    startMusic();

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
      <BeatSyncAnimation
        isActive={timer > 0 && !showAnswer && questions.length > 0}
        timer={timer}
        maxTime={questions[current]?.time || 30}
        audioRef={audioRef}
        intensity={60}
        triggerExplosion={triggerExplosion}
        showExplosion={triggerExplosion}
        onExplosionComplete={() => setTriggerExplosion(false)}
      />
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
        triggerExplosion={triggerExplosion}
        onExplosionComplete={() => setTriggerExplosion(false)}
        onTriggerExplosion={() => setTriggerExplosion(true)}
        onQuit={() => {
          fadeOutAndStopMusic(); // Stop music when quitting
          navigate(`/play/quiz/${id}/details`);
        }}
        onFinish={() => {
          // Store the score and correct answers count in localStorage so ResultsPage can access it
          localStorage.setItem('sp_score', spScore.toString());
          localStorage.setItem('sp_correctAnswers', spCorrectAnswers.toString());
          fadeOutAndStopMusic(); // Stop music when finishing quiz
          navigate(`/play/quiz/${id}/results`);
        }}
      />
    </>
  );
}