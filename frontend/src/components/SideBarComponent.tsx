import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faClock, faGamepad } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Move } from "../utils/types";

type Game = {
  id: string;
  opponent: string;
  timeControl: string;
  result?: string;
  date: string;
  moves: Move[];
  status: 'ongoing' | 'completed';
};

const mockUser = {
  name: "John Doe",
  rating: 1500,
  avatar: "https://avatar.iran.liara.run/public/38",
  country: "US",
  currentGames: [
    {
      id: "1",
      opponent: "Alice",
      timeControl: "10+5",
      date: "2024-05-10",
      moves: [
        { from: "e2", to: "e4",  },
        { from: "e7", to: "e5" }
      ],
      status: 'ongoing'
    }
  ] as Game[],
  gameHistory: [
    {
      id: "2",
      opponent: "Bob",
      timeControl: "5+3",
      result: "Won",
      date: "2024-05-09",
      moves: [
        { from: "d2", to: "d4"},
        { from: "g8", to: "f6"}
      ],
      status: 'completed'
    }
  ] as Game[]
};

export const SidebarComponent = ({ moves, playerColor }: { moves: Move[], playerColor: string }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing');
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  const toggleGameExpansion = (gameId: string) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId);
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-80'} bg-white shadow-lg rounded-xl transition-all flex flex-col`}>
      <div className="p-4 border-b flex justify-between items-center">
        {!collapsed && <h2 className="text-xl font-bold">Game Overview</h2>}
        <button onClick={() => setCollapsed(!collapsed)} className="hover:text-blue-600">
          <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 p-3 text-sm ${activeTab === 'ongoing' ? 'bg-gray-100 font-semibold' : ''}`}
              onClick={() => setActiveTab('ongoing')}
            >
              <FontAwesomeIcon icon={faClock} className="mr-2" />
              Ongoing
            </button>
            <button
              className={`flex-1 p-3 text-sm ${activeTab === 'history' ? 'bg-gray-100 font-semibold' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FontAwesomeIcon icon={faGamepad} className="mr-2" />
              History
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === 'ongoing' ? (
              /* Ongoing Games */
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Active Games</h3>
                {mockUser.currentGames.map((game) => (
                  <div key={game.id} className="bg-gray-50 rounded-lg p-3">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleGameExpansion(game.id)}
                    >
                      <div>
                        <p className="font-medium">vs {game.opponent}</p>
                        <p className="text-sm text-gray-600">{game.timeControl}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        game.status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-gray-200'
                      }`}>
                        {game.status}
                      </span>
                    </div>
                    
                    {expandedGameId === game.id && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium mb-2">Game Moves</div>
                        <div className="space-y-2">
                          {game.moves.map((move, i) => (
                            <div key={i} className="flex items-center text-sm">
                              <span className="w-8 text-gray-500">{i + 1}.</span>
                              <span className="font-mono">
                                {move.from}-{move.to}
                                {/* {move.promotion && `(${move.promotion})`} */}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Game History */
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Past Games</h3>
                {mockUser.gameHistory.map((game) => (
                  <div key={game.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">vs {game.opponent}</p>
                        <p className="text-sm text-gray-600">{game.date}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        game.result === 'Won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {game.result}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Moves Summary</div>
                      <div className="flex flex-wrap gap-1">
                        {game.moves.slice(0, 5).map((move, i) => (
                          <span key={i} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {move.from}-{move.to}
                          </span>
                        ))}
                        {game.moves.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{game.moves.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Game Moves */}
          {activeTab === 'ongoing' && (
            <div className="p-4 border-t">
              <h3 className="text-sm font-semibold mb-2">Current Game Moves</h3>
              <div className="bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto">
                {moves.map((move, i) => (
                  <div key={i} className="text-sm py-1">
                    <span className="text-gray-500 w-6 inline-block">{i + 1}.</span>
                    <span className="font-mono">
                      {move.from}-{move.to}
                      {/* {move.promotion && `(${move.promotion})`} */}
                    </span>
                  </div>
                ))}
                {moves.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-2">
                    No moves made yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};