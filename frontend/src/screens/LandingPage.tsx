import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import Signup from "../components/Signup";

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
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-100 p-6 relative">
      {/* Left Section */}
      <div className="text-center md:text-left md:w-1/2 p-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Play Chess Online
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Join millions of players worldwide. Play chess for free, improve your
          skills, and have fun!
        </p>
      </div>

      {/* Right Section */}
      <div className="md:w-1/2 flex flex-col items-center p-6 bg-white shadow-lg rounded-lg">
        <img
          src={"/chessBoard.png.webp"}
          alt="Chess Board"
          className="w-full max-w-md rounded-lg shadow-lg mb-6"
        />

        {/* Login and Signup Buttons */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-md text-lg font-medium hover:bg-green-700 transition duration-300"
          >
            Login
          </button>
          <button
            onClick={() => setShowSignup(true)}
            className="px-6 py-3 bg-yellow-600 text-white rounded-md text-lg font-medium hover:bg-yellow-700 transition duration-300"
          >
            Sign Up
          </button>
        </div>

        {/* List of Ongoing Games */}
        <div className="mt-6 w-full">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Ongoing Games</h2>
          {ongoingGames.length > 0 ? (
            <ul className="space-y-2">
              {ongoingGames.map((game) => (
                <li
                  key={game.id}
                  className="cursor-pointer p-2 bg-blue-100 hover:bg-blue-200 rounded-md transition"
                  onClick={() => joinSpectator(game.id)}
                >
                  Game {game.id}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No ongoing games available.</p>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-end">
              <button className="text-red-500" onClick={() => setShowLogin(false)}>
                &times;
              </button>
            </div>
            <Login />
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-end">
              <button className="text-red-500" onClick={() => setShowSignup(false)}>
                &times;
              </button>
            </div>
            <Signup />
          </div>
        </div>
      )}
    </div>
  );
};
