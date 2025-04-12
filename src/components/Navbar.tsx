import { LogIn, User, Rocket, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar({ user }: { user?: { name: string } }) {
  return (
    <nav className="w-full bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm fixed top-0 left-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-emerald-600">
          <Rocket className="w-7 h-7 text-emerald-500" />
          RocketQuiz
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/search"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">Browse Quizzes</span>
          </Link>
          {user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">{user.name}</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-emerald-50 transition"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                to="/register"
                className="ml-2 px-4 py-1.5 rounded-md bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
