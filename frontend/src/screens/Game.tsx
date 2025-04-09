import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useSocket } from "../hooks/useSocket";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faTimes } from "@fortawesome/free-solid-svg-icons";
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
// const boardRef = useRef<HTMLDivElement>(null);
export const Game = ({params}:any) => {
  // const [searchParams] = useSearchParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId") || '';
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [started, setStarted] = useState(false);
  const [moves, setMoves] = useState<Move[]>([]);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [turn, setTurn] = useState<"white" | "black">("white");
  const { socket, messages, sendMessage } = useSocket(userId);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [resetTimers, setResetTimers] = useState(false);
  const lastMessageRef = useRef<any>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleTimeOut = (color: "white" | "black") => {
    sendMessage(JSON.stringify({
      type: 'GAME_OVER',
      winner: color === "white" ? "black" : "white",
      reason: 'timeout'
    }));
    toast.success(`${color === "white" ? "Black" : "White"} wins by timeout!`);
  };

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
        setIsWaiting(false);
        setMoves(parsePGNToMoves(message.moves));
        setResetTimers(true);
        setTimeout(() => setResetTimers(false), 100);
        toast.success("Game started!");
        break;
      case 'MESSAGE_FROM_QUEUE':
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
                  // sendMessage(JSON.stringify({ type: 'DECLINE_GAME', userId }));
                  toast.dismiss(t.id);
                }}
              >
                Decline
              </button>
            </div>
          </div>
        
        ), { duration: 3000 });
        break;

      case 'GAME_JOINED':
        console.log("Game joined successfully");
        break;

      case 'GAME_RESTORED':
        setStarted(true);
        setPlayerColor(message.color);
        setGame(new Chess(message.fen));
        setFen(message.fen);
        setMoves(parsePGNToMoves(message.moves));
        setResetTimers(true);
        setTimeout(() => setResetTimers(false), 100);
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
        setMoves((prev) => [...prev, message.lastMove]);
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
                  // sendMessage(JSON.stringify({ type: 'DECLINE_GAME', userId }));
                  toast.dismiss(t.id);
                }}
              >
                Decline
              </button>
            </div>
          </div>
        ), { duration: 3000 });
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
          setResetTimers(true);
          setTimeout(() => setResetTimers(false), 100);
          toast.success(message.type === 'GAME_COMPLETED' 
            ? `Game Over! ${message.winner} wins!`
            : `Game stopped successfully ${message.winnerId}`);
          
          break;

          case 'ERROR':
            toast.error(message.message);
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
        position="top-center"
        toastOptions={{
          className: 'font-sans',
          style: {
            padding: '16px',
            color: '#1f2937',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          },
        }}
      />
      
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <TopBarComponent userId = {userId}/>
        {started && (
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to resign?")) {
                sendMessage(JSON.stringify({ 
                  type: 'STOP_GAME', 
                  userId: userId,
                  reason: 'player_resignation'
                }));
                toast.loading("Resigning...",{duration: 500});
              }
            }}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <FontAwesomeIcon icon={faTimes} />
            <span className="hidden sm:inline">Resign</span>
          </button>
        )}
      </header>

      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="container mx-auto px-4 py-8 flex gap-6 flex-col lg:flex-row">
          <SidebarComponent moves={moves} playerColor={playerColor} />

          <main className="flex-1 order-first lg:order-none">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-gray-100 p-4 rounded-lg space-y-4 sm:space-y-0">
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm w-full sm:w-auto justify-between">
                  <div className="flex items-center gap-3">
                    <img src={mockPlayers.white.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow" />
                    <div className="text-sm">
                      <p className="font-semibold">{mockPlayers.white.name}</p>
                      <p className="text-gray-600">Rating: {mockPlayers.white.rating}</p>
                    </div>
                  </div>
                  <TimerComponent 
                    color="white"
                    isActive={started}
                    isCurrentTurn={turn === 'white'}
                    onTimeOut={handleTimeOut}
                    reset={resetTimers}
                    className="ml-2"
                  />
                </div>

                <div className="text-2xl font-bold text-gray-600 hidden sm:block">VS</div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm w-full sm:w-auto justify-between">
                <TimerComponent
                    color="black"
                    isActive={started}
                    isCurrentTurn={turn === 'black'}
                    onTimeOut={handleTimeOut}
                    reset={resetTimers}
                    className="mr-2"
                  />
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-right">
                      <p className="font-semibold">{mockPlayers.black.name}</p>
                      <p className="text-gray-600">Rating: {mockPlayers.black.rating}</p>
                    </div>
                    <img src={mockPlayers.black.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow" />
                  </div>
                </div>
              </div>

              <div className="bg-chess-pattern bg-gray-100 p-4 rounded-xl relative">
                <div ref={boardRef} className="max-w-full mx-auto">
                  <Chessboard
                    position={fen}
                    onPieceDrop={(s, t) => handleMove({ from: s, to: t })}
                    boardWidth={Math.min(640, boardRef.current?.offsetWidth || 480)}
                    boardStyle={{
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                    customDarkSquareStyle={{ backgroundColor: '#779556' }}
                    customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                    customArrows={[]}
                    orientation={playerColor}
                    areArrowsAllowed
                  />
                </div>
                
                {!started && (
                  <div className="mt-6 space-y-4">
                    <button
                      onClick={() => {
                        
                        sendMessage(JSON.stringify({ type: 'CREATE_GAME', userId }));
                        setIsWaiting(true);
                        // toast.loading("Finding opponent...");
                        // toast.custom((t) => (
                        //   <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col gap-3">
                        //     <p className="text-gray-800">Searching for an opponent...</p>
                        //     <div className="flex gap-2">
                        //       <button
                        //         className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        //         onClick={() => {
                        //           sendMessage(JSON.stringify({ type: 'STOP_GAME', userId }));
                        //           toast.dismiss(t.id);
                        //         }}
                        //       >
                        //         Cancel
                        //       </button>
                        //     </div>
                        //   </div>
                        // ), { duration: 3000 });
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg hover:opacity-90 transition-opacity font-semibold flex items-center justify-center gap-2"
                      disabled={isWaiting}
                    >
                      {isWaiting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Searching...
                        </>
                      ) : (
                         
                            "Start New Game"
                    
                       
                      )}
                    </button>
                    <p className="text-center text-sm text-gray-600 mt-2">
                      Average wait time: <span className="font-medium">15 seconds</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>

          <div className={`fixed bottom-8 right-8 transition-transform ${isChatOpen ? 'translate-x-0' : 'translate-x-32'}`}>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors relative"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              {!isChatOpen && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  3
                </span>
              )}
            </button>
             {isChatOpen&&  <ChatComponent  />}
          </div>
        </div>
      </div>
    </>
  );
};