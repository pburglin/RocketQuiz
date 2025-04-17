import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseClient";
import { deleteUser, User as FirebaseUser } from "firebase/auth";

type ProfileProps = {
  user: FirebaseUser | null;
};

const NICKNAME_KEY = "rocketquiz_nickname";
// const THEME_KEY = "rocketquiz_theme"; // Theme is likely handled globally now

export default function Profile({ user }: ProfileProps) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  // const [theme, setTheme] = useState<"light" | "dark">("light"); // Remove local theme state
  const [loading, setLoading] = useState(false);

  // Load nickname from localStorage on mount
  useEffect(() => {
    const storedNickname = localStorage.getItem(NICKNAME_KEY) || "";
    setNickname(storedNickname);
    // const storedTheme = (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
    // setTheme(storedTheme);
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
      {/* Remove UI Theme selection section */}
      {/* <div className="mb-4">
        <label className="block font-semibold mb-1 text-gray-700">UI Theme</label>
        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={true} // Default or based on global state
              // onChange={handleThemeChange} // Removed
            />
            <span className="ml-1">Light</span>
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={false} // Default or based on global state
              // onChange={handleThemeChange} // Removed
            />
            <span className="ml-1">Dark</span>
          </label>
        </div>
      </div> */}
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