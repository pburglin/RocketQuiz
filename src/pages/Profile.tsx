import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseClient";
import { deleteUser, User as FirebaseUser } from "firebase/auth";

type ProfileProps = {
  user: FirebaseUser | null;
};

const NICKNAME_KEY = "rocketquiz_nickname";
const THEME_KEY = "rocketquiz_theme";

export default function Profile({ user }: ProfileProps) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loading, setLoading] = useState(false);

  // Load nickname and theme from localStorage on mount
  useEffect(() => {
    const storedNickname = localStorage.getItem(NICKNAME_KEY) || "";
    setNickname(storedNickname);
    const storedTheme = (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
    setTheme(storedTheme);
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

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

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.value as "light" | "dark";
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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
    } catch (err: any) {
      alert("Error deleting account: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1">Email</label>
        <div className="p-2 bg-gray-100 rounded">{user.email}</div>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1" htmlFor="nickname">
          Default Nickname for Multiplayer
        </label>
        <input
          id="nickname"
          type="text"
          className="w-full p-2 border rounded"
          value={nickname}
          onChange={handleNicknameChange}
        />
        <button
          className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          onClick={handleSaveNickname}
        >
          Save Nickname
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-1">UI Theme</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === "light"}
              onChange={handleThemeChange}
            />
            <span className="ml-1">Light</span>
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === "dark"}
              onChange={handleThemeChange}
            />
            <span className="ml-1">Dark</span>
          </label>
        </div>
      </div>
      <div className="mt-8">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={handleDeleteAccount}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}