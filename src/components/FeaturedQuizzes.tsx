import QuizCard from "./QuizCard";

const quizzes = [
  {
    id: "1",
    title: "World Capitals Challenge",
    description: "Test your knowledge of world capitals in this fun and fast-paced quiz.",
    tags: ["Geography", "World", "Trivia"],
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    popularity: 98,
    language: "English",
  },
  {
    id: "2",
    title: "Famous Paintings",
    description: "Can you recognize these masterpieces and their artists?",
    tags: ["Art", "History", "Culture"],
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    popularity: 87,
    language: "English",
  },
  {
    id: "3",
    title: "Space Exploration",
    description: "How much do you know about the universe and space missions?",
    tags: ["Science", "Space", "STEM"],
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    popularity: 92,
    language: "English",
  },
  {
    id: "4",
    title: "Movie Soundtracks",
    description: "Guess the movie from its iconic soundtrack.",
    tags: ["Movies", "Music", "Pop Culture"],
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    popularity: 80,
    language: "English",
  },
];

export default function FeaturedQuizzes() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>🔥</span> Featured Quizzes
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-2 hide-scrollbar">
        {quizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>
    </section>
  );
}
