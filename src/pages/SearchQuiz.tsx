import React, { useState } from "react";
import { Search, Filter, Star, Globe, Tag } from "lucide-react";
import QuizCard from "../components/QuizCard";

const mockQuizzes = [
  {
    id: "1",
    title: "World Capitals",
    description: "Test your knowledge of world capitals.",
    language: "English",
    tags: ["Geography", "World"],
    popularity: 87,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "2",
    title: "Space Exploration",
    description: "How much do you know about space missions?",
    language: "English",
    tags: ["Science", "Space"],
    popularity: 92,
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "3",
    title: "Famous Paintings",
    description: "Identify the world's most famous artworks.",
    language: "English",
    tags: ["Art", "History"],
    popularity: 75,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80",
  },
];

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

  const filteredQuizzes = mockQuizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(search.toLowerCase()) ||
      quiz.description.toLowerCase().includes(search.toLowerCase());
    const matchesLanguage =
      selectedLanguage === "" ||
      quiz.language.toLowerCase() ===
        languages.find((l) => l.code === selectedLanguage)?.label.toLowerCase();
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => quiz.tags.includes(tag));
    const matchesPopularity = quiz.popularity >= popularity;
    return (
      matchesSearch && matchesLanguage && matchesTags && matchesPopularity
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
          {/* Popularity Slider */}
          <div className="flex items-center bg-white rounded-lg shadow px-3 py-2 min-w-[200px]">
            <Star className="w-5 h-5 text-yellow-400 mr-2" />
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
        </div>
        {/* Quiz List/Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              No quizzes found. Try adjusting your filters.
            </div>
          ) : (
            filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}