import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from '../firebaseClient'; // Import Firestore instance
import { collection, query, where, getDocs } from 'firebase/firestore'; // Removed unused doc, getDoc, Timestamp

interface QuizPerformanceGraphsProps {
  quizId: string;
}

// Placeholder data structure - adjust based on actual Firestore data
interface QuestionPerformanceData {
  questionNumber: number; // 1-based index for display
  // averageTime: number; // Removing time calculation for now
  incorrectCount: number;
}

// Interface for the structure within the 'sessions/{id}/answers/{id}' subcollection
// Based on search results (qIdx, answer, answeredAt) - assuming 'answer' is the index chosen
interface SessionAnswer {
 qIdx: number; // 0-based index of the question
 answer: number; // Index of the answer chosen by the user
 // answeredAt: Timestamp; // Not currently used for aggregation
 // Add other relevant fields if they exist (e.g., nickname, userId)
}

// Interface for the Question structure (needed for checking correctness)
interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number; // Index of the correct answer
  image?: string;
  time: number;
}


const QuizPerformanceGraphs: React.FC<QuizPerformanceGraphsProps> = ({ quizId }) => {
  // State will only hold error data now
  const [errorData, setErrorData] = useState<QuestionPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- Fetch Quiz Questions first ---
        const questionsColRef = collection(db, 'quizzes', quizId, 'questions');
        const questionsSnapshot = await getDocs(query(questionsColRef)); // Consider ordering if needed
        const questions: Question[] = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));

        if (questions.length === 0) {
          console.warn(`No questions found for quizId: ${quizId}`);
          setErrorData([]);
          setIsLoading(false);
          return;
        }
        // Create a map for quick lookup of correct answers by question index
        const correctAnswersMap = new Map<number, number>();
        questions.forEach((q, index) => {
            // Assuming questions are fetched in order or have an index field
            // If not, we need a reliable way to map q.id to its 0-based index
            correctAnswersMap.set(index, q.correctAnswer);
        });


        // --- Fetch Session Data ---
        const sessionsCollectionRef = collection(db, 'sessions');
        const sessionQuery = query(sessionsCollectionRef, where('quizId', '==', quizId));
        const sessionsSnapshot = await getDocs(sessionQuery);

        if (sessionsSnapshot.empty) {
          console.log(`No sessions found for quizId: ${quizId}`);
          setErrorData([]);
          setIsLoading(false);
          return;
        }

        // --- Aggregate Error Data ---
        const errorAggregation: { [key: number]: { incorrect: number } } = {};

        // Process each session asynchronously
        const answerPromises = sessionsSnapshot.docs.map(async (sessionDoc) => {
          const answersColRef = collection(db, 'sessions', sessionDoc.id, 'answers');
          const answersSnapshot = await getDocs(answersColRef);

          answersSnapshot.forEach((answerDoc) => {
            const answerData = answerDoc.data() as SessionAnswer;
            const questionIndex = answerData.qIdx; // 0-based index

            if (errorAggregation[questionIndex] === undefined) {
              errorAggregation[questionIndex] = { incorrect: 0 };
            }

            const correctAnswer = correctAnswersMap.get(questionIndex);
            // Increment incorrect count if answer is wrong and correct answer exists
            if (correctAnswer !== undefined && answerData.answer !== correctAnswer) {
              errorAggregation[questionIndex].incorrect += 1;
            }
          });
        });

        // Wait for all answer fetching and processing to complete
        await Promise.all(answerPromises);

        // Format aggregated data
        const formattedErrorData: QuestionPerformanceData[] = Object.entries(errorAggregation)
          .map(([indexStr, data]) => {
            const index = parseInt(indexStr, 10);
            return {
              questionNumber: index + 1, // Convert 0-based index to 1-based number
              incorrectCount: data.incorrect,
            };
          })
           // Ensure all questions are represented, even if no errors were recorded
          .concat(
            questions.map((q, index) => {
              if (errorAggregation[index] === undefined) {
                return { questionNumber: index + 1, incorrectCount: 0 };
              }
              return null; // Will be filtered out
            }).filter(item => item !== null) as QuestionPerformanceData[]
          )
          // Remove duplicates if a question existed in aggregation AND the fill-in map
          .filter((item, index, self) =>
             index === self.findIndex((t) => t.questionNumber === item.questionNumber)
          )
          .sort((a, b) => a.questionNumber - b.questionNumber); // Sort by question number


        setErrorData(formattedErrorData);
        // --- End Firestore Logic ---

      } catch (err) {
        console.error("Error fetching or processing quiz performance data:", err);
        setError("Failed to load performance data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [quizId]); // Re-fetch if quizId changes

  if (isLoading) {
    return <div className="text-center p-4">Loading performance insights...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  // Check the correct state variable 'errorData'
  if (errorData.length === 0) {
    return <div className="text-center p-4 text-gray-500">No performance data available for this quiz yet.</div>;
  }

  // Prepare data for the error chart
  const chartData = errorData.map(d => ({ name: `Q${d.questionNumber}`, Errors: d.incorrectCount }));

  return (
    <div className="space-y-8">
      {/* Removed Average Time Chart */}
      <div>
        <h3 className="text-md font-semibold mb-3 text-primary">Most Common Errors by Question</h3>
         <ResponsiveContainer width="100%" height={300}>
          {/* Ensure chartData is used here */}
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} /> {/* Ensure Y-axis shows whole numbers for counts */}
            <Tooltip />
            <Legend />
            <Bar dataKey="Errors" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QuizPerformanceGraphs;