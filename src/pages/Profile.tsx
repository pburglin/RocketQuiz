import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Add Link
import { auth, db } from "../firebaseClient"; // Add db
import { deleteUser, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"; // Add Firestore functions
import { Lock, Globe } from "lucide-react"; // Import icons

type ProfileProps = {
  user: FirebaseUser | null;
};

// Define Quiz interface for type safety
interface Quiz {
  id: string;
  title: string;
  isPrivate?: boolean;
  createdAt?: { seconds: number; nanoseconds: number }; // Firestore Timestamp
}

const NICKNAME_KEY = "rocketquiz_nickname";
// const THEME_KEY = "rocketquiz_theme"; // Theme is likely handled globally now

export default function Profile({ user }: ProfileProps) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  // const [theme, setTheme] = useState<"light" | "dark">("light"); // Remove local theme state
  const [loading, setLoading] = useState(false);
  const [userQuizzes, setUserQuizzes] = useState<Quiz[]>([]); // State for user's quizzes
  const [quizzesLoading, setQuizzesLoading] = useState(true); // State for quizzes loading

  // Load nickname from localStorage on mount
  useEffect(() => {
    const storedNickname = localStorage.getItem(NICKNAME_KEY) || "";
    setNickname(storedNickname);
    // const storedTheme = (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
    // setTheme(storedTheme);
  }, []);

  // Fetch user's quizzes
  useEffect(() => {
    const fetchUserQuizzes = async () => {
      if (!user) return;
      
      setQuizzesLoading(true);
      try {
        const quizzesRef = collection(db, "quizzes");
        const q = query(
          quizzesRef, 
          where("createdBy", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const quizzes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Quiz[];
        setUserQuizzes(quizzes);
      } catch (error) {
        console.error("Error fetching user quizzes:", error);
      } finally {
        setQuizzesLoading(false);
      }
    };

    fetchUserQuizzes();
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  if (user === null) {
    // Optionally show a loading spinner here
    return null;
  }


  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleSaveNickname = () => {
    localStorage.setItem(NICKNAME_KEY, nickname);
  };

  // Remove theme change handler
  // const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newTheme = e.target.value as "light" | "dark";
  //   setTheme(newTheme);
  //   localStorage.setItem(THEME_KEY, newTheme);
  // };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        alert("Account deleted.");
        navigate("/");
      }
    } catch (err: unknown) { // Use unknown type
       const errorMessage = err instanceof Error ? err.message : String(err);
      alert("Error deleting account: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Apply base styling directly, remove theme conditional logic
    <div
      className="max-w-lg mx-auto mt-12 p-6 rounded-lg shadow bg-base-100 text-gray-900" // Use base background
    >
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="mb-4">
        <label className="block font-semibold mb-1 text-gray-700">Email</label> {/* Default text color */}
        <div className="p-2 rounded bg-neutral">{user.email}</div> {/* Use neutral background */}
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1 text-gray-700" htmlFor="nickname"> {/* Default text color */}
          Default Nickname for Multiplayer
        </label>
        <input
          id="nickname"
          type="text"
          className="w-full p-2 border rounded bg-neutral border-gray-300" // Use neutral background, add default border
          value={nickname}
          onChange={handleNicknameChange}
        />
        <button
          className="mt-2 px-4 py-2 text-white rounded bg-primary hover:bg-primary/90" // Use primary color
          onClick={handleSaveNickname}
        >
          Save Nickname
        </button>
      </div>

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-bold mb-4">My Quizzes</h2>
        {quizzesLoading ? (
          <div className="text-gray-500">Loading your quizzes...</div>
        ) : userQuizzes.length === 0 ? (
          <div className="text-gray-500">You haven't created any quizzes yet.</div>
        ) : (
          <div className="grid gap-4">
            {userQuizzes.map((quiz) => (
              <div key={quiz.id} className="p-4 border rounded bg-white shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{quiz.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    {quiz.isPrivate ? (
                      <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Lock className="w-3 h-3 mr-1" /> Private
                      </span>
                    ) : (
                      <span className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        <Globe className="w-3 h-3 mr-1" /> Public
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                   <Link 
                    to={`/play/quiz/${quiz.id}/details`}
                    className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90"
                  >
                    Play
                  </Link>
                  <Link 
                    to={`/play/quiz/${quiz.id}/multiplayer/lobby`}
                    className="px-3 py-1 bg-secondary text-white text-sm rounded hover:bg-secondary/90"
                  >
                    Host
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          className="px-4 py-2 text-white rounded bg-error hover:bg-error/90 disabled:opacity-50" // Use error color
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}