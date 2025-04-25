import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseClient";
import { collection, doc, getDoc, getDocs, DocumentData } from "firebase/firestore";

// Define interfaces for better type safety
interface Quiz {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  popularity?: number;
  language: string;
  averageRating?: number;
  ratingCount?: number;
  questionCount?: number;
  [key: string]: unknown; // Allow other potential fields
}

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number; // Assuming correctAnswer is the index
  image?: string;
  time: number; // Time limit for the question
  // TODO: Add field for historical accuracy data if available
}

// Money tree structure: [question_index]: prize_value
const moneyTree: { [key: number]: number } = {
  0: 100,
  1: 200,
  2: 300,
  3: 500,
  4: 1000, // Safe Haven 1
  5: 2000,
  6: 4000,
  7: 8000,
  8: 16000,
  9: 32000, // Safe Haven 2
  10: 64000,
  11: 125000,
  12: 250000,
  13: 500000,
  14: 1000000, // Top Prize
};

const safeHavens = [4, 9]; // Indices of safe haven questions (0-based)

export default function MillionaireChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [visibleAnswers, setVisibleAnswers] = useState<number[]>([]); // For 50:50
  const [phoneAFriendSuggestion, setPhoneAFriendSuggestion] = useState<string | null>(null); // For Phone a Friend
  const [audiencePollResults, setAudiencePollResults] = useState<number[] | null>(null); // For Ask the Audience
  const [answerStatus, setAnswerStatus] = useState<('idle' | 'correct' | 'incorrect')[]>([]); // For visual feedback


  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [earnedMoney, setEarnedMoney] = useState(0);
  const [safeHavenMoney, setSafeHavenMoney] = useState(0);
  const [lifelines, setLifelines] = useState({
    fiftyFifty: true,
    phoneAFriend: true,
    askTheAudience: true,
  });
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOutcome, setGameOutcome] = useState<"win" | "loss" | "walkaway" | null>(null);


  useEffect(() => {
    async function fetchQuizData() {
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
        const quizData = quizDoc.data() as DocumentData;
        setQuiz({
          id: quizDoc.id,
          ...quizData,
        } as Quiz);

        const questionsSnap = await getDocs(collection(db, "quizzes", id, "questions"));
        const questionDocs = questionsSnap.docs;

        const answerPromises = questionDocs.map(qDoc =>
          getDocs(collection(db, "quizzes", id, "questions", qDoc.id, "answers"))
        );

        const answerSnapshots = await Promise.all(answerPromises);

        const questionsArr = questionDocs.map((qDoc, index) => {
          const qData = qDoc.data();
          const answersSnap = answerSnapshots[index];
          const answersArr: string[] = [];
          answersSnap.forEach((aDoc) => {
            const aData = aDoc.data();
            if (aData.index >= answersArr.length) {
              answersArr.length = aData.index + 1;
            }
            answersArr[aData.index] = aData.answer;
          });
          for (let i = 0; i < answersArr.length; i++) {
            if (answersArr[i] === undefined) answersArr[i] = "";
          }

          return {
            id: qDoc.id,
            question: qData.question,
            answers: answersArr,
            correctAnswer: qData.correctAnswer,
            image: qData.image,
            time: typeof qData.time === "number" ? qData.time : 30,
          };
        });

        // TODO: Implement question ordering based on historical accuracy
        // For now, using questions as fetched and shuffling them
        const shuffledQuestions = questionsArr.sort(() => Math.random() - 0.5); // Simple shuffle for now
        setQuestions(shuffledQuestions);

      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuizData();
  }, [id]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (isTimerRunning && timer === 0) {
      // Time's up! Handle as incorrect answer
      setIsTimerRunning(false);
      handleAnswer(-1); // Use -1 to indicate time out
       // TODO: Play audio feedback for time out
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer]);

  // Start timer when question index changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      setTimer(questions[currentQuestionIndex].time);
      setIsTimerRunning(true);
      // Reset lifeline and answer status states for the new question
      setVisibleAnswers(questions[currentQuestionIndex].answers.map((_, index) => index)); // Show all answers initially
      setPhoneAFriendSuggestion(null);
      setAudiencePollResults(null);
      setAnswerStatus(questions[currentQuestionIndex].answers.map(() => 'idle')); // Reset answer status
    } else if (currentQuestionIndex === questions.length && questions.length > 0) {
      // All questions answered correctly
      setGameOutcome("win");
      setGameOver(true);
      setIsTimerRunning(false);
      setEarnedMoney(moneyTree[questions.length - 1]); // Award top prize
       // TODO: Play audio feedback for win
    }
  }, [currentQuestionIndex, questions]);


  const handleAnswer = (answerIndex: number) => {
    if (gameOver || !isTimerRunning) return; // Prevent answering if game is over or timer not running

    setIsTimerRunning(false); // Stop timer on answer

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerIndex = currentQuestion.correctAnswer;

    // Update answer status for visual feedback
    const newAnswerStatus: ('idle' | 'correct' | 'incorrect')[] = questions[currentQuestionIndex].answers.map((_, index) => {
      if (index === correctAnswerIndex) return 'correct';
      if (index === answerIndex && answerIndex !== correctAnswerIndex) return 'incorrect';
      return 'idle';
    });
    setAnswerStatus(newAnswerStatus);

    // TODO: Play audio feedback for correct/incorrect answer

    // Delay progression or game over to allow user to see feedback
    setTimeout(() => {
      if (answerIndex === correctAnswerIndex) {
        // Correct answer
        const nextQuestionIndex = currentQuestionIndex + 1;
        const currentPrize = moneyTree[currentQuestionIndex];
        setEarnedMoney(currentPrize);

        // Update safe haven money if a safe haven is reached
        if (safeHavens.includes(currentQuestionIndex)) {
          setSafeHavenMoney(currentPrize);
        }

        if (nextQuestionIndex < questions.length) {
          setCurrentQuestionIndex(nextQuestionIndex);
          // Timer will restart via useEffect when currentQuestionIndex changes
        } else {
          // Game won
          setGameOutcome("win");
          setGameOver(true);
          setEarnedMoney(moneyTree[questions.length - 1]); // Award top prize
           // TODO: Play audio feedback for win
        }
      } else {
        // Incorrect answer or time out
        setGameOutcome("loss");
        setGameOver(true);
        // Earned money is already set to the last safe haven reached (or 0)
         // TODO: Play audio feedback for loss
      }
    }, 2000); // Delay for 2 seconds to show feedback
  };

  const handleWalkAway = () => {
    if (gameOver || !isTimerRunning) return; // Prevent walking away if game is over or timer not running

    setIsTimerRunning(false);
    setGameOutcome("walkaway");
    setGameOver(true);
    // Earned money is already set to the prize of the last correctly answered question
     // TODO: Play audio feedback for walk away
  };

  const useLifeline = (lifelineType: keyof typeof lifelines) => {
    if (gameOver || !isTimerRunning || !lifelines[lifelineType]) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerIndex = currentQuestion.correctAnswer;
    const allAnswerIndices = currentQuestion.answers.map((_, index) => index);

    // TODO: Play audio feedback for lifeline usage

    switch (lifelineType) {
      case "fiftyFifty":
        // Remove two incorrect answers
        const incorrectAnswers = allAnswerIndices.filter(
          (index) => index !== correctAnswerIndex
        );
        const answersToRemove = incorrectAnswers.sort(() => Math.random() - 0.5).slice(0, 2);
        const remainingAnswers = allAnswerIndices.filter(
          (index) => !answersToRemove.includes(index)
        );
        setVisibleAnswers(remainingAnswers);
        break;
      case "phoneAFriend":
        // Simulate Phone a Friend - high probability of correct answer with confidence level
        const isCorrectSuggestion = Math.random() < 0.85; // 85% chance of correct suggestion
        const suggestedAnswerIndex = isCorrectSuggestion ? correctAnswerIndex : incorrectAnswers[Math.floor(Math.random() * incorrectAnswers.length)];
        const confidence = isCorrectSuggestion ? Math.floor(Math.random() * (95 - 70) + 70) : Math.floor(Math.random() * (60 - 30) + 30); // Higher confidence for correct
        setPhoneAFriendSuggestion(`I think the answer is ${String.fromCharCode(65 + suggestedAnswerIndex)}. I'm ${confidence}% sure.`);
        break;
      case "askTheAudience":
        // Simulate Ask the Audience - heavily weighted towards correct answer, with some variation
        const audienceVotes = allAnswerIndices.map((index) => {
          if (index === correctAnswerIndex) {
            return Math.floor(Math.random() * (60 - 40) + 40); // 40-60% for correct answer
          } else {
            return Math.floor(Math.random() * 25); // 0-25% for incorrect answers
          }
        });
        // Normalize to 100%
        const totalVotes = audienceVotes.reduce((sum, vote) => sum + vote, 0);
        const normalizedVotes = audienceVotes.map(vote => Math.round((vote / totalVotes) * 100));
        // Adjust if normalization didn't result in exactly 100 due to rounding
        const currentTotalVotes = normalizedVotes.reduce((sum, vote) => sum + vote, 0);
        if (currentTotalVotes !== 100) {
            normalizedVotes[correctAnswerIndex] += (100 - currentTotalVotes);
        }
        setAudiencePollResults(normalizedVotes);
        break;
    }

    // Disable the used lifeline
    setLifelines((prevLifelines) => ({
      ...prevLifelines,
      [lifelineType]: false,
    }));
  };


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

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionValue = moneyTree[currentQuestionIndex];


  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-primary text-center">Millionaire Challenge</h1>

      {gameOver ? (
        <div className="text-center mt-8">
          {gameOutcome === "win" && (
            <h2 className="text-3xl font-bold text-success mb-4">Congratulations! You won ${earnedMoney.toLocaleString()}!</h2>
          )}
          {gameOutcome === "loss" && (
            <h2 className="text-3xl font-bold text-error mb-4">Game Over! You earned ${earnedMoney.toLocaleString()}.</h2>
          )}
           {gameOutcome === "walkaway" && (
            <h2 className="text-3xl font-bold text-warning mb-4">You walked away with ${earnedMoney.toLocaleString()}.</h2>
          )}
          <button
            className="mt-4 px-6 py-3 bg-primary text-white rounded font-bold hover:bg-accent transition"
            onClick={() => navigate(`/play/quiz/${id}/details`)}
          >
            Back to Quiz Details
          </button>
        </div>
      ) : (
        <>
          {/* Money Tree and Lifelines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Money Tree */}
            <div className="md:col-span-2 border rounded p-4 bg-base-200">
              <h3 className="text-lg font-semibold mb-2 text-primary">Money Tree</h3>
              <p>Current Question Value: ${currentQuestionValue?.toLocaleString()}</p>
              <p>Guaranteed Winnings (Safe Haven): ${safeHavenMoney.toLocaleString()}</p>
              {/* Visual Money Tree */}
              <div className="mt-4 space-y-1">
                {Object.entries(moneyTree).reverse().map(([index, value]) => {
                  const questionIndex = parseInt(index);
                  const isCurrent = questionIndex === currentQuestionIndex;
                  const isSafeHaven = safeHavens.includes(questionIndex);
                  const isEarned = questionIndex < currentQuestionIndex;

                  return (
                    <div
                      key={index}
                      className={`flex justify-between p-2 rounded ${isCurrent ? 'bg-accent text-white font-bold' : isSafeHaven ? 'bg-success text-white font-bold' : isEarned ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
                    >
                      <span>Question {questionIndex + 1}</span>
                      <span>${value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lifelines */}
            <div className="border rounded p-4 bg-base-200">
              <h3 className="text-lg font-semibold mb-2 text-primary">Lifelines</h3>
              <div className="flex flex-col gap-2">
                <button
                  className={`px-4 py-2 rounded font-bold ${lifelines.fiftyFifty ? 'bg-info text-white hover:bg-info-focus' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                  onClick={() => useLifeline("fiftyFifty")}
                  disabled={!lifelines.fiftyFifty || !isTimerRunning || gameOver}
                >
                  50:50
                </button>
                <button
                   className={`px-4 py-2 rounded font-bold ${lifelines.phoneAFriend ? 'bg-info text-white hover:bg-info-focus' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                  onClick={() => useLifeline("phoneAFriend")}
                  disabled={!lifelines.phoneAFriend || !isTimerRunning || gameOver}
                >
                  Phone a Friend
                </button>
                <button
                   className={`px-4 py-2 rounded font-bold ${lifelines.askTheAudience ? 'bg-info text-white hover:bg-info-focus' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                  onClick={() => useLifeline("askTheAudience")}
                  disabled={!lifelines.askTheAudience || !isTimerRunning || gameOver}
                >
                  Ask the Audience
                </button>
              </div>
            </div>
          </div>

          {/* Question and Timer */}
          <div className="border rounded p-6 bg-white shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-secondary">Question {currentQuestionIndex + 1}</h2>
              {/* Timer Display */}
              <div className={`text-2xl font-bold ${timer <= 10 && isTimerRunning ? 'text-error animate-pulse' : 'text-primary'}`}>
                {timer}s
              </div>
            </div>
            <p className="text-lg mb-6">{currentQuestion?.question}</p>

            {/* Answers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion?.answers.map((answer, index) => (
                // Conditionally render answer button based on visibleAnswers state and apply status styles
                visibleAnswers.includes(index) && (
                  <button
                    key={index}
                    className={`px-4 py-3 border rounded text-left font-semibold transition
                       ${answerStatus[index] === 'correct' ? 'bg-success text-white' :
                        answerStatus[index] === 'incorrect' ? 'bg-error text-white' :
                        'hover:bg-base-200'}
                     `}
                    onClick={() => handleAnswer(index)}
                    disabled={!isTimerRunning || gameOver || answerStatus[index] !== 'idle'} // Disable if timer not running, game over, or status is not idle
                  >
                    {String.fromCharCode(65 + index)}. {answer}
                  </button>
                )
              ))}
            </div>

            {/* Lifeline Results Display */}
            {phoneAFriendSuggestion && (
              <div className="mt-4 p-3 bg-info-content text-info rounded">
                <h4 className="font-semibold mb-2">Phone a Friend:</h4>
                <p>{phoneAFriendSuggestion}</p>
              </div>
            )}
            {audiencePollResults && (
              <div className="mt-4 p-3 bg-info-content text-info rounded">
                <h4 className="font-semibold mb-2">Audience Poll Results:</h4>
                <ul>
                  {audiencePollResults.map((percentage, index) => (
                     visibleAnswers.includes(index) && ( // Only show results for visible answers
                        <li key={index}>{String.fromCharCode(65 + index)}: {percentage}%</li>
                     )
                   ))}
                </ul>
              </div>
            )}
          </div>

          {/* Walk Away Button */}
          <div className="text-center mt-6">
             <button
              className="px-6 py-3 bg-warning text-white rounded font-bold hover:bg-warning-focus transition"
              onClick={handleWalkAway}
              disabled={!isTimerRunning || gameOver} // Disable walk away if timer is not running or game over
            >
              Walk Away with ${earnedMoney.toLocaleString()}
            </button>
          </div>
        </>
      )}
    </div>
  );
}