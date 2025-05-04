// Removed unused import: import Navbar from "../components/Navbar";
import FeaturedQuizzes from "../components/FeaturedQuizzes";
import Footer from "../components/Footer";
import { Rocket } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { Helmet } from 'react-helmet-async';

type HomeProps = {
  user: FirebaseUser | null;
};

export default function Home({ user }: HomeProps) {
  return (
    // Removed redundant Navbar instance from here
    <div className="bg-gradient-to-br from-secondary/20 via-base-100 to-accent/20 min-h-screen flex flex-col">
      <Helmet>
        <title>RocketQuiz - Create and Play Interactive Quizzes</title>
        <meta name="description" content="Create and play interactive quizzes with friends in real-time. Challenge yourself in single-player mode or compete in multiplayer games." />
      </Helmet>
      {/* The main Navbar is rendered in App.tsx */}
      <main className="flex-1 pt-20" itemScope itemType="https://schema.org/WebPage">
        {/* Hero Section */}
        <section
          className="max-w-7xl mx-auto px-4 sm:px-8 py-16 flex flex-col md:flex-row items-center gap-10"
          itemScope
          itemType="https://schema.org/WPHeader"
          aria-labelledby="main-heading"
        >
          <div className="flex-1">
            <h1
              id="main-heading"
              className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 flex items-center gap-3"
              itemProp="headline"
            >
              <Rocket className="w-10 h-10 text-primary" aria-hidden="true" />
              <span itemProp="name">RocketQuiz</span>
            </h1>
            <p
              className="text-lg sm:text-xl text-gray-600 mb-6"
              itemProp="description"
            >
              The next-generation multiplayer quiz platform. Play, compete, and create quizzes with friends or the world. Fast, fun, and always free.
            </p>
            <div className="flex gap-4">
              <a
                href="/search"
                className="px-6 py-3 rounded-lg bg-primary text-white font-semibold text-lg shadow hover:bg-accent transition"
                itemProp="significantLink"
                aria-label="Discover quizzes to play"
              >
                Discover Quizzes
              </a>
              {!user && (
                <a
                  href="/register"
                  className="px-6 py-3 rounded-lg bg-secondary text-primary font-semibold text-lg shadow hover:bg-accent transition"
                  itemProp="significantLink"
                  aria-label="Create a new account"
                >
                  Create Account
                </a>
              )}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/rocketquiz-logo.png"
              alt="RocketQuiz platform logo showing a rocket"
              className="rounded-2xl shadow-2xl w-full max-w-md object-cover"
              loading="lazy"
              itemProp="image"
            />
          </div>
        </section>
        
        {/* Featured Quizzes Section */}
        <section
          aria-label="Featured Quizzes"
          itemScope
          itemType="https://schema.org/ItemList"
        >
          <meta itemProp="itemListOrder" content="Unordered" />
          <meta itemProp="numberOfItems" content="6" />
          <FeaturedQuizzes />
        </section>
      </main>
      <Footer />
    </div>
  );
}
