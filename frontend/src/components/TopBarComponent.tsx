import {
  faChess,
  faSignOutAlt,
  faUserCircle,
  faCog,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const mockUser = {
  name: "John Chessman",
  email: "john@chess.com",
  rating: 1780,
  avatar: "https://avatar.iran.liara.run/public/38",
};

export const TopBarComponent = ({userId}:{userId:string}) => {
  const navigate = useNavigate();
  const [isSpectator, setIsSpectator] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem(`${userId}+token`);
    navigate("/");
    window.location.reload();
  };

  const handleProfileNavigation = (path: string) => {
    setIsProfileOpen(false);
    navigate(path);
  };

  return (
    <div className="flex justify-between items-center w-full px-6 py-3 bg-gray-800 text-white">
      <div className="flex items-center space-x-4">
        <FontAwesomeIcon
          icon={faChess}
          className="text-2xl text-blue-400"
        />
        <h1 className="text-xl font-bold">Modern Chess</h1>
      </div>

      <div className="flex items-center space-x-6 relative">
        <button
          onClick={() => setIsSpectator(!isSpectator)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            isSpectator
              ? "bg-yellow-500 text-gray-900 hover:bg-yellow-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isSpectator ? "👁️ Spectating" : "Spectator Mode"}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            <img
              src={mockUser.avatar}
              className="w-8 h-8 rounded-full border-2 border-blue-400"
              alt="Profile"
            />
            <span className="hidden md:inline">{mockUser.name}</span>
            <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  <img
                    src={mockUser.avatar}
                    className="w-10 h-10 rounded-full"
                    alt="Profile"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{mockUser.name}</p>
                    <p className="text-sm text-gray-600">{mockUser.email}</p>
                    <p className="text-sm text-blue-600">Rating: {mockUser.rating}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <button
                  onClick={() => handleProfileNavigation("/profile")}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md text-gray-700"
                >
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  View Profile
                </button>
                <button
                  onClick={() => handleProfileNavigation("/settings")}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md text-gray-700"
                >
                  <FontAwesomeIcon icon={faCog} className="mr-2" />
                  Account Settings
                </button>
              </div>
              
              <div className="border-t p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 rounded-md text-red-600"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};