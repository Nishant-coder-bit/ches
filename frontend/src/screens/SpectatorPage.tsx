import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js"; // Ensure you have chess.js installed

export const SpectatorPage = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState("start"); // Board position in FEN format

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !gameId) return;
  
    const ws = new WebSocket(`ws://localhost:8080?gameId=${gameId}`);
  
    ws.onopen = () => ws.send(JSON.stringify({ type: "join_spectator", payload: { gameId } }));
    ws.onerror = (err) => console.error("❌ WebSocket error:", err);
    ws.onclose = () => console.log("🔌 Disconnected from game");
  
    ws.onmessage = (event) => {
      console.log("📩 WebSocket message received:", event.data);
      const message = JSON.parse(event.data);
  
      if (message.type === "move") {
        console.log("♟️ Move received:", message.payload);
        const { from, to } = message.payload;
  
        setGame((prevGame) => {
          const newGame = new Chess(prevGame.fen());
          newGame.move({ from, to });
          setPosition(newGame.fen());
          return newGame;
        });
      }
    };
  
    return () => ws.close();
  }, [gameId]);
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-4">Spectating Game {gameId}</h1>
      <div className="flex justify-center">
        <Chessboard position={position} />
      </div>
    </div>
  );
};
