import { useEffect, useState } from 'react';
const WS_URL = "ws://localhost:8080/"
// let count =0;
export const useSocket = (email:any) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
    
    // let email:string = "";
  useEffect(() => {
      // if(count==0){
      //     email= "abc@gmail.com";
      // }
      // else{
      //   email = "def@gmail.com";
      // }
      console.log("email",email.email);
    const ws = new WebSocket(`${WS_URL}?email="${email.email}"`);
    console.log("ws",ws);
      
    ws.onopen = () => {
      setSocket(ws);
      // count++;
    };

    ws.onclose = () => {
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  },[]);

  return socket;
};