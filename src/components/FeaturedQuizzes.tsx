import QuizCard from "./QuizCard";

interface Quiz {
  id: string;
  title?: string;
  description?: string;
  tags?: string[];
  image?: string;
  popularity?: number;
  language?: string;
  [key: string]: unknown; // Allow other potential fields from Firestore
}

import React, { useEffect, useState } from "react";
import { db } from "../firebaseClient";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export default function FeaturedQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query for the latest 4 quizzes based on a 'createdAt' field
        const quizzesRef = collection(db, "quizzes");
        const q = query(quizzesRef, orderBy("createdAt", "desc"), limit(4));
        const querySnapshot = await getDocs(q);

        const quizList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuizzes(quizList);
      } catch {
        // Log the error for debugging purposes if needed
        // console.error("Error fetching featured quizzes:", "An unknown error occurred");
        setError("Failed to load featured quizzes.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-8 py-12"
      aria-labelledby="featured-quizzes-heading"
    >
      <h2
        id="featured-quizzes-heading"
        className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2"
        itemProp="name"
      >
        <span aria-hidden="true">🔥</span> Featured Quizzes
      </h2>
      <div
        className="flex gap-6 overflow-x-auto pb-2 hide-scrollbar"
        role="list"
        aria-label="Featured quizzes collection"
      >
        {loading ? (
          <div className="text-gray-500 py-8 px-4" aria-live="polite">Loading featured quizzes...</div>
        ) : error ? (
          <div className="text-red-500 py-8 px-4" aria-live="assertive" role="alert">{error}</div>
        ) : quizzes.length === 0 ? (
          <div className="text-gray-500 py-8 px-4" aria-live="polite">No featured quizzes found.</div>
        ) : (
          quizzes.map((quiz, index) => (
            <div
              key={quiz.id}
              itemScope
              itemType="https://schema.org/LearningResource"
              itemProp="itemListElement"
              role="listitem"
            >
              <meta itemProp="position" content={`${index + 1}`} />
              <QuizCard
                quiz={{
                  id: quiz.id,
                  title: quiz.title ?? "",
                  description: quiz.description ?? "",
                  tags: quiz.tags ?? [],
                  image: quiz.image ?? "",
                  popularity: typeof quiz.popularity === "number" ? quiz.popularity : 0,
                  language: quiz.language ?? "",
                }}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
