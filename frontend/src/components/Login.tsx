import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import bcrypt from "bcryptjs";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
    // Handle login logic here
    try {
       const hashedPassword = bcrypt.hashSync(password, 10);

      const response = await axios.post("http://localhost:8080/user/login", {
        email,
        hashedPassword,
      });

      console.log("login successful:", response.data);

      // toast.success("password and confirm password are not matching", {
      //   position: "top-right",
      //   autoClose: 5000,
      //   closeOnClick: true,
      //   pauseOnHover: true,
      //   draggable: true,
      // });
      // Extract token from the response
      const token = response.data.token;
      console.log("login successful:", token);
      toast.success("Login Succesful", {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Store the token in localStorage
      localStorage.setItem("token", token);
      // Set the token as a default header for all subsequent axios requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      navigate(`/game`);
    } catch (e) {

      console.log("login error:", e);

      toast.error("Password or Username is incorrect");


    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Login
      </h1>
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
        onChange={(e) =>{
           setPassword(e.target.value);
        } }
        className="w-full px-4 py-2 border rounded-md text-gray-800 mb-6"
      />
      <button
        onClick={handleLogin}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition duration-300"
      >
        Login
      </button>
      <ToastContainer />
    </div>
  );
};
export default Login;
