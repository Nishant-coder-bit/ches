import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Move } from "../utils/types";

const mockUser = {
  name: "John Doe",
  rating: 1500,
  avatar: "https://avatar.iran.liara.run/public/38",
  country: "US",
  matchesPlayed: 42,
  currentGames: [
    { opponent: "Alice", timeControl: "10+5", position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR" },
    { opponent: "Bob", timeControl: "5+3", position: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R" }
  ]
};

export const SidebarComponent = ({ moves, playerColor }: { moves:Move[], playerColor: string }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-80'} bg-white shadow-lg rounded-xl transition-all`}>
      <div className="p-4 border-b flex justify-between items-center">
        {!collapsed && <h2 className="text-xl font-bold">Player Profile</h2>}
        <button onClick={() => setCollapsed(!collapsed)}>
          <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <img src={mockUser.avatar} className="w-16 h-16 rounded-full" />
            <div>
              <h3 className="font-bold text-lg">{mockUser.name}</h3>
              <p className="text-gray-600">Rating: {mockUser.rating}</p>
              <p className="text-gray-600">{mockUser.country}</p>
            </div>
          </div>

          {/* Current Games */}
          <div>
            <h3 className="font-semibold mb-2">Active Games</h3>
            <div className="space-y-3">
              {mockUser.currentGames.map((game, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span>vs {game.opponent}</span>
                    <span className="text-blue-600">{game.timeControl}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game History */}
          <div>
            <h3 className="font-semibold mb-2">Game Moves</h3>
            <div className="bg-gray-50 rounded-lg p-2 h-64 overflow-y-auto">
              <div className="grid grid-cols-12 gap-x-2 text-sm">
                {moves.map((move:any, i) => (
                  <div key={i} className="col-span-12 odd:bg-gray-100 p-1 rounded">
                    <span className="text-gray-500 w-6 inline-block">{i + 1}.</span>
                    <span className="font-medium">{move.from}-{move.to}</span>
                    {move.promotion && <span className="text-blue-600 ml-1">({move.promotion})</span>}
                  </div>
                ))}
                {moves.length === 0 && (
                  <div className="text-gray-500 text-center p-4">No moves yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};