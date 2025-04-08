import { useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8080";

export function useSocket(userId:string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
   
       console.log("Connecting to WebSocket...", userId);
      let token = localStorage.getItem(`${userId}+token`) || ""; 
      
      if(!token){
          console.log("No token found. Please login first.");
          return ;
      }
      if(!socketRef.current) {
      socketRef.current = new WebSocket(`${WS_URL}?token=${token}`);

      socketRef.current.onopen = () => {
        console.log("WebSocket Connected")
        setIsConnected(true);
    };
    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data.toString());
      setMessages((prev) => [...prev, message]);
    };
      socketRef.current.onclose = () => {
        console.log("WebSocket Disconnected. Reconnecting...");
        setIsConnected(false);
        socketRef.current = null;
      };
    }
      return () => {
        socketRef.current?.close();
      };
    }, []);

    const sendMessage = (message: any) => {
      socketRef.current?.send(message);
    };
  
    return { socket: socketRef.current, messages, sendMessage };
}
