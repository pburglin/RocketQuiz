import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// TODO: Import necessary Firestore functions (getDocs, collection, query, where)

interface QuizPerformanceGraphsProps {
  quizId: string;
}

// Placeholder data structure - adjust based on actual Firestore data
interface QuestionPerformanceData {
  questionNumber: number;
  averageTime: number; // Average time taken in seconds
  incorrectCount: number; // Number of times answered incorrectly
}

const QuizPerformanceGraphs: React.FC<QuizPerformanceGraphsProps> = ({ quizId }) => {
  const [performanceData, setPerformanceData] = useState<QuestionPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- TODO: Fetch and process data from Firestore ---
        // 1. Query the relevant collection (e.g., 'gameSessions' or 'questionAttempts')
        //    filtered by quizId.
        // 2. Aggregate the data:
        //    - Calculate average response time per question number.
        //    - Count incorrect answers per question number.
        // 3. Format the data into the QuestionPerformanceData structure.

        // Placeholder data for now:
        const dummyData: QuestionPerformanceData[] = [
          { questionNumber: 1, averageTime: 15.2, incorrectCount: 3 },
          { questionNumber: 2, averageTime: 25.8, incorrectCount: 8 },
          { questionNumber: 3, averageTime: 18.1, incorrectCount: 1 },
          { questionNumber: 4, averageTime: 30.5, incorrectCount: 12 },
          { questionNumber: 5, averageTime: 22.0, incorrectCount: 5 },
        ];
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setPerformanceData(dummyData);
        // --- End TODO ---

      } catch (err) {
        console.error("Error fetching quiz performance data:", err);
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

  if (performanceData.length === 0) {
    return <div className="text-center p-4 text-gray-500">No performance data available for this quiz yet.</div>;
  }

  // Prepare data for charts
  const timeData = performanceData.map(d => ({ name: `Q${d.questionNumber}`, Time: d.averageTime.toFixed(1) }));
  const errorData = performanceData.map(d => ({ name: `Q${d.questionNumber}`, Errors: d.incorrectCount }));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-md font-semibold mb-3 text-primary">Average Time per Question (Seconds)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Time" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-md font-semibold mb-3 text-primary">Most Common Errors by Question</h3>
         <ResponsiveContainer width="100%" height={300}>
          <BarChart data={errorData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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