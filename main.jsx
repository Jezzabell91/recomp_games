import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import RecompGames from "./claude_recomp_games.tsx";
import Home from "./pages/Home.jsx";
import Admin from "./pages/Admin.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RecompGames />} />
          <Route path="/app" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
