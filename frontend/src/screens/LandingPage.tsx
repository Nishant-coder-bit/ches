import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import Signup from "../components/Signup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChessBoard, faChessKing, faMessage, faTimes, faTowerBroadcast } from "@fortawesome/free-solid-svg-icons";

export const LandingPage = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [ongoingGames, setOngoingGames] = useState<{ id: string }[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/game/ongoing") // Fetch ongoing games
      .then((res) => res.json())
      .then((data) => setOngoingGames(data))
      .catch((error) => console.error("Error fetching ongoing games:", error));
  }, []);

  const joinSpectator = async (gameId: string) => {
    try {

      const res = await fetch(`http://localhost:8080/game/${gameId}/spectate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        navigate(`/game/${gameId}/spectate`); // Redirect to spectator view
      } else {
        console.error("Failed to join as spectator");
      }
    } catch (error) {
      console.error("Error joining spectator:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-gray-900 to-blue-900 text-white shadow-xl">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <FontAwesomeIcon 
              icon={faChessBoard} 
              className="text-3xl text-yellow-400 animate-pulse"
            />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">
              Modern Chess
            </h1>
          </div>
          
          <nav className="flex space-x-4">
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center"
            >
              <span className="mr-2">👑</span>
              Login
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 transform hover:scale-105 transition-all duration-300 flex items-center"
            >
              <span className="mr-2">🎯</span>
              Start Playing
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Section */}
        <div className="flex-1 space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
            Master the Game of<br/>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Kings & Queens
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 md:text-xl leading-relaxed">
            Join millions of players worldwide in the ultimate chess experience. 
            <span className="block mt-2 font-semibold text-blue-600">
              Play, learn, and compete in real-time matches!
            </span>
          </p>

          <div className="flex space-x-4">
        
            <button
              onClick={() => setShowSignup(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center"
            >
              <FontAwesomeIcon icon={faChessKing} className="mr-2" />
              Get Started - It's Free
            </button>
          </div>

          {/* Stats Banner */}
          <div className="bg-white rounded-xl p-6 shadow-lg mt-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border-r border-gray-200">
                <div className="text-3xl font-bold text-blue-600">1M+</div>
                <div className="text-gray-600 text-sm">Active Players</div>
              </div>
              <div className="border-r border-gray-200">
                <div className="text-3xl font-bold text-purple-600">500K+</div>
                <div className="text-gray-600 text-sm">Daily Matches</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">99.9%</div>
                <div className="text-gray-600 text-sm">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 w-full max-w-2xl">
          {/* Interactive Chess Demo */}
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-800">
            <img
              src="/3d-chess-board.png"
              alt="Interactive Chess"
              className="w-full h-auto hover:scale-105 transition-transform duration-500 cursor-pointer"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h3 className="text-white text-xl font-bold mb-2">Live Match Preview</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-200">12 moves played</span>
              </div>
            </div>
          </div>

          {/* Ongoing Games Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <FontAwesomeIcon icon={faTowerBroadcast} className="mr-2 text-purple-600" />
              Live Matches
            </h2>
            
            {ongoingGames.length > 0 ? (
              <div className="grid gap-4">
                {ongoingGames.map((game) => (
                  <div
                    key={game.id}
                    className="group relative bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-blue-500"
                    onClick={() => joinSpectator(game.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-800">Match #{game.id}</h3>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                            Rating: 1600 vs 1550
                          </span>
                          <span className="text-sm text-gray-500">15 moves</span>
                        </div>
                      </div>
                      <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FontAwesomeIcon icon={faArrowRight} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-xl shadow-md">
                <div className="text-gray-500 mb-4">🎲 No live matches available</div>
                <button 
                  onClick={() => setShowSignup(true)}
                  className="text-blue-600 hover:underline"
                >
                  Start the first match!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-24 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">Modern Chess</h3>
              <p className="text-sm">Where strategy meets community</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Play</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Quick Match</a></li>
                <li><a href="#" className="hover:text-white">Tournaments</a></li>
                <li><a href="#" className="hover:text-white">Puzzles</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Learn</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Lessons</a></li>
                <li><a href="#" className="hover:text-white">Analysis</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white"><FontAwesomeIcon icon={faMessage} /></a>
                <a href="#" className="hover:text-white"><FontAwesomeIcon icon={faMessage} /></a>
                <a href="#" className="hover:text-white"><FontAwesomeIcon icon={faMessage}  /></a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Modern Chess. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced Modals */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-blue-900 p-6">
              <h2 className="text-2xl font-bold text-white">Welcome Back!</h2>
            </div>
            <div className="p-8">
              <Login onClose={() => setShowLogin(false)} />
              <div className="mt-6 text-center">
                <button
                  onClick={() => { setShowLogin(false); setShowSignup(true); }}
                  className="text-blue-600 hover:underline"
                >
                  New here? Create account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6">
              <h2 className="text-2xl font-bold text-white">Join the Community!</h2>
            </div>
            <div className="p-8">
              <Signup onClose={() => setShowSignup(false)} />
              <div className="mt-6 text-center">
                <button
                  onClick={() => { setShowSignup(false); setShowLogin(true); }}
                  className="text-blue-600 hover:underline"
                >
                  Already have an account? Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};