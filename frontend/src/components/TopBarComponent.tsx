import {
  faChess,
  faSignOutAlt,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const TopBarComponent = () => {
    const navigate = useNavigate();
    const [isSpectator, setIsSpectator] = useState(false); 
    const [refresh, setRefresh] = useState(false);
  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("gameId");
    console.log("Logged out and game state reset.");
    navigate(`/`);
    window.location.reload();
    // setRefresh((refresh)=>!refresh)
     return;
  };

  return (
      <>
      <div className="flex items-center">
        <FontAwesomeIcon
          icon={faChess}
          className="mr-2 text-blue-500 text-xl"
        />
        <h1 className="text-xl font-bold">Modern Chess</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsSpectator(!isSpectator)}
          className={`px-3 py-2 rounded-md text-sm ${
            isSpectator
              ? "bg-yellow-500 text-gray-900"
              : "bg-gray-700 text-white"
          } hover:bg-gray-800 focus:outline-none`}
        >
          {isSpectator ? "Spectator Mode ON" : "Spectator Mode OFF"}
        </button>
        <button
          onClick={handleLogout}
          className="px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 focus:outline-none"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-1" /> Logout
        </button>
        <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
      </div>
     </>
  );
};
