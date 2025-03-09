import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import Signup from "../components/Signup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChessBoard } from "@fortawesome/free-solid-svg-icons";

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
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-gray-900 text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faChessBoard} className="mr-2 text-blue-500 text-2xl" />
            <h1 className="text-xl font-bold">Modern Chess Online</h1>
          </div>
          <nav>
            <button onClick={() => setShowLogin(true)} className="px-4 py-2 text-gray-200 hover:text-white focus:outline-none">
              Login
            </button>
            <button onClick={() => setShowSignup(true)} className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-md hover:bg-yellow-600 focus:outline-none">
              Sign Up
            </button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-center">
        {/* Left Section */}
        <div className="text-center md:text-left md:w-1/2 p-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Experience Chess Like Never Before
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Join our vibrant community and dive into the world of online chess. Whether you're looking for a casual game or a serious challenge, you'll find your perfect match here.
          </p>
          <div className="flex justify-center md:justify-start">
            <button
              onClick={() => setShowSignup(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Get Started Now
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="md:w-1/2 flex flex-col items-center p-6">
          <img
            src={"/chessBoard.png.webp"}
            alt="Chess Board"
            className="w-full max-w-md rounded-xl shadow-lg mb-8"
          />

          {/* Ongoing Games Section */}
          <div className="w-full">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Spectate Ongoing Games</h2>
            {ongoingGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ongoingGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white border border-gray-200 rounded-md p-4 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
                    onClick={() => joinSpectator(game.id)}
                  >
                    <h3 className="font-semibold text-gray-800">Game {game.id}</h3>
                    <p className="text-sm text-gray-500">Click to spectate</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center">No ongoing games to spectate at the moment.</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Modern Chess Online. All rights reserved.</p>
          <p className="mt-2 text-sm">
            <a href="/terms" className="hover:text-white">Terms of Service</a> | <a href="/privacy" className="hover:text-white">Privacy Policy</a>
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-end">
              <button className="text-red-500 hover:text-red-700 focus:outline-none" onClick={() => setShowLogin(false)}>
                <FontAwesomeIcon icon="times" /> &times;
              </button>
            </div>
            <Login onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-end">
              <button className="text-red-500 hover:text-red-700 focus:outline-none" onClick={() => setShowSignup(false)}>
                &times;
              </button>
            </div>
            <Signup onClose={() => setShowSignup(false)}/>
          </div>
        </div>
      )}
    </div>
  );
};