import { useEffect, useState } from "react";

const WS_URL = "ws://localhost:8080";
export function useSocket() {
  const [socket, setSocket] = useState<WebSocket> ();
  // const [isConnected, setIsConnected] = useState(false);

  // useEffect(() => {
    let ws:WebSocket;
    
    // const connectSocket = () => {
    // TODO:- issue of reconnecting to same id on refresh , is due to shared token 
    // in local storage on all browsers . it can be fixed using session storage 
      const token = localStorage.getItem('token'); 
      
      if(!token){
          console.log("No token found. Please login first.");
          return ;
      }
      ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket Connected")
        // setIsConnected(true);
        setSocket(ws);
           // Send reconnect request if needed
          // const gameId = localStorage.getItem("gameId");
          //   if (gameId) {
          //  ws.send(JSON.stringify({ type: "reconnect_request", gameId }));
          //  }
      };

      // ws.onclose = () => {
      //   console.log("WebSocket Disconnected. Reconnecting...");
      //   setIsConnected(false);
      //   setTimeout(() => connectSocket(), 3000); // Auto-reconnect after 3 seconds
      // };

      ws.onerror = (err) => {
        console.log("WebSocket Error:", err);
        ws.close();
      };
    // };

    // connectSocket();

    // return () => ws?.close(); // Cleanup on unmount
  // }, []);

  return { socket };
}
