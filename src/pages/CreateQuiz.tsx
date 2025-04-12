import React, { useState } from "react";
import { db } from "../firebaseClient";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";

interface Question {
  question: string;
  answers: string[];
  correctAnswer: number;
}

const CreateQuiz: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", answers: ["", "", "", ""], correctAnswer: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...questions];
    updated[index].question = value;
    setQuestions(updated);
  };

  const handleAnswerChange = (
    qIndex: number,
    aIndex: number,
    value: string
  ) => {
    const updated = [...questions];
    updated[qIndex].answers[aIndex] = value;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIndex: number, value: number) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", answers: ["", "", "", ""], correctAnswer: 0 },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Add quiz document
      const quizRef = await addDoc(collection(db, "quizzes"), {
        title,
        description,
        createdAt: new Date(),
      });

      // Use a batch for all questions and answers
      const batch = writeBatch(db);

      questions.forEach((q, qIdx) => {
        const questionRef = doc(collection(db, "quizzes", quizRef.id, "questions"));
        batch.set(questionRef, {
          question: q.question,
          correctAnswer: q.correctAnswer,
          createdAt: new Date(),
        });

        q.answers.forEach((answer, aIdx) => {
          const answerRef = doc(collection(db, "quizzes", quizRef.id, "questions", questionRef.id, "answers"));
          batch.set(answerRef, {
            answer,
            index: aIdx,
            createdAt: new Date(),
          });
        });
      });

      await batch.commit();

      setSuccess(true);
      setTitle("");
      setDescription("");
      setQuestions([{ question: "", answers: ["", "", "", ""], correctAnswer: 0 }]);
    } catch (err) {
      setError("Failed to create quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create a New Quiz</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {success && <div className="mb-4 text-green-600">Quiz created successfully!</div>}
      {loading && <div className="mb-4 text-gray-600">Saving quiz...</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold">Title</label>
          <input
            className="w-full border rounded p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            className="w-full border rounded p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Questions</h2>
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="mb-4 border p-3 rounded bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">
                  Question {qIdx + 1}
                </label>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => removeQuestion(qIdx)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                className="w-full border rounded p-2 mb-2"
                value={q.question}
                onChange={(e) =>
                  handleQuestionChange(qIdx, e.target.value)
                }
                required
                placeholder="Enter question"
              />
              <div className="grid grid-cols-2 gap-2">
                {q.answers.map((a, aIdx) => (
                  <div key={aIdx}>
                    <label className="block text-sm">
                      Answer {aIdx + 1}
                    </label>
                    <input
                      className="w-full border rounded p-2"
                      value={a}
                      onChange={(e) =>
                        handleAnswerChange(qIdx, aIdx, e.target.value)
                      }
                      required
                      placeholder={`Answer ${aIdx + 1}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-sm font-semibold">
                  Correct Answer
                </label>
                <select
                  className="border rounded p-2"
                  value={q.correctAnswer}
                  onChange={(e) =>
                    handleCorrectAnswerChange(qIdx, Number(e.target.value))
                  }
                >
                  {q.answers.map((_, aIdx) => (
                    <option key={aIdx} value={aIdx}>
                      {`Answer ${aIdx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={addQuestion}
          >
            Add Question
          </button>
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded font-bold"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Quiz"}
        </button>
      </form>
    </div>
  );
};

export default CreateQuiz;