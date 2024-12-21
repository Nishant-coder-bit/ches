import React, { useEffect, useState } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js"; // For handling chess logic
import { useSocket } from "../hooks/useSocket";
import { useLocation } from "react-router-dom";
export const INIT_GAME = "init_game";
export const INVALID_MOVE = "invalid_move";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const Game = () => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start"); // FEN string to represent the board
  const [started,setStarted] = useState(false);
  const location = useLocation();
  const [history, setHistory] = useState<string[]>([]);
   const queryParams = new URLSearchParams(location.search); 
   const email = queryParams.get('email');
   console.log("fetching email and passing to socket",email);
  const socket = useSocket({email});
  useEffect(() => {
    if (!socket) return;
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("message",message);
      switch (message.type) {
        case INIT_GAME:
          setStarted(true);
          console.log("game initailized");
          break;
        case MOVE:
            const move = message.payload;
            game.move(move);
            setFen(game.fen());
            setHistory((prevHistory) => [...prevHistory, game.fen()]); // Update history
          console.log("move made");
          break;

        case INVALID_MOVE:
          console.log("invalid move")
          const previousFen = history[history.length - 2]; 
          console.log(previousFen === game.fen());
          console.log(previousFen);
          if(previousFen === undefined){
            setFen("start")
          }
          else{
           setFen(previousFen)
          }
          break;
          // setFen(game.fen());
        case GAME_OVER:
          console.log("game is overed");
          break;

      }
    };
  }, [socket,game,history]);
  // Function to handle moves
  const handleMove = (move: { from: string; to: string }) => {
    socket?.send(JSON.stringify({
        type:"move",
        payload:{
           from:move.from,
           to:move.to

        }
     }))
    const result = game.move({
      from: move.from,
      to: move.to,
    });

    if (result) {
      setFen(game.fen());
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Chessboard Area */}
      <div className="flex flex-col items-center justify-center md:w-3/4 p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Chess Game</h1>
        <Chessboard
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
        {!started &&  <button
          onClick={() => {
            socket?.send(
              JSON.stringify({
                type: INIT_GAME,
              })
            );
            console.log("game initialised");
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition duration-300"
        >
          Play-
        </button>}
       
      </div>
    </div>
  );
};
