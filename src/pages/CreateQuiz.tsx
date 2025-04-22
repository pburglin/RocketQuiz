import React, { useState, useEffect, useCallback, useRef } from "react"; // Import useRef
import { db } from "../firebaseClient";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";
import { debounce } from 'lodash'; // Import debounce

interface Question {
  question: string;
  answers: string[];
  correctAnswer: number;
  image?: string;
  time: number; // seconds
  // Add validation status and preview URL
  imageValidationStatus?: 'idle' | 'validating' | 'valid' | 'invalid';
  imagePreviewUrl?: string | null;
}

import { User as FirebaseUser } from "firebase/auth";

const CreateQuiz: React.FC<{ user: FirebaseUser | null }> = ({ user }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  // Add state for main quiz image validation
  const [quizImageValidationStatus, setQuizImageValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [quizImagePreviewUrl, setQuizImagePreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("");
  const [tags, setTags] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", answers: ["", "", "", ""], correctAnswer: 0, image: "", time: 30, imageValidationStatus: 'idle', imagePreviewUrl: null }, // Initialize new fields
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // AI generation state
  const [aiDescription, setAIDescription] = useState("");
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  // Ref to store debounced validators for question images, keyed by index
  const debouncedQuestionValidators = useRef<Map<number, ReturnType<typeof debounce>>>(new Map());

  // --- Image Validation Logic ---

  const validateImageUrl = useCallback(async (
    url: string,
    setStatus: React.Dispatch<React.SetStateAction<'idle' | 'validating' | 'valid' | 'invalid'>>,
    setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (!url || !url.trim()) {
      setStatus('idle');
      setPreviewUrl(null);
      return;
    }

    // Basic URL format check (optional but good practice)
    try {
      new URL(url);
    } catch { // Remove unused variable
      setStatus('invalid');
      setPreviewUrl(null);
      return;
    }

    setStatus('validating');
    setPreviewUrl(null); // Clear preview while validating

    try {
      // Use HEAD request to check existence without downloading the full image
      const response = await fetch(url, { method: 'HEAD', mode: 'cors' }); // Use HEAD

      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        setStatus('valid');
        setPreviewUrl(url); // Set preview URL on success
      } else {
        // Consider non-image content types or non-2xx status codes as invalid
        setStatus('invalid');
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error("Image validation error:", error);
      // Network errors, CORS issues etc.
      setStatus('invalid');
      setPreviewUrl(null);
    }
  }, []); // Empty dependency array as it doesn't depend on component state/props directly

  // Function to update question state (used by validator)
  const updateQuestionValidationState = useCallback((qIndex: number, status: 'idle' | 'validating' | 'valid' | 'invalid', previewUrl: string | null) => {
    setQuestions(prevQuestions => {
      const updated = [...prevQuestions];
      if (updated[qIndex]) {
        updated[qIndex].imageValidationStatus = status;
        updated[qIndex].imagePreviewUrl = previewUrl;
      }
      return updated;
    });
  }, []); // Depends only on setQuestions

  // Debounced validation function for the main quiz image
  const debouncedValidateQuizImage = useCallback(
    debounce((url: string) => {
      validateImageUrl(url, setQuizImageValidationStatus, setQuizImagePreviewUrl);
    }, 500), // 500ms debounce delay
    [validateImageUrl]
  );

  // Effect to validate main quiz image URL when it changes
  useEffect(() => {
    debouncedValidateQuizImage(image);
    // Cleanup function to cancel any pending debounced calls if the component unmounts or image changes again quickly
    return () => {
      debouncedValidateQuizImage.cancel();
    };
  }, [image, debouncedValidateQuizImage]);

  // --- End Image Validation Logic ---


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
      { question: "", answers: ["", "", "", ""], correctAnswer: 0, image: "", time: 30, imageValidationStatus: 'idle', imagePreviewUrl: null },
    ]);
    // No need to create validator here, will be created on first change
  };

  const removeQuestion = (index: number) => {
    // Cancel and remove any debounced validator for the removed question
    debouncedQuestionValidators.current.get(index)?.cancel();
    debouncedQuestionValidators.current.delete(index);
    // Adjust keys for subsequent validators (optional, but cleaner)
    const newValidators = new Map<number, ReturnType<typeof debounce>>();
    debouncedQuestionValidators.current.forEach((validator, key) => {
        if (key > index) {
            newValidators.set(key - 1, validator);
        } else if (key < index) {
            newValidators.set(key, validator);
        }
    });
    debouncedQuestionValidators.current = newValidators;

    setQuestions(questions.filter((_, i) => i !== index));
  };


  const handleQuestionImageChange = (qIndex: number, value: string) => {
    // Update the image value immediately
    setQuestions(prevQuestions => {
        const updated = [...prevQuestions];
        if (updated[qIndex]) {
            updated[qIndex].image = value;
            updated[qIndex].imageValidationStatus = 'idle'; // Reset status on manual change
            updated[qIndex].imagePreviewUrl = null;
        }
        return updated;
    });

    // Get or create the debounced validator for this question index
    let validator = debouncedQuestionValidators.current.get(qIndex);
    if (!validator) {
      validator = debounce(async (url: string) => { // Make the debounced function async
        // Create temporary state setters for this specific validation call
        let tempStatus: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
        let tempPreviewUrl: string | null = null;
        const setTempStatus: React.Dispatch<React.SetStateAction<'idle' | 'validating' | 'valid' | 'invalid'>> = (newStatus) => {
            tempStatus = typeof newStatus === 'function' ? newStatus(tempStatus) : newStatus; // Handle functional updates if needed, though unlikely here
        };
        const setTempPreviewUrl: React.Dispatch<React.SetStateAction<string | null>> = (newUrl) => {
            tempPreviewUrl = typeof newUrl === 'function' ? newUrl(tempPreviewUrl) : newUrl;
        };

        // Call the generic validator with the temporary setters
        await validateImageUrl(url, setTempStatus, setTempPreviewUrl);

        // Update the actual question state using the results stored in temp variables
        updateQuestionValidationState(qIndex, tempStatus, tempPreviewUrl);

      }, 500); // 500ms debounce
      debouncedQuestionValidators.current.set(qIndex, validator);
    }
    // Call the debounced validator
    validator(value);
  };


  const handleAIGenerate = async () => {
    setAILoading(true);
    setAIError(null);
    try {
      // --- Re-add actual API call logic ---
      const apiUrl = import.meta.env.VITE_LLM_API_URL;
      const apiKey = import.meta.env.VITE_LLM_API_KEY; // Keep apiKey for potential use in headers
      const modelName = import.meta.env.VITE_LLM_MODEL_NAME; // Keep modelName for payload
      if (!apiUrl) {
        setAIError("LLM API URL is not configured.");
        setAILoading(false);
        return;
      }
      const payload = { // Reconstruct payload
        model: modelName,
        messages: [
          { role: "system", content: "..." }, // Keep system prompt for context
          { role: "user", content: aiDescription }
        ]
      };
      const response = await fetch(apiUrl, { // Reconstruct fetch
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const responseText = await response.text(); // Reconstruct response handling
      if (!response.ok) { throw new Error(`LLM API error: ${response.statusText} (status ${response.status})`); }
      let data; try { data = JSON.parse(responseText); } catch { throw new Error("Failed to parse LLM API response as JSON."); }
      const content = data?.choices?.[0]?.message?.content; if (!content) { throw new Error("No content returned from LLM API."); }
      let quizObj; try { /* ... parsing content ... */ quizObj = JSON.parse(content.trim()); } catch { throw new Error("Failed to parse LLM message content as JSON. Response: " + content); }
      if (!quizObj || !quizObj.questions || !Array.isArray(quizObj.questions)) { throw new Error("Invalid quiz object from LLM API."); }
      // --- End re-added API logic ---


      setTitle(quizObj.title || "");
      setDescription(quizObj.description || "");
      setLanguage(quizObj.language || "");
      setTags(Array.isArray(quizObj.tags) ? quizObj.tags.join(", ") : (quizObj.tags || ""));
      const mainImageUrl = quizObj.image || "";
      setImage(mainImageUrl); // This triggers the useEffect for main image validation

      // Define a type for the AI question structure
      interface AIQuestion {
        question?: string;
        answers?: string[];
        correctAnswer?: number;
        image?: string;
        time?: number;
      }

      // Map questions but defer validation triggering
      const mappedQuestions = quizObj.questions.map((q: AIQuestion) => {
        const imageUrl = q.image || "";
        return {
          question: q.question || "",
          answers: Array.isArray(q.answers) ? q.answers : ["", "", "", ""],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          image: imageUrl,
          time: typeof q.time === 'number' ? q.time : 30,
          imageValidationStatus: imageUrl ? 'idle' : undefined, // Start as idle
          imagePreviewUrl: null,
        };
      });

      setQuestions(mappedQuestions); // Set the questions state first

      // Now, iterate and trigger validation using the handler which manages debouncing
      // Use setTimeout to ensure state update has likely propagated before validation starts
      setTimeout(() => {
          // Add types here: q is Question (our interface), index is number
          mappedQuestions.forEach((q: Question, index: number) => {
            if (q.image) {
              handleQuestionImageChange(index, q.image); // Use the handler to trigger validation
            }
          });
          // Also explicitly validate the main image if provided by AI,
          // as the useEffect might run before quizObj.image is set
          if (mainImageUrl) {
              debouncedValidateQuizImage(mainImageUrl);
          }
      }, 0); // Schedule validation triggers for the next event loop tick


    } catch (err: unknown) { // Use unknown type for error
      console.error("[AI GENERATE] Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate quiz with AI.";
      setAIError(errorMessage);
    } finally {
      setAILoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Pre-submission Validation ---
    // Check main quiz image validation
    if (quizImageValidationStatus === 'validating' || quizImageValidationStatus === 'invalid') {
        setError("Please provide a valid URL for the main quiz image or leave it empty.");
        return;
    }

    // Check all question images validation
    const invalidQuestionImage = questions.find(q => q.imageValidationStatus === 'validating' || q.imageValidationStatus === 'invalid');
    if (invalidQuestionImage) {
        const invalidIndex = questions.findIndex(q => q === invalidQuestionImage);
        setError(`Please provide a valid URL for the image in Question ${invalidIndex + 1} or leave it empty.`);
        return;
    }
    // --- End Pre-submission Validation ---


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
      setQuestions([{ question: "", answers: ["", "", "", ""], correctAnswer: 0, image: "", time: 30, imageValidationStatus: 'idle', imagePreviewUrl: null }]);
      // Reset quiz image validation state
      setQuizImageValidationStatus('idle');
      setQuizImagePreviewUrl(null);
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
          <div className="flex items-center space-x-2"> {/* Flex container */}
            <input
              className="flex-grow border rounded p-2" // Use flex-grow
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/quiz-image.jpg"
              type="url"
            />
            {/* Validation Status Indicator */}
            {quizImageValidationStatus === 'validating' && (
              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {quizImageValidationStatus === 'invalid' && image && ( // Show error only if URL is not empty
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {/* Image Preview */}
            {quizImageValidationStatus === 'valid' && quizImagePreviewUrl && (
              <img src={quizImagePreviewUrl} alt="Quiz preview" className="h-10 w-10 object-cover rounded border" />
            )}
          </div>
           {quizImageValidationStatus === 'invalid' && image && (
             <p className="text-error text-sm mt-1">Invalid or inaccessible image URL.</p>
           )}
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
                 <div className="flex items-center space-x-2"> {/* Flex container */}
                    <input
                      className="flex-grow border rounded p-2" // Use flex-grow
                      value={q.image || ""}
                      onChange={(e) => handleQuestionImageChange(qIdx, e.target.value)}
                      placeholder="https://example.com/question-image.jpg"
                      type="url"
                    />
                    {/* Validation Status Indicator */}
                    {q.imageValidationStatus === 'validating' && (
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {q.imageValidationStatus === 'invalid' && q.image && ( // Show error only if URL is not empty
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                    )}
                    {/* Image Preview */}
                    {q.imageValidationStatus === 'valid' && q.imagePreviewUrl && (
                      <img src={q.imagePreviewUrl} alt={`Question ${qIdx + 1} preview`} className="h-10 w-10 object-cover rounded border" />
                    )}
                 </div>
                 {q.imageValidationStatus === 'invalid' && q.image && (
                    <p className="text-error text-sm mt-1">Invalid or inaccessible image URL.</p>
                 )}
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

// Need to install lodash types
// npm install --save-dev @types/lodash

export default CreateQuiz;