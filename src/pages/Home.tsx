import Navbar from "../components/Navbar";
import FeaturedQuizzes from "../components/FeaturedQuizzes";
import Footer from "../components/Footer";
import { Rocket } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";

type HomeProps = {
  user: FirebaseUser | null;
};

export default function Home({ user }: HomeProps) {
  return (
    <div className="bg-gradient-to-br from-secondary/20 via-base-100 to-accent/20 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 flex items-center gap-3">
              <Rocket className="w-10 h-10 text-primary" />
              RocketQuiz
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6">
              The next-generation multiplayer quiz platform. Play, compete, and create quizzes with friends or the world. Fast, fun, and always free.
            </p>
            <div className="flex gap-4">
              <a
                href="/search"
                className="px-6 py-3 rounded-lg bg-primary text-white font-semibold text-lg shadow hover:bg-accent transition"
              >
                Discover Quizzes
              </a>
              {!user && (
                <a
                  href="/register"
                  className="px-6 py-3 rounded-lg bg-secondary text-primary font-semibold text-lg shadow hover:bg-accent transition"
                >
                  Create Account
                </a>
              )}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/rocketquiz-logo.png"
              alt="Quiz fun"
              className="rounded-2xl shadow-2xl w-full max-w-md object-cover"
              loading="lazy"
            />
          </div>
        </section>
        {/* Featured Quizzes */}
        <FeaturedQuizzes />
      </main>
      <Footer />
    </div>
  );
}
