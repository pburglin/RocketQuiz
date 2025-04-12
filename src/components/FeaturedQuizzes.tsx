import QuizCard from "./QuizCard";

interface Quiz {
  id: string;
  title?: string;
  description?: string;
  tags?: string[];
  image?: string;
  popularity?: number;
  language?: string;
  [key: string]: any;
}

import React, { useEffect, useState } from "react";
import { db } from "../firebaseClient";
import { collection, getDocs } from "firebase/firestore";

export default function FeaturedQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, "quizzes"));
        let quizList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by popularity (descending), fallback to 0 if not present
        quizList = quizList.sort(
          (a, b) =>
            (typeof (b as Quiz).popularity === "number" ? (b as Quiz).popularity! : 0) -
            (typeof (a as Quiz).popularity === "number" ? (a as Quiz).popularity! : 0)
        );
        // Take top 4 as featured
        setQuizzes(quizList.slice(0, 4));
      } catch (err: any) {
        setError("Failed to load featured quizzes.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>🔥</span> Featured Quizzes
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-2 hide-scrollbar">
        {loading ? (
          <div className="text-gray-500 py-8 px-4">Loading featured quizzes...</div>
        ) : error ? (
          <div className="text-red-500 py-8 px-4">{error}</div>
        ) : quizzes.length === 0 ? (
          <div className="text-gray-500 py-8 px-4">No featured quizzes found.</div>
        ) : (
          quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
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
          ))
        )}
      </div>
    </section>
  );
}
