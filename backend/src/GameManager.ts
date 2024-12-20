import {WebSocket} from "ws"
import { INIT_GAME, MOVE } from "./Message";
import { Game } from "./Game";
import { PrismaClient, User } from "@prisma/client";
const client = new PrismaClient();

export class GameManager{
    private games:Game[];
    private pendingUser:WebSocket |null;

    private users:WebSocket[];

    constructor(){
        this.games=[];
        this.pendingUser = null;
        this.users=[];
    }

    addUser(socket:WebSocket){

        this.users.push(socket);
        this.addHandler(socket);
        
    }
    removeUser(socket:WebSocket){
       const user= this.users.filter((user)=>user !== socket);
       if(this.pendingUser === socket){
        this.pendingUser = null;
       }
       this.games = this.games.filter((game)=> game.player1 !== socket && game.player2!==socket)
       //remove the user
    }
    private addHandler(socket:WebSocket){
       
        socket.on('message',async(data)=>{
             const message = JSON.parse(data.toString());
             if(message.type === INIT_GAME){
                if(this.pendingUser){
                    console.log(this.pendingUser);
                    //start the game
                    const player1Id = await client.user.findUnique({
                        where:{
                            email:(this.pendingUser as any)._userEmail
                        },
                        select:{
                            id:true
                        }
                    });
                    const player2Id = await client.user.findUnique({
                        where:{
                            email:(socket as any)._userEmail
                        },
                        select:{
                            id:true
                        }
                    })
                    const game = new Game(this.pendingUser,socket,player1Id,player2Id);
                    this.games.push(game);
                    console.log("game initailised");
                    this.pendingUser = null;
                }else{
                    this.pendingUser = socket;
                    console.log("Waiting for another player...");
                }
             }

             if(message.type === MOVE){
                // console.log(this.users);
                // console.log(socket);
                const game = this.games.find((game)=> game.player1 === socket || game.player2 === socket);
                if(game){
                    console.log("inside game");
                    game.makeMove(socket,message.payload);
                }
             }
        })
    }

}