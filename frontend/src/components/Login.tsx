import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt, faTimes } from "@fortawesome/free-solid-svg-icons";

const Login = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:8080/user/login", {
        email,
        password,
      });

      console.log("Login successful:", response.data);

      const token = response.data.token;
      console.log("Login successful token:", token);
      toast.success("Login Successful!", {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: onClose, // Call onClose prop on successful login
      });

      localStorage.setItem(`${response.data.userId}+token`, token)
      // axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log(response.data.userId);
      navigate(`/game?userId=${response.data.userId}`);
    } catch (e) {
      console.error("Login error:", e);
      toast.error("Invalid email or password.", {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div className="rounded-lg p-6 bg-white shadow-md">
          <button
        onClick={onClose}
        className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close"
      >
        <FontAwesomeIcon icon={faTimes} className="text-xl" />
      </button>
      <div className="text-center mb-6">
        <FontAwesomeIcon icon={faSignInAlt} className="text-blue-500 text-4xl mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Login to continue to your game.</p>
      </div>
      <div className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
        </div>
      </div>
      <button
        onClick={handleLogin}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-semibold hover:bg-blue-700 transition duration-300 mt-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Login
      </button>
      <ToastContainer />
    </div>
  );
};
export default Login;