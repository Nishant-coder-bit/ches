import { useEffect, useState } from "react";

const WS_URL = "ws://localhost:8080";
export function useSocket(userId:string) {
  const [socket, setSocket] = useState<WebSocket> ();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let ws:WebSocket;
       console.log("Connecting to WebSocket...", userId);
      let token = localStorage.getItem(`${userId}+token`) || ""; 
      
      if(!token){
          console.log("No token found. Please login first.");
          return ;
      }
      ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket Connected")
        setIsConnected(true);
        setSocket(ws);

      };

      ws.onclose = () => {
        console.log("WebSocket Disconnected. Reconnecting...");
        setIsConnected(false);

      };

      ws.onerror = (err) => {
        console.log("WebSocket Error:", err);
        setIsConnected(false);
        ws.close();
      };
  }, []);

  return { socket ,isConnected};
}
