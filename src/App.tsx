import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SearchQuiz from "./pages/SearchQuiz";
import CreateQuiz from "./pages/CreateQuiz";
import PlayQuiz from "./pages/PlayQuiz";
import QuizDetailsPage from "./pages/QuizDetailsPage";
import SinglePlayerPage from "./pages/SinglePlayerPage";
import MultiplayerLobbyPage from "./pages/MultiplayerLobbyPage";
import MultiplayerGamePage from "./pages/MultiplayerGamePage";
import ResultsPage from "./pages/ResultsPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import { useEffect, useState } from "react";
import { auth } from "./firebaseClient";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Navbar user={user ? { name: user.email || "User" } : undefined} />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/search" element={<SearchQuiz />} />
          <Route path="/create-quiz" element={<CreateQuiz user={user} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quiz/:id" element={<PlayQuiz user={user} />} />
          <Route path="/play/quiz/:id" element={<PlayQuiz user={user} />} />
          <Route path="/play/quiz/:id/details" element={<QuizDetailsPage />} />
          <Route path="/play/quiz/:id/single" element={<SinglePlayerPage />} />
          <Route path="/play/quiz/:id/multiplayer/lobby" element={<MultiplayerLobbyPage />} />
          <Route path="/play/quiz/:id/multiplayer/game" element={<MultiplayerGamePage />} />
          <Route path="/play/quiz/:id/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
