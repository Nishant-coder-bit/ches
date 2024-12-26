import React, { useEffect, useState } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js"; // For handling chess logic
import { useSocket } from "../hooks/useSocket";
import { useLocation } from "react-router-dom";
import axios from "axios";

export const INIT_GAME = "init_game";
export const INVALID_MOVE = "invalid_move";
export const MOVE = "move";
export const GAME_OVER = "game_over";

export const Game = () => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start"); // FEN string to represent the board
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [boardKey, setBoardKey] = useState(0); // Key to force re-render
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");
  console.log("fetching email and passing to socket", email);
  const socket = useSocket({ email });

  async function getAllGames() {
    const token = localStorage.getItem("token");
    console.log(token);
    if (!token) {
      throw new Error("No token found");
    }

    try{
        // Set the Authorization header
      const response = await axios.get("http://localhost:8080/user/userGameInfo", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
        
    console.log("games ", response.data);
    setGames(response.data);
    }catch(e){
      console.log("error in fetching games",e);
    }
  
 
  }

  useEffect(() => {
    if (!socket) return;
    getAllGames();
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("message", message);
      switch (message.type) {
        case INIT_GAME:
          setStarted(true);
          console.log("game initialized");
          break;
        case MOVE:
          const move = message.payload;
          game.move(move);
          setHistory((prevHistory) => [...prevHistory, game.fen()]); // Update history
          setFen(game.fen());
          console.log("move made");
          break;
        case INVALID_MOVE:
          console.log("invalid move");
          const previousFen = history[history.length - 2]; // Get the state before the invalid move
          if (previousFen) {
            setFen(previousFen);
            setBoardKey(prevKey => prevKey + 1); // Force re-render
          } else {
            setFen("start");
            setBoardKey(prevKey => prevKey + 1); // Force re-render
          }
          console.log("Reverted to previous state:", previousFen);
          break;
        case GAME_OVER:
          console.log("game is over");
          break;
      }
    };
  }, [socket, game, history]);

  // Function to handle moves
  const handleMove = (move: { from: string; to: string }) => {
//      socket?.send(JSON.stringify({
//     type:"move",
//     payload:{
//        from:move.from,
//        to:move.to

//     }
//  }))   
  try{
    const result = game.move({
      from: move.from,
      to: move.to,
    });
    socket?.send(JSON.stringify({
      type:"move",
      payload:{
         from:move.from,
         to:move.to
  
      }
   }))    
        setHistory((prevHistory) => [...prevHistory, game.fen()]); // Update history
        setFen(game.fen());
  } 
  catch(e){
    console.log("Invalid move attempted locally");
    const previousFen = history[history.length - 1]; // Revert to previous state
    setFen(previousFen || "start");
    setBoardKey(prevKey => prevKey + 1); // Force re-ren
  }
  
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Chessboard Area */}
      <div className="flex flex-col items-center justify-center md:w-3/4 p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Chess Game</h1>
        <Chessboard
          key={boardKey}  // Ensure Chessboard re-renders when key changes
          position={fen}
          onDrop={(move) =>
            handleMove({ from: move.sourceSquare, to: move.targetSquare })
          }
          width={480}
          boardStyle={{
            borderRadius: "10px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {/* Utility Area */}
      <div className="flex flex-col md:w-1/4 p-6 bg-white shadow-lg rounded-lg">
        {/* Play Button */}
        {!started && (
          <button
            onClick={() => {
              socket?.send(
                JSON.stringify({
                  type: INIT_GAME,
                })
              );
              console.log("game initialized");
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition duration-300"
          >
            Play
          </button>
        )}
      </div>
    </div>
  );
};
