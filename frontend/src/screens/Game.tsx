import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js"; // For handling chess logic
import { useSocket } from "../hooks/useSocket";

import axios from "axios";
import { MoveState } from "../components/MoveState";

export const INIT_GAME = "init_game";
export const INVALID_MOVE = "invalid_move";
export const MOVE = "move";
export const GAME_OVER = "game_over";

type Move = {
  from: string;
  to: string;
};

type User = {
  name: string;
  email: string;
};

export const Game = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start"); // FEN string to represent the board
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [boardKey, setBoardKey] = useState(0); // Key to force re-render
  const [movesState, setMovesState] = useState<Move[]>([]);
  const [playerColor, setPlayerColor] = useState("white");
  const [user, setUser] = useState<User | null>(null);
  const [turn, setTurn] = useState("white");
  const { socket, isConnected } = useSocket();

  console.log("getting user inside game page", user);

  async function getUserInfo() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const response = await axios.get("http://localhost:8080/user/userInfo", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      console.log("user info", response.data);
      setUser(response.data);
    } catch (e) {
      console.error("Error fetching user info", e);
    }
  }

  async function getAllGames() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const response = await axios.get("http://localhost:8080/user/userGameInfo", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      console.log("games ", response.data);
      setGames(response.data);
    } catch (e) {
      console.error("Error fetching games", e);
    }
  }

  function parsePGNToMoves(pgn: string): Move[] {
    const chess = new Chess();
    chess.loadPgn(pgn); // Load PGN

    const history = chess.history({ verbose: true }); // Get moves as objects
    console.log("history move ", history);
    return history.map((move) => ({
      from: move.from,
      to: move.to,
    }));
  }

  useEffect(() => {
    if (!socket) return;

    getUserInfo();
    getAllGames();

    socket.onopen = () => {
      console.log("Connected to WebSocket");
      const gameId = localStorage.getItem("gameId");
        if (gameId) {
             socket.send(JSON.stringify({ type: "reconnect_request", gameId:gameId }));
       }
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data.toString());
      console.log("message", message);

      switch (message.type) {
        case INIT_GAME:
          setStarted(true);
          setPlayerColor(message.color);
          setFen(message.payload.fen);
          localStorage.setItem("gameId", message.gameId); 
          setMovesState(parsePGNToMoves(message.payload.moves)); // Corrected parsing
          const turnFromFen = message.payload.fen.split(" ")[1] === "w" ? "white" : "black";
          setTurn(turnFromFen);
          setGame(new Chess(message.payload.fen));
          console.log("moves", message.payload.moves);
          break;

        case MOVE:
          const move = message.payload;
          game.move(move);
          setHistory((prevHistory) => [...prevHistory, game.fen()]); // Update history
          const turnFromFe = game.fen().split(" ")[1] === "w" ? "white" : "black";
          setTurn(turnFromFe);
          setFen(game.fen());
          break;

        case INVALID_MOVE:
          console.log("Invalid move");
          const previousFen = history[history.length - 2]; // Get the state before the invalid move
          if (previousFen) {
            setFen(previousFen);
          } else {
            setFen("start");
          }
          setBoardKey((prevKey) => prevKey + 1); // Force re-render
          console.log("Reverted to previous state:", previousFen);
          break;

        case GAME_OVER:
          console.log("Game is over");
          setFen("start");
          setStarted(false);
          break;

        default:
          console.warn("Unhandled message type:", message.type);
          break;
      }
    };
  }, [socket, game, history]);

  // Function to handle moves
  const handleMove = (move: Move): boolean => {
    try {
      const piece = game.get(move.from);
      const gameColor = game.turn();
      const playerTurnColor = gameColor === "w" ? "white" : "black";

      console.log("Game turn color:", turn);
      console.log("Player color:", playerColor);
      console.log("Piece at from:", piece);

      if (playerTurnColor !== playerColor) {
        console.warn("Not allowed: Wrong color player");
        return false;
      }
     
      const result = game.move({
        from: move.from,
        to: move.to,
      });

      if (!result) {
        console.warn("Invalid move");
        return false;
      }

      setMovesState((prevMoves) => [...prevMoves, move]); // Correct way to update state
      console.log("Moves Array:", movesState);
      
      socket?.send(
        JSON.stringify({
          type: "move",
          payload: move,
          
        })
      );

      setHistory((prevHistory) => [...prevHistory, game.fen()]);
      setFen(game.fen());
      return true;
    } catch (e) {
      console.error("Invalid move attempted locally", e);
      setFen(history[history.length - 1] || "start");
      setBoardKey((prevKey) => prevKey + 1); // Force re-render
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Chessboard Area */}
      <div className="flex flex-col items-center justify-center md:w-3/4 p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Chess Game</h1>
        <Chessboard
          key={boardKey}
          position={fen}
          onPieceDrop={(sourceSquare, targetSquare) =>
            handleMove({ from: sourceSquare, to: targetSquare })
          }
          boardWidth={480}
          boardStyle={{
            borderRadius: "10px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {/* Utility Area */}
      <div className="flex flex-col md:w-1/4 p-6 bg-white shadow-lg rounded-lg">
        {!started && (
          <button
            onClick={() => {
              console.log("Starting game...");
              socket?.send(JSON.stringify({ type: INIT_GAME }));
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition duration-300"
          >
            Play
          </button>
        )}
        {started && <MoveState movesState={movesState} />}
      </div>
    </div>
  );
};
