import { useEffect, useState } from "react";

const WS_URL = "ws://localhost:8080";
export function useSocket() {
  const [socket, setSocket] = useState<WebSocket> ();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws:WebSocket;
    
    const connectSocket = () => {
      const token = localStorage.getItem('token'); 
      if(!token){
          console.log("No token found. Please login first.");
          return ;
      }
      ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
        setSocket(ws);

        // If the player is reconnecting, request game state
        ws.send(JSON.stringify({ type: "reconnect_request" }));
      };

      ws.onclose = () => {
        console.log("WebSocket Disconnected. Reconnecting...");
        setIsConnected(false);
        setTimeout(() => connectSocket(), 3000); // Auto-reconnect after 3 seconds
      };

      ws.onerror = (err) => {
        console.log("WebSocket Error:", err);
        ws.close();
      };
    };

    connectSocket();

    return () => ws?.close(); // Cleanup on unmount
  }, []);

  return { socket, isConnected };
}
