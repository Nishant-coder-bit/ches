import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const navigate = useNavigate();
  const handleLogin = async () => {
    // Handle login logic here
   try{
     const response = await axios.post("http://localhost:8080/user/login",{
      email,
      password
     })
     console.log('login successful:', response.data); 
     // Extract token from the response
      const token = response.data.token;
       console.log('login successful:', token); 
       // Store the token in localStorage 
       localStorage.setItem('token', token); 
       // Set the token as a default header for all subsequent axios requests 
       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
       navigate(`/game?email=${email}`);
   } catch(e){

   }
  
    console.log("Login with:", email, password);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login</h1>
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
        className="w-full px-4 py-2 border rounded-md text-gray-800 mb-6"
      />
      <button
        onClick={handleLogin}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition duration-300"
      >
        Login
      </button>
    </div>
  );
};
export default Login;

