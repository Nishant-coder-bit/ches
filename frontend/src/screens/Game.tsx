import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useSocket } from "../hooks/useSocket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { ChatComponent } from "../components/ChatComponent";
import { SidebarComponent } from "../components/SidebarComponent";
import { TimerComponent } from "../components/TimerComponent";
import { TopBarComponent } from "../components/TopBarComponent";
import { Move } from "../utils/types";
import { GAME_OVER, INIT_GAME, INVALID_MOVE, MOVE } from "../utils/constants";
import { parsePGNToMoves } from "../utils/utilFormatter";
import { useSearchParams } from "react-router-dom";
import { join } from "path";

// Mock game data
const mockPlayers = {
  white: { name: "Alice", rating: 1780, avatar: "https://avatar.iran.liara.run/public/41" },
  black: { name: "Bob", rating: 1820, avatar: "https://avatar.iran.liara.run/public/42" },
};

export const Game = ({params}:any) => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  if(!userId){
    console.log("No userId found. Please login first.");
    return ;
  }
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [started, setStarted] = useState(false);
  const [moves, setMoves] = useState<Move[]>([]);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [turn, setTurn] = useState<"white" | "black">("white");
  const { socket, messages,sendMessage } = useSocket(userId);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [joinGame, setJoinGame] = useState(false);
  const lastMessageRef = useRef<any>(null);
  useEffect(() => {
    if (messages.length === 0) return;

    const message: any = messages[messages.length - 1];
    
    // Avoid processing the same message multiple times
    if (lastMessageRef.current === message) return;
    lastMessageRef.current = message;
  
    console.log("Received:", message);
      switch (message.type) {
        case 'GAME_START':
          setStarted(true);
          setPlayerColor(message.color);
          setGame(new Chess(message.fen));
          setMoves(parsePGNToMoves(message.moves));
          break;
        case 'GAME_RESTORED':
          console.log("Game restored");
          setStarted(true);
          setPlayerColor(message.color);
          setGame(new Chess(message.fen));
          setFen(message.fen);
          setMoves(parsePGNToMoves(message.moves));
          break;
        case 'GAME_UPDATE':
          const updatedGame = new Chess(game.fen()); // Clone the game state
          if (!message.lastMove || !message.lastMove.from || !message.lastMove.to) {
            console.error("Invalid move format received:", message.lastMove);
            return;
          }
          
          const legalMoves = updatedGame.moves({ verbose: true });
          const isMoveValid = legalMoves.some(
            (m) => m.from === message.lastMove.from && m.to === message.lastMove.to
          );
          
          if (!isMoveValid) {
            console.error("Received an illegal move:", message.lastMove);
            return;
          }
          
          updatedGame.move(message.lastMove);
          setGame(updatedGame);
          setFen(updatedGame.fen());
          
  
          setGame(updatedGame);
          setMoves((prev) => [...prev, message.payload]);
          setTurn(message.color === "white" ? "white" : "black");
          setFen(updatedGame.fen());
          break;

        case 'GAME_COMPLETED':
          setStarted(false);
          setJoinGame(false);
          setIsWaiting(false);
          setGame(new Chess(fen));
          alert(`Game Over! ${message.winner} wins!`);
          break;

        case INVALID_MOVE:
          setGame(new Chess(fen));
          break;
        case 'GAME_CREATED':
           setIsWaiting(false);
           setJoinGame(true);
          
           break;

        case GAME_OVER:
          setStarted(false);
          break;
      }
    // };
  }, [messages]);

  const handleMove = (move: Move) => {
    try {
      if ((game.turn() === "w" ? "white" : "black") !== playerColor) return false;
      
      const result = game.move(move);
      if (!result) return false;

      sendMessage(JSON.stringify({ type: MOVE, move: move ,userId:userId}));
      setFen(game.fen());
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
     
    <TopBarComponent />
    </header>
    <div className="min-h-screen bg-gray-50 font-sans">
   
      <div className="container mx-auto px-4 py-8 flex gap-6">
        <SidebarComponent moves={[]} playerColor={playerColor} />

        <main className="flex-1">
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="mb-6 flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={mockPlayers.white.avatar} className="w-12 h-12 rounded-full" />
                  <TimerComponent />
                </div>
                <div className="text-2xl font-bold text-gray-600">VS</div>
                <div className="flex items-center gap-3">
                  <TimerComponent  />
                  <img src={mockPlayers.black.avatar} className="w-12 h-12 rounded-full" />
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-xl">
                <Chessboard
                  position={fen}
                  onPieceDrop={(s, t) => handleMove({ from: s, to: t })}
                  boardWidth={480}
                  boardStyle={{ borderRadius: "8px" }}
                  customArrows={[]}
                  orientation={playerColor}
                  areArrowsAllowed
                />
              </div>

              {(!started && !joinGame) && (
                <button
                  onClick={() => sendMessage(JSON.stringify({ type:  'CREATE_GAME',userId:userId}))}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                  Create Game
                </button>
              )}
              {(!started && joinGame) && (
                <button
                  onClick={() => sendMessage(JSON.stringify({ type:  'JOIN_GAME',userId:userId}))}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                  Join Game
                </button>
              )}
            </div>
          </div>
        </main>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
        
        {isChatOpen && <ChatComponent />}
      </div>
    </div>
    </>
  );
};