import { LogIn, User, Rocket, Search, Plus, Loader2 } from "lucide-react"; // Added Loader2
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseClient";
import { User as FirebaseUser } from "firebase/auth"; // Import FirebaseUser type

interface NavbarProps {
  user: FirebaseUser | null;
  isLoading: boolean;
}

export default function Navbar({ user, isLoading }: NavbarProps) { // Updated props
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
    
              {/* Auth Buttons Section */}
              <div className="flex items-center gap-2">
                {isLoading ? (
                  // Show a loading indicator while checking auth state
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : user ? (
                  // User is logged in
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:text-secondary transition"
                    >
                      <User className="w-5 h-5" />
                      {/* Display user's email */}
                      {/* Ensure user is not null before accessing email */}
                      <span className="hidden sm:inline">{user?.email || "Profile"}</span>
                    </Link>
                    <button
                      onClick={() => signOut(auth)}
                      className="ml-2 px-4 py-1.5 rounded-md bg-warning text-neutral font-semibold hover:bg-accent transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  // User is logged out
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
      </div>
    </nav>
  );
}
