import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Login } from "../components/Login";
import { Signup } from "../components/Signup";

export const LandingPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

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
        <input
          name="email"
          type="email"
          placeholder="Enter your emailid"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          className="px-4 py-2 border rounded-md text-gray-800 mb-4"
        />
        <button
          onClick={() => {
            navigate(`/game?email=${email}`);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition duration-300"
        >
          Play Chess
        </button>
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
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="h-100 w-100 flex justify-items-end">
          <button
              className="text-red-500  top-2 right-2"
              onClick={() => setShowLogin(false)}
            >
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
          <div className="h-100 w-100 flex justify-items-end">
          <button
              className="text-red-500  top-2 right-2"
              onClick={() => setShowSignup(false)}
            >
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
