import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SearchQuiz from "./pages/SearchQuiz";
import CreateQuiz from "./pages/CreateQuiz";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchQuiz />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
