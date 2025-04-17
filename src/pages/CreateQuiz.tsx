import React, { useState } from "react";
import { db } from "../firebaseClient";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";

interface Question {
  question: string;
  answers: string[];
  correctAnswer: number;
  image?: string;
  time: number; // seconds
}

import { User as FirebaseUser } from "firebase/auth";

const CreateQuiz: React.FC<{ user: FirebaseUser | null }> = ({ user }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", answers: ["", "", "", ""], correctAnswer: 0, image: "", time: 30 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // AI generation state
  const [aiDescription, setAIDescription] = useState("");
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

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
      { question: "", answers: ["", "", "", ""], correctAnswer: 0, image: "", time: 30 },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // AI Quiz Generation Handler
  const handleAIGenerate = async () => {
    setAILoading(true);
    setAIError(null);
    try {
      const apiUrl = import.meta.env.VITE_LLM_API_URL;
      const apiKey = import.meta.env.VITE_LLM_API_KEY;
      const modelName = import.meta.env.VITE_LLM_MODEL_NAME;
      if (!apiUrl) {
        setAIError("LLM API URL is not configured.");
        setAILoading(false);
        return;
      }
      // Payload for Mistral (or OpenAI-style) chat completions API
      const payload = {
        model: modelName,
        messages: [
          {
            role: "system",
            content:
              "You are a quiz generator. Respond ONLY with a JSON object with the following structure: {\"title\": string, \"description\": string, \"language\": string, \"tags\": string[], \"image\": string, \"questions\": [{\"question\": string, \"answers\": string[], \"correctAnswer\": number, \"image\": string, \"time\": number}]}. Example: {\"title\": \"World Capitals Quiz\", \"description\": \"A quiz about world capitals.\", \"language\": \"English\", \"tags\": [\"geography\", \"capitals\"], \"image\": \"\", \"questions\": [{\"question\": \"What is the capital of France?\", \"answers\": [\"London\", \"Paris\", \"Berlin\", \"Madrid\"], \"correctAnswer\": 1, \"image\": \"\", \"time\": 30}]}. Do not include any text or explanation outside the JSON object."
          },
          {
            role: "user",
            content: aiDescription
          }
        ]
        // Add other params as needed (e.g., temperature)
      };
      console.log("[AI GENERATE] Request payload:", payload);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      console.log("[AI GENERATE] Response status:", response.status, response.statusText);
      const responseText = await response.text();
      console.log("[AI GENERATE] Raw response text:", responseText);

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText} (status ${response.status})`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch { // Remove unused variable
        console.error("[AI GENERATE] Failed to parse response as JSON:", responseText);
        throw new Error("Failed to parse LLM API response as JSON.");
      }

      // For Mistral/OpenAI-style APIs, the quiz is in choices[0].message.content as a JSON string
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content returned from LLM API.");
      }
      let quizObj;
      try {
        // Remove code block markers and leading/trailing whitespace
        let cleaned = content.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.slice(7);
        }
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();
        // Try to parse. If result is a string, parse again (double-encoded JSON)
        let parsed = JSON.parse(cleaned);
        if (typeof parsed === "string") {
          parsed = JSON.parse(parsed);
        }
        quizObj = parsed;
      } catch { // Remove unused variable
        console.error("[AI GENERATE] Failed to parse LLM message content as JSON:", content);
        throw new Error("Failed to parse LLM response as JSON. Response: " + content);
      }

      // Expecting quizObj to have: title, description, questions (array)
      if (!quizObj || !quizObj.questions || !Array.isArray(quizObj.questions)) {
        console.error("[AI GENERATE] Invalid quiz object from LLM API:", quizObj);
        throw new Error("Invalid quiz object from LLM API.");
      }

      setTitle(quizObj.title || "");
      setDescription(quizObj.description || "");
      setLanguage(quizObj.language || "");
      setTags(Array.isArray(quizObj.tags) ? quizObj.tags.join(", ") : (quizObj.tags || ""));
      setImage(quizObj.image || "");
      // Define a type for the AI question structure
      interface AIQuestion {
        question?: string;
        answers?: string[];
        correctAnswer?: number;
        image?: string;
        time?: number;
      }
      // Map questions to our Question type, with defaults
      setQuestions(
        quizObj.questions.map((q: AIQuestion) => ({ // Use defined type
          question: q.question || "",
          answers: Array.isArray(q.answers) ? q.answers : ["", "", "", ""],
          correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
          image: q.image || "",
          time: typeof q.time === "number" ? q.time : 30,
        }))
      );
    } catch (err: unknown) { // Use unknown type for error
      console.error("[AI GENERATE] Error:", err);
      // Check if err is an Error object before accessing message
      const errorMessage = err instanceof Error ? err.message : "Failed to generate quiz with AI.";
      setAIError(errorMessage);
    } finally {
      setAILoading(false);
    }
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
        createdBy: user?.uid || null,
        language: language.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        image: image.trim(),
        questionCount: questions.length, // Add question count
        questionsCount: questions.length,
      });
  
      // Use a batch for all questions and answers
      const batch = writeBatch(db);

      questions.forEach((q) => { // Remove unused qIdx
        const questionRef = doc(collection(db, "quizzes", quizRef.id, "questions"));
        batch.set(questionRef, {
          question: q.question,
          correctAnswer: q.correctAnswer,
          createdAt: new Date(),
          image: q.image?.trim() || "",
          time: q.time,
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
      setImage("");
      setLanguage("");
      setTags("");
      setQuestions([{ question: "", answers: ["", "", "", ""], correctAnswer: 0, image: "", time: 30 }]);
    } catch (err) {
      console.error("Quiz creation error:", err);
      setError("Failed to create quiz.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Create a New Quiz</h1>
        <div className="mb-6 text-lg text-gray-700">
          Only registered users can create quizzes and start multiplayer quizzes.
        </div>
        <a
          href="/register"
          className="inline-block px-6 py-3 rounded-lg bg-primary text-white font-semibold text-lg shadow hover:bg-primary/90 transition" // Use primary color
        >
          Register an Account
        </a>
        <div className="mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline"> // Use primary color
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create a New Quiz</h1>
      {error && <div className="mb-4 p-3 rounded text-center bg-error/10 text-error font-medium">{error}</div>} {/* Style error message */}
      {success && <div className="mb-4 p-3 rounded text-center bg-success/10 text-success font-medium">Quiz created successfully!</div>} {/* Style success message */}
      {loading && <div className="mb-4 text-gray-600">Saving quiz...</div>}

      {/* AI Quiz Generation Section */}
      <div className="mb-8 p-4 border rounded bg-neutral"> {/* Use neutral color */}
        <h2 className="text-lg font-semibold mb-2">Generate Quiz with AI</h2>
        <label className="block mb-1 font-medium">Describe the quiz you want to generate</label>
        <textarea
          className="w-full border rounded p-2 mb-2"
          value={aiDescription}
          onChange={(e) => setAIDescription(e.target.value)}
          placeholder="e.g. A 5-question quiz about world capitals, with 4 answer choices per question."
          rows={3}
        />
        <button
          type="button"
          className="bg-primary text-white px-4 py-2 rounded font-bold flex items-center justify-center disabled:opacity-50" // Use primary color, add flex for spinner alignment
          onClick={handleAIGenerate}
          disabled={aiLoading || !aiDescription.trim()}
        >
          {aiLoading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {aiLoading ? "Generating..." : "Generate with AI"}
        </button>
        {aiError && <div className="mt-2 text-error">{aiError}</div>} {/* Use error color */}
        <div className="mt-2 text-gray-600 text-sm">
          The generated quiz will fill the form below. You can review and edit before saving.
        </div>
      </div>

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
          <label className="block font-semibold">Quiz Image URL (optional)</label>
          <input
            className="w-full border rounded p-2"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/quiz-image.jpg"
            type="url"
          />
        </div>
        <div>
          <label className="block font-semibold">Language</label>
          <input
            className="w-full border rounded p-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. English"
          />
        </div>
        <div>
          <label className="block font-semibold">Tags (comma separated)</label>
          <input
            className="w-full border rounded p-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. math, science, trivia"
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
            <div key={qIdx} className="mb-4 border p-3 rounded bg-neutral"> {/* Use neutral color */}
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">
                  Question {qIdx + 1}
                </label>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="text-error hover:text-error/80" // Use error color
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
              <div className="mb-2">
                <label className="block text-sm">Question Image URL (optional)</label>
                <input
                  className="w-full border rounded p-2"
                  value={q.image || ""}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[qIdx].image = e.target.value;
                    setQuestions(updated);
                  }}
                  placeholder="https://example.com/question-image.jpg"
                  type="url"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm">Time for this question (seconds)</label>
                <input
                  className="w-full border rounded p-2"
                  type="number"
                  min={5}
                  max={600}
                  value={q.time}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[qIdx].time = Number(e.target.value);
                    setQuestions(updated);
                  }}
                  required
                  placeholder="Time in seconds"
                />
              </div>
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
            className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/90" // Use accent color
            onClick={addQuestion}
          >
            Add Question
          </button>
        </div>
        <button
          type="submit"
          className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-primary/90 disabled:opacity-50" // Use primary color
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Quiz"}
        </button>
      </form>
    </div>
  );
};

export default CreateQuiz;