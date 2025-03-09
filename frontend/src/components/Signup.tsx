import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";

const Signup = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/user/signup", {
        email,
        password,
        name,
      });

      console.log("Signup successful:", response.data);
      toast.success("Signup Successful!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        onClose: onClose, // Close the modal on successful signup
      });

      const token = response.data.token;
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      navigate(`/game?email=${email}`);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Invalid signup details. Please check and try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className="rounded-lg p-6 bg-white shadow-md">
      <div className="text-center mb-6">
        <FontAwesomeIcon icon={faUserPlus} className="text-blue-500 text-4xl mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
        <p className="text-gray-600 mt-2">Join our chess community today!</p>
      </div>
      <div className="space-y-4">
        <div>
          <input
            type="name"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
        </div>
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
        <div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
          />
        </div>
      </div>
      <button
        onClick={handleSignup}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-md text-lg font-semibold hover:bg-green-700 transition duration-300 mt-6 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
      >
        Sign Up
      </button>
      <ToastContainer />
    </div>
  );
};

export default Signup;