import React, { useState, useEffect } from "react";
import { Search, Filter, Star, Globe, Tag, ThumbsUp } from "lucide-react";
import QuizCard from "../components/QuizCard";
import { db } from "../firebaseClient";
import { collection, getDocs } from "firebase/firestore";


const allTags = [
  "Geography",
  "World",
  "Science",
  "Space",
  "Art",
  "History",
  "Music",
  "Sports",
  "Technology",
  "1stgrade",
  "2ndgrade",
  "3rdgrade",
];

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

export default function SearchQuiz() {
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [popularity, setPopularity] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameLength, setGameLength] = useState(""); // "", "quick", "medium", "long"

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, "quizzes"));
        const quizList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuizzes(quizList);
      } catch (err: any) {
        setError("Failed to load quizzes.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title?.toLowerCase().includes(search.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(search.toLowerCase());
    const matchesLanguage =
      selectedLanguage === "" ||
      quiz.language?.toLowerCase() ===
        languages.find((l) => l.code === selectedLanguage)?.label.toLowerCase();
    const matchesTags =
      selectedTags.length === 0 ||
      (quiz.tags && selectedTags.every((tag) => quiz.tags.includes(tag)));
    // If popularity is not present, treat as 0
    const quizPopularity = typeof quiz.popularity === "number" ? quiz.popularity : 0;
    const matchesPopularity = quizPopularity >= popularity;

    // If rating is not present, treat as 0
    const quizRating = typeof quiz.averageRating === "number" ? quiz.averageRating : 0;
    const matchesRating = quizRating >= minRating;

    let matchesGameLength = true;
    if (gameLength && typeof quiz.questionCount === "number") {
      if (gameLength === "quick") {
        matchesGameLength = quiz.questionCount < 10;
      } else if (gameLength === "medium") {
        matchesGameLength = quiz.questionCount >= 10 && quiz.questionCount <= 20;
      } else if (gameLength === "long") {
        matchesGameLength = quiz.questionCount > 20;
      }
    } else if (gameLength) {
      // If filter is set but questionCount is missing, exclude quiz
      matchesGameLength = false;
    }

    return (
      matchesSearch && matchesLanguage && matchesTags && matchesPopularity && matchesGameLength && matchesRating
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Filter className="w-7 h-7 text-indigo-500" />
          Search Quizzes
        </h1>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="flex-1 flex items-center bg-white rounded-lg shadow px-3 py-2">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              className="w-full outline-none bg-transparent"
              placeholder="Search by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Language Dropdown */}
          <div className="flex items-center bg-white rounded-lg shadow px-3 py-2">
            <Globe className="w-5 h-5 text-gray-400 mr-2" />
            <select
              className="bg-transparent outline-none"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Tags Multi-select */}
          <div className="flex-1 flex items-center bg-white rounded-lg shadow px-3 py-2 flex-wrap gap-2">
            <Tag className="w-5 h-5 text-gray-400 mr-2" />
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`px-2 py-1 rounded-full text-sm border transition ${
                  selectedTags.includes(tag)
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-slate-100 text-gray-700 border-slate-200 hover:bg-indigo-100"
                }`}
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  )
                }
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
          {/* Game Length Filter */}
          <div className="flex items-center bg-white rounded-lg shadow px-3 py-2 min-w-[260px]">
            <span className="mr-2 text-gray-600 font-medium">Game Length:</span>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="gameLength"
                  value=""
                  checked={gameLength === ""}
                  onChange={() => setGameLength("")}
                  className="accent-indigo-500"
                />
                Any
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="gameLength"
                  value="quick"
                  checked={gameLength === "quick"}
                  onChange={() => setGameLength("quick")}
                  className="accent-indigo-500"
                />
                Quick {"(<10)"}
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="gameLength"
                  value="medium"
                  checked={gameLength === "medium"}
                  onChange={() => setGameLength("medium")}
                  className="accent-indigo-500"
                />
                Medium {"(10-20)"}
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  name="gameLength"
                  value="long"
                  checked={gameLength === "long"}
                  onChange={() => setGameLength("long")}
                  className="accent-indigo-500"
                />
                Long {">20"}
              </label>
            </div>
          </div>
          {/* Popularity Slider */}
          <div className="flex items-center bg-white rounded-lg shadow px-3 py-2 min-w-[200px]">
            <ThumbsUp className="w-5 h-5 text-blue-500 mr-2" />
            <input
              type="range"
              min={0}
              max={100}
              value={popularity}
              onChange={(e) => setPopularity(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-600">{popularity}+</span>
          </div>
          
          {/* Rating Slider */}
          <div className="flex items-center bg-white rounded-lg shadow px-3 py-2 min-w-[200px]">
            <Star className="w-5 h-5 text-yellow-400 mr-2" />
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-600">{minRating}+ ★</span>
          </div>
        </div>
        {/* Quiz List/Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              Loading quizzes...
            </div>
          ) : error ? (
            <div className="col-span-full text-center text-red-500 py-12">
              {error}
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              No quizzes found. Try adjusting your filters.
            </div>
          ) : (
            filteredQuizzes.map((quiz) => (
              <div key={quiz.id}>
                <QuizCard quiz={quiz} />
                <div className="text-xs text-gray-400 ml-2">
                  {/* Debug: show questionCount */}
                  {typeof quiz.questionCount === "number"
                    ? `Questions: ${quiz.questionCount}`
                    : "No questionCount"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}