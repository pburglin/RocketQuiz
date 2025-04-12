import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SearchQuiz from "./pages/SearchQuiz";
import CreateQuiz from "./pages/CreateQuiz";
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
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchQuiz />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
