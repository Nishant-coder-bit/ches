import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name,setName] = useState("");
  const navigate = useNavigate();
const handleSignup = async() => {
    // Handle signup logic here
    if (password !== confirmPassword) { 
      console.log('password and confirm password are not matching'); return;
     }
      try { 
        const response = await axios.post('http://localhost:8080/user/signup', 
          { email, password,name });
           console.log('Signup successful:', response.data); 
           // Navigate to another page or show success message 
           navigate(`/game?email=${email}`);
           } 
           catch (error) { 
            console.error('Signup error:',error);
           }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Sign Up</h1>
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
    </div>
  );
};
