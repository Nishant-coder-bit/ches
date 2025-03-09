import React, { useEffect, useState, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useSocket } from "../hooks/useSocket";
import axios from "axios";
import { MoveState } from "../components/MoveState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChess, faUserCircle, faSignOutAlt, faTimes, faPaperPlane, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const INIT_GAME = "init_game";
const INVALID_MOVE = "invalid_move";
const MOVE = "move";
const GAME_OVER = "game_over";

type Move = {
  from: string;
  to: string;
};

type User = {
  name: string;
  email: string;
  avatarUrl: string;
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const MoveHistory = React.memo(({ movesState }: { movesState: Move[] }) => {
  const [formattedMoves, setFormattedMoves] = useState<Array<{ moveNumber: number, whiteMove?: string, blackMove?: string }>>([]);

  useEffect(() => {
    const newFormattedMoves: Array<{ moveNumber: number, whiteMove?: string, blackMove?: string }> = [];
    let moveNumber = 1;
    for (let i = 0; i < movesState.length; i += 2) {
      newFormattedMoves.push({
        moveNumber,
        whiteMove: movesState[i] ? `${movesState[i].from}-${movesState[i].to}` : undefined,
        blackMove: movesState[i + 1] ? `${movesState[i + 1].from}-${movesState[i + 1].to}` : undefined,
      });
      moveNumber++;
    }
    setFormattedMoves(newFormattedMoves);
  }, [movesState]);

  return (
    <div className="bg-gray-50 p-4 rounded-md shadow-inner max-h-60 overflow-y-auto w-full md:w-64">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="font-semibold">#</div>
        <div className="font-semibold text-center">White</div>
        <div className="font-semibold text-center">Black</div>
        {formattedMoves.map((move, index) => (
          <React.Fragment key={index}>
            <div>{move.moveNumber}</div>
            <div className="text-center">{move.whiteMove}</div>
            <div className="text-center">{move.blackMove}</div>
          </React.Fragment>
        ))}
      </div>
      {movesState.length === 0 && <p className="text-sm text-gray-500">Start a new game to see moves.</p>}
    </div>
  );
});


export const Game = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [boardKey, setBoardKey] = useState(0);
  const [movesState, setMovesState] = useState<Move[]>([]);
  const [playerColor, setPlayerColor] = useState("white");
  const [user, setUser] = useState<User | null>(null);
  const [turn, setTurn] = useState("white");
  const { socket, isConnected } = useSocket();
  const [whiteTimer, setWhiteTimer] = useState<number>(300); // 5 minutes for white
  const [blackTimer, setBlackTimer] = useState<number>(300); // 5 minutes for black
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const timerInterval = useRef<number | null>(null);
  const [isSpectator, setIsSpectator] = useState(false); // Mock spectator mode

  // Mock data
  const mockUser: User = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatarUrl: "https://via.placeholder.com/150/888888/FFFFFF?text=JD",
  };
  const mockGames = [
    { id: 1, name: "Game vs Alice", status: "Ongoing" },
    { id: 2, name: "Game vs Bob", status: "Waiting" },
  ];
  const mockHistory = [
    "e4 e5", "Nf3 Nc6", "Bb5 a6", "Ba4 Nf6", "O-O Be7", "Re1 b5", "Bb3 O-O", "c3 d5",
  ];
  const mockChatMessages = ["User1: Hello!", "User2: Hi there!"];


  useEffect(() => {
    setUser(mockUser);
    setGames(mockGames);
    setHistory(mockHistory);
    setChatMessages(mockChatMessages);

    if (!socket) return;

    socket.onopen = () => {
      console.log("Connected to WebSocket");
      const gameId = localStorage.getItem("gameId");
      if (gameId) {
        socket.send(JSON.stringify({ type: "reconnect_request", gameId: gameId }));
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
          setMovesState(parsePGNToMoves(message.payload.moves));
          const turnFromFen = message.payload.fen.split(" ")[1] === "w" ? "white" : "black";
          setTurn(turnFromFen);
          setGame(new Chess(message.payload.fen));
          console.log("moves", message.payload.moves);
          startTimer(turnFromFen); // Start timer when game inits
          break;

        case MOVE:
          const move = message.payload;
          game.move(move);
          setHistory((prevHistory) => [...prevHistory, game.fen()]);
          const turnFromFe = game.fen().split(" ")[1] === "w" ? "white" : "black";
          setTurn(turnFromFe);
          setFen(game.fen());
          startTimer(turnFromFe); // Switch timer on move
          break;

        case INVALID_MOVE:
          console.log("Invalid move");
          const previousFen = history[history.length - 2];
          if (previousFen) {
            setFen(previousFen);
          } else {
            setFen("start");
          }
          setBoardKey((prevKey) => prevKey + 1);
          console.log("Reverted to previous state:", previousFen);
          break;

        case GAME_OVER:
          console.log("Game is over");
          setFen("start");
          setStarted(false);
          stopTimer(); // Stop timer on game over
          break;

        default:
          console.warn("Unhandled message type:", message.type);
          break;
      }
    };
  }, [socket, game, history]);


  useEffect(() => {
    if (turn === "white" && started) {
      startTimer("white");
    } else if (turn === "black" && started) {
      startTimer("black");
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, started]);


  const startTimer = (currentPlayerColor: "white" | "black") => {
    stopTimer(); // Clear any existing timer

    timerInterval.current = setInterval(() => {
      if (currentPlayerColor === "white") {
        setWhiteTimer((prevTime) => {
          if (prevTime <= 0) {
            stopTimer();
            console.log("Black wins on time!");
            return 0;
          }
          return prevTime - 1;
        });
      } else {
        setBlackTimer((prevTime) => {
          if (prevTime <= 0) {
            stopTimer();
            console.log("White wins on time!");
            return 0;
          }
          return prevTime - 1;
        });
      }
    }, 1000) as any;
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };


  function parsePGNToMoves(pgn: string): Move[] {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    console.log("history move ", history);
    return history.map((move) => ({ from: move.from, to: move.to }));
  }

  const handleMove = (move: Move): boolean => {
    if (isSpectator) {
      console.log("Spectator mode: moves are disabled.");
      return false; // Prevent moves in spectator mode
    }
    try {
      const piece = game.get(move.from);
      const gameColor = game.turn();
      const playerTurnColor = gameColor === "w" ? "white" : "black";

      if (playerTurnColor !== playerColor) {
        console.warn("Not allowed: Wrong color player");
        return false;
      }

      const result = game.move({ from: move.from, to: move.to });
      if (!result) {
        console.warn("Invalid move");
        return false;
      }

      setMovesState((prevMoves) => [...prevMoves, move]);

      socket?.send(JSON.stringify({ type: MOVE, payload: move }));

      setHistory((prevHistory) => [...prevHistory, game.fen()]);
      setFen(game.fen());
      return true;
    } catch (e) {
      console.error("Invalid move attempted locally", e);
      setFen(history[history.length - 1] || "start");
      setBoardKey((prevKey) => prevKey + 1);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("gameId");
    setUser(null);
    setGames([]);
    setHistory([]);
    setStarted(false);
    setFen("start");
    setGame(new Chess());
    setBoardKey((prevKey) => prevKey + 1);
    stopTimer();
    console.log("Logged out and game state reset.");
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const sendChatMessage = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, `You: ${chatInput}`]); // Mock sending message
      setChatInput("");
    }
  };

  const toggleDrawer = () => {
    setIsDrawerCollapsed(!isDrawerCollapsed);
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Bar */}
      <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faChess} className="mr-2 text-blue-500 text-xl" />
          <h1 className="text-xl font-bold">Modern Chess</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setIsSpectator(!isSpectator)} className={`px-3 py-2 rounded-md text-sm ${isSpectator ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-white'} hover:bg-gray-800 focus:outline-none`}>
            {isSpectator ? "Spectator Mode ON" : "Spectator Mode OFF"}
          </button>
          <button onClick={handleLogout} className="px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 focus:outline-none">
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" /> Logout
          </button>
          <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex md:flex-row flex-col">
        {/* Sidebar Drawer */}
        <aside className={` ${isDrawerCollapsed ? 'w-14' : 'md:w-1/4'} bg-white p-6 shadow-md rounded-lg md:block transition-all duration-300 overflow-hidden`}>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
            <button onClick={toggleDrawer} className="md:hidden focus:outline-none">
              <FontAwesomeIcon icon={isDrawerCollapsed ? faChevronRight : faChevronLeft} />
            </button>
          </div>
          {!isDrawerCollapsed && (
            <>
              <div className="flex items-center mb-6">
                <img
                  src={user?.avatarUrl || mockUser.avatarUrl}
                  alt="Profile Avatar"
                  className="w-16 h-16 rounded-full mr-4 border-2 border-gray-300"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-700">{user?.name || mockUser.name}</p>
                  <p className="text-sm text-gray-500">{user?.email || mockUser.email}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Ongoing Games</h3>
                <ul className="space-y-2">
                  {games.length > 0 ? (
                    games.map((g, index) => (
                      <li key={index} className="bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">{g.name || mockGames[index % mockGames.length].name}</span>
                          <span className="text-sm text-gray-500">{g.status || mockGames[index % mockGames.length].status}</span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">No ongoing games.</li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Game History</h3>
                <ul className="space-y-2">
                  {history.length > 0 ? (
                    history.map((h, index) => (
                      <li key={index} className="bg-gray-50 p-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors duration-200 truncate">
                        {h || mockHistory[index % mockHistory.length]}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">No game history yet.</li>
                  )}
                </ul>
              </div>
            </>
          )}
        </aside>


        {/* Main Game Area */}
        <main className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-xl p-8 flex  flex-col md:flex-row items-center">
            <div className="md:mr-8"> {/* Chessboard and Timer Container */}
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Chess Game</h2>

              {/* Timers */}
              <div className="flex justify-around w-full mb-6">
                <div className="text-center">
                  <p className="text-gray-600">White</p>
                  <div className="font-bold text-lg">{formatTime(whiteTimer)}</div>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Black</p>
                  <div className="font-bold text-lg">{formatTime(blackTimer)}</div>
                </div>
              </div>

              {/* Chessboard */}
              <div className="bg-gray-100 rounded-lg p-1 shadow-inner">
                <Chessboard
                  key={boardKey}
                  position={fen}
                  onPieceDrop={(sourceSquare, targetSquare) => handleMove({ from: sourceSquare, to: targetSquare })}
                  boardWidth={480}
                  boardStyle={{ borderRadius: "8px", boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
                  pieceStyle={{ boxShadow: "0 2px 5px rgba(0,0,0,0.15)" }}
                  orientation={playerColor} // Set orientation based on player color
                  disabled={playerColor !== turn || isSpectator} // Disable board for wrong turn and spectator
                />
              </div>
            </div>


            {/* Move History */}
            <div className="mt-6 md:mt-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Move History</h3>
              <MoveHistory movesState={movesState} />
            </div>
          </div>


        </main>

        {/* Chat Modal */}
        {isChatOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Game Chat</h2>
                <button onClick={toggleChat} className="focus:outline-none">
                  <FontAwesomeIcon icon={faTimes} className="text-gray-600 hover:text-gray-800" />
                </button>
              </div>
              <div className="h-64 overflow-y-auto mb-4 p-2 bg-gray-50 rounded-md">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="mb-2 p-2 rounded-md bg-gray-100 text-gray-800 text-sm">
                    {msg}
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(event) => event.key === 'Enter' ? sendChatMessage() : null}
                />
                <button onClick={sendChatMessage} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 focus:outline-none">
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Chat Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-8 right-8 bg-blue-700 hover:bg-blue-800 text-white shadow-lg rounded-full p-3 focus:outline-none"
      >
        <FontAwesomeIcon icon={faPaperPlane} className="text-xl" />
      </button>

    </div>
  );
};