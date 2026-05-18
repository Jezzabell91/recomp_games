import React from "react";
import { createRoot } from "react-dom/client";
import RecompGames from "./claude_recomp_games.tsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RecompGames />
  </React.StrictMode>
);
