import { LogIn, User, Rocket, Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseClient";

export default function Navbar({ user }: { user?: { name: string } }) {
  return (
    <nav className="w-full bg-primary text-white border-b border-secondary shadow-md fixed top-0 left-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <Rocket className="w-7 h-7 text-secondary" />
          RocketQuiz
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/search"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:text-secondary transition"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">Browse</span>
          </Link>
          <Link
            to="/create-quiz"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:text-secondary transition"
          >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Create</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:text-secondary transition"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <button
                onClick={() => signOut(auth)}
                className="ml-2 px-4 py-1.5 rounded-md bg-warning text-neutral font-semibold hover:bg-accent transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:text-secondary transition"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                to="/register"
                className="ml-2 px-4 py-1.5 rounded-md bg-warning text-neutral font-semibold hover:bg-accent transition"
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
