import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import bcrypt from "bcryptjs";
const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    // Handle signup logic here
    if (password !== confirmPassword) {
      console.log("password and confirm password are not matching");

      toast.error("password and confirm password are not matching", {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      return;
    }

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const response = await axios.post("http://localhost:8080/user/signup", {
        email,
        hashedPassword,
        name,
      });

      console.log("Signup successful:", response.data);
      toast.success("Signup Successfull", {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      const token = response.data.token;
      localStorage.setItem("token", token);
      // Set the token as a default header for all subsequent axios requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      navigate(`/game?email=${email}`);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Please enter valid details", {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Sign Up
      </h1>
      <input
        type="name"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-2 border rounded-md text-gray-800 mb-4"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border rounded-md text-gray-800 mb-4"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 border rounded-md text-gray-800 mb-4"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full px-4 py-2 border rounded-md text-gray-800 mb-6"
      />
      <button
        onClick={handleSignup}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-md text-lg font-medium hover:bg-green-700 transition duration-300"
      >
        Sign Up
      </button>
      <ToastContainer />
    </div>
  );
};
export default Signup;
