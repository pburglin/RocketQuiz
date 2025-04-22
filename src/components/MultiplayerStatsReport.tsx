import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

// --- Interfaces ---

interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  image?: string;
  time: number;
}

interface AnswerData {
  nickname: string;
  qIdx: number; // Index of the question in the questions array
  answer: number; // Index of the selected answer
  answeredAt: Timestamp;
  isCorrect: boolean;
  questionStart?: Timestamp | null;
  // Add QuestionID for easier mapping if available, otherwise derive from qIdx
  questionId?: string;
}

interface PlayerStats {
  nickname: string;
  totalScore: number;
  totalTimeSeconds: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number; // 0 to 1
  answers: AnswerData[]; // Filtered answers for this player
}

interface QuestionStats {
  questionId: string;
  questionIndex: number;
  questionText: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  missedAttempts: number; // Calculated based on total players vs attempts
  accuracy: number; // 0 to 1
  averageTimeSeconds: number;
  playerTimes: { [nickname: string]: number }; // Time taken by each player for this question
  incorrectAnswers: { [answerText: string]: number }; // Count of specific incorrect answers
}

interface MultiplayerStatsReportProps {
  players: string[]; // List of player nicknames
  answers: AnswerData[]; // All answers from the session
  questions: Question[]; // Quiz questions
  scores: { [nickname: string]: number }; // Final scores
}

// --- Helper Functions ---

// Calculates time taken in seconds from Timestamps
const calculateTimeTaken = (start: Timestamp | null | undefined, end: Timestamp): number => {
  if (!start || !end) return 0;
  const startTime = start.toMillis();
  const endTime = end.toMillis();
  return Math.max(0, (endTime - startTime) / 1000);
};

// --- Main Component ---

const MultiplayerStatsReport: React.FC<MultiplayerStatsReportProps> = ({
  players,
  answers,
  questions,
  scores,
}) => {
  // --- Data Processing ---

  // 1. Calculate Player Stats
  const playerStats: PlayerStats[] = players.map(nickname => {
    const playerAnswers = answers.filter(a => a.nickname === nickname);
    const correctAnswers = playerAnswers.filter(a => a.isCorrect).length;
    const totalAnswers = playerAnswers.length;
    const totalTimeSeconds = playerAnswers.reduce((sum, a) => sum + calculateTimeTaken(a.questionStart, a.answeredAt), 0);
    const accuracy = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;

    return {
      nickname,
      totalScore: scores[nickname] || 0,
      totalTimeSeconds,
      correctAnswers,
      totalAnswers,
      accuracy,
      answers: playerAnswers,
    };
  });

  // 2. Calculate Question Stats
  const questionStats: QuestionStats[] = questions.map((q, index) => {
    const questionId = q.id;
    const questionAnswers = answers.filter(a => a.qIdx === index);
    const correctAttempts = questionAnswers.filter(a => a.isCorrect).length;
    const totalAttempts = questionAnswers.length;
    const incorrectAttempts = totalAttempts - correctAttempts;
    const missedAttempts = players.length - totalAttempts; // Players who didn't answer
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

    const playerTimes: { [nickname: string]: number } = {};
    let totalTime = 0;
    questionAnswers.forEach(a => {
      const time = calculateTimeTaken(a.questionStart, a.answeredAt);
      playerTimes[a.nickname] = time;
      totalTime += time;
    });
    const averageTimeSeconds = totalAttempts > 0 ? totalTime / totalAttempts : 0;

    const incorrectAnswers: { [answerText: string]: number } = {};
    questionAnswers
      .filter(a => !a.isCorrect)
      .forEach(a => {
        const answerText = q.answers[a.answer] || `Answer Index ${a.answer}`; // Handle potential index issues
        incorrectAnswers[answerText] = (incorrectAnswers[answerText] || 0) + 1;
      });

    return {
      questionId,
      questionIndex: index,
      questionText: q.question,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      missedAttempts,
      accuracy,
      averageTimeSeconds,
      playerTimes,
      incorrectAnswers,
    };
  });

  // 3. Calculate Overall Summary
  const overallAverageScore = playerStats.reduce((sum, p) => sum + p.totalScore, 0) / players.length || 0;
  const overallAverageTime = playerStats.reduce((sum, p) => sum + p.totalTimeSeconds, 0) / players.length || 0;
  const overallCorrectAnswers = playerStats.reduce((sum, p) => sum + p.correctAnswers, 0);
  const overallTotalAnswers = playerStats.reduce((sum, p) => sum + p.totalAnswers, 0);
  const overallAccuracy = overallTotalAnswers > 0 ? overallCorrectAnswers / overallTotalAnswers : 0;

  // 4. Prepare Data for Charts
  // Time Per Question Chart Data
  const timeChartData = questions.map((q, index) => {
    const stats = questionStats[index];
    const dataPoint: { [key: string]: string | number } = {
      question: `Q${index + 1}`, // Short label for X-axis
      questionId: q.id,
      questionText: q.question, // For tooltip
    };
    players.forEach(nickname => {
      dataPoint[nickname] = stats.playerTimes[nickname] ?? null; // Use null for missing data points in chart
    });
    return dataPoint;
  });

  // Error Pattern Analysis - Top 3 incorrect questions
  const topErrorQuestions = [...questionStats]
    .sort((a, b) => b.incorrectAttempts + b.missedAttempts - (a.incorrectAttempts + a.missedAttempts)) // Sort by most errors/misses
    .slice(0, 3); // Get top 3

  // --- Rendering ---

  return (
    <div className="mt-8 p-4 border border-neutral rounded-lg bg-base-200">
      <h2 className="text-xl font-bold mb-4 text-primary">Multiplayer Session Report</h2>

      {/* 1. Overall Summary */}
      <div className="mb-6 p-3 bg-base-100 rounded">
        <h3 className="text-lg font-semibold mb-2 text-primary">Overall Summary</h3>
        <p>Average Score: {overallAverageScore.toFixed(0)} pts</p>
        <p>Average Total Time: {overallAverageTime.toFixed(1)} seconds</p>
        <p>Overall Accuracy: {(overallAccuracy * 100).toFixed(1)}% ({overallCorrectAnswers}/{overallTotalAnswers} correct)</p>
        {/* Add more comparative stats if needed */}
      </div>

      {/* 2. Question Performance Analysis (Time Chart) */}
      <div className="mb-6 p-3 bg-base-100 rounded">
        <h3 className="text-lg font-semibold mb-2 text-primary">Average Time per Question</h3>
        {timeChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="question" />
              <YAxis label={{ value: 'Time (s)', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={(props: TooltipProps) => { // Remove generic type
                  const { active, payload, label } = props; // Destructure props
                  if (active && payload && payload.length) {
                    const questionData = timeChartData.find(d => d.question === label);
                    return (
                      <div className="bg-base-100 p-2 border border-neutral rounded shadow">
                        <p className="font-bold">{label}: {questionData?.questionText}</p>
                        {payload.map((entry) => ( // Rely on type inference from payload array
                          <p key={entry.name} style={{ color: entry.stroke || entry.fill || entry.color }}> {/* Use stroke, fill, or color */}
                            {entry.name}: {entry.value !== null ? `${(entry.value as number).toFixed(1)}s` : 'N/A'}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}/>
              <Legend />
              {players.map((nickname, index) => (
                <Line
                  key={nickname}
                  type="monotone"
                  dataKey={nickname}
                  stroke={`hsl(${index * (360 / players.length)}, 70%, 50%)`} // Assign distinct colors
                  connectNulls // Connect lines even if a player missed a question
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>Not enough data for time analysis.</p>
        )}
      </div>

      {/* 3. Error Pattern Analysis */}
      <div className="p-3 bg-base-100 rounded">
        <h3 className="text-lg font-semibold mb-2 text-primary">Error Pattern Analysis</h3>
        {topErrorQuestions.length > 0 ? (
          <>
            <p className="mb-3">Top {topErrorQuestions.length} questions with the most incorrect or missed answers:</p>
            {topErrorQuestions.map((qStat, index) => (
              <div key={qStat.questionId} className="mb-4 p-2 border-l-4 border-error bg-error/10 rounded">
                <p className="font-semibold">
                  #{index + 1}: Q{qStat.questionIndex + 1} - "{qStat.questionText}"
                </p>
                <p>Accuracy: {(qStat.accuracy * 100).toFixed(1)}% ({qStat.correctAttempts}/{qStat.totalAttempts} correct)</p>
                <p>Incorrect: {qStat.incorrectAttempts}, Missed: {qStat.missedAttempts}</p>
                {Object.keys(qStat.incorrectAnswers).length > 0 && (
                  <div className="mt-2 pl-4">
                    <p className="text-sm font-medium">Most Frequent Incorrect Answers:</p>
                    <ul className="list-disc list-inside text-sm">
                      {Object.entries(qStat.incorrectAnswers)
                        .sort(([, countA], [, countB]) => countB - countA) // Sort by frequency
                        .map(([answerText, count]) => (
                          <li key={answerText}>"{answerText}" ({count} times)</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <p>No significant error patterns identified.</p>
        )}
      </div>
    </div>
  );
};

export default MultiplayerStatsReport;