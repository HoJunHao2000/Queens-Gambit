import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from "react-router";
import Game from "./chess_client/game/Game";
import MainPage from "./chess_client/main/MainPage";
import { GameProvider } from "./chess_client/context/GameContext";
// import Ai from "./chess_AI/ai";

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" exact element={<MainPage />} />
          <Route path="/game" element={<Game />} />
          {/* <Route path="/AI" exact element={<Ai />} /> */}
        </Routes>
      </GameProvider>
    </BrowserRouter>
  );
}
