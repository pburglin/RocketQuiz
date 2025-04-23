import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseClient";
import { useNavigate } from "react-router-dom"; // Re-add useNavigate import

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Re-add navigate variable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Revert back to client-side navigation
      navigate("/");
    } catch (err: unknown) { // Use unknown for error type
      // Type guard to check if err is an Error object
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-secondary/20 to-accent/20">
      <div className="w-full max-w-md p-8 bg-base-100 rounded shadow-lg border border-neutral">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-neutral rounded bg-base-100"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-neutral rounded bg-base-100"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-error text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 bg-primary text-white rounded hover:bg-accent transition disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <span>Don't have an account? </span>
          <a href="/register" className="text-primary hover:text-accent hover:underline">
            Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;