import { useEffect, useState } from 'react';
const WS_URL = "ws://localhost:8080/"
// let count =0;
export const useSocket = (email:any) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
    
   
  useEffect(() => {
    const token = localStorage.getItem('token'); // Get token from localStorage
    if (token) {
      const ws = new WebSocket(`${WS_URL}`, ['Authorization', `Bearer ${token}`]); // Include token in headers
      ws.onopen = () => {
        console.log('WebSocket connected');
    
         setSocket(ws);
      };
    
      ws.onclose = () => {
        setSocket(null);
      };
    
      return () => {
        ws.close();
      };
    
    }

  }, []);
  return socket;
}