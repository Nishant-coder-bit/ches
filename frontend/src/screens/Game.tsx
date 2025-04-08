import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useSocket } from "../hooks/useSocket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import toast, { Toaster } from "react-hot-toast";
import { ChatComponent } from "../components/ChatComponent";
import { SidebarComponent } from "../components/SidebarComponent";
import { TimerComponent } from "../components/TimerComponent";
import { TopBarComponent } from "../components/TopBarComponent";
import { Move } from "../utils/types";
import { GAME_OVER, INIT_GAME, INVALID_MOVE, MOVE } from "../utils/constants";
import { parsePGNToMoves } from "../utils/utilFormatter";
import { useSearchParams } from "react-router-dom";

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
  const lastMessageRef = useRef<any>(null);

  useEffect(() => {
    if (messages.length === 0) return;

    const message: any = messages[messages.length - 1];
    
    if (lastMessageRef.current === message) return;
    lastMessageRef.current = message;
  
    console.log("Received:", message);
    switch (message.type) {
      case 'GAME_START':
        setStarted(true);
        setPlayerColor(message.color);
        setGame(new Chess(message.fen));
        setMoves(parsePGNToMoves(message.moves));
        toast.success("Game started!");
        break;
      case 'GAME_RESTORED':
        setStarted(true);
        setPlayerColor(message.color);
        setGame(new Chess(message.fen));
        setFen(message.fen);
        setMoves(parsePGNToMoves(message.moves));
        toast("Game restored");
        break;
      case 'GAME_UPDATE':
        const updatedGame = new Chess(game.fen());
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
        setMoves((prev) => [...prev, message.payload]);
        setTurn(message.color === "white" ? "white" : "black");
        break;

      case 'GAME_COMPLETED':
        setStarted(false);
        setIsWaiting(false);
        setFen("start");
        setGame(new Chess(fen));
        toast.success(`Game Over! ${message.winner} wins!`);
        break;

      case INVALID_MOVE:
        toast.error("Invalid move!");
        setGame(new Chess(fen));
        break;

      case 'GAME_CREATED':
        toast.custom((t) => (
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col gap-3">
            <p className="text-gray-800">New game invite received!</p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => {
                  sendMessage(JSON.stringify({ type: 'JOIN_GAME', userId }));
                  toast.dismiss(t.id);
                }}
              >
                Accept
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => {
                  sendMessage(JSON.stringify({ type: 'DECLINE_GAME', userId }));
                  toast.dismiss(t.id);
                }}
              >
                Decline
              </button>
            </div>
          </div>
        ), { duration: 60000 });
        break;

      case GAME_OVER:
        setStarted(false);
        toast.success("Game over!");
        break;
      case 'GAME_TERMINATED':
         setStarted(false);
         setIsWaiting(false);
         setGame(new Chess());
         setFen("start");
         toast.success(`Game stopped successfully ${message.winnerId}`,{duration: 6000});
         break;
    }
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
       <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans',
          style: {
            padding: '16px',
            color: '#1f2937',
          },
        }}
      />
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <TopBarComponent />
      // Add this in your component JSX (below TopBarComponent in header)
<header className="bg-gray-900 text-white p-4 flex justify-between items-center">
  <TopBarComponent />
  {started && (
    <button
      onClick={() => {
        if (window.confirm("Are you sure you want to stop the game?")) {
          sendMessage(JSON.stringify({ 
            type: 'STOP_GAME', 
            userId: userId,
            reason: 'player_resignation'
          }));
          toast.loading("Stopping game...");
        }
      }}
      disabled={!started}
      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Stop Game
    </button>
  )}
</header>
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

              {!started && (
                <button
                  onClick={() => {
                    sendMessage(JSON.stringify({ type: 'CREATE_GAME', userId }));
                    toast.loading("Creating game...");
                  }}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                  Create Game
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