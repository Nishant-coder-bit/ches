import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { LandingPage } from "./screens/LandingPage";
import { Game } from "./screens/Game";
import Login from "./screens/Login";
import Signup from "./screens/Signup";

function App() {
  const [count, setCount] = useState(0);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />}></Route>
        <Route path="/game" element={<Game/>}></Route>
        <Route path="/login" element={<Login/>}></Route>
        <Route path="/signup" element={<Signup/>}></Route>
       
      </Routes>
    </BrowserRouter>
  );
}

export default App;
