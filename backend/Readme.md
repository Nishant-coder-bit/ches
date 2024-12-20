# Backend Architecture for Chess Gaming Platform

## Overview
This backend design is structured for a scalable and efficient chess gaming platform. It is split into three main services: **Game Service**, **Matchmaking Service**, and **User Service**. Each service has its own responsibilities, ensuring modularity and scalability. Redis and WebSocket are the core technologies used to handle real-time updates and data storage.

---

## Architecture Components

### 1. **Game Service**
   - **Responsibilities**:
     - Manage live games, including move validation and time controls.
     - Maintain game state in Redis for quick access and low-latency updates.
     - Use WebSocket to synchronize moves with players and spectators.
   - **How It Works**:
     - When a move is made, it is validated using the `chess.js` library.
     - The move is broadcasted to both players and any spectators using WebSocket.
     - The updated game state is stored in Redis for persistence and fast retrieval.
   - **Key Features**:
     - Handles game-over scenarios.
     - Ensures move validation to prevent illegal moves.

#### **Code for Game Service**
```typescript
import { Chess } from "chess.js";
import { WebSocket } from "ws";
import Redis from "ioredis";

const redis = new Redis();

export class Game {
    private board: Chess;
    private moveCount: number;

    constructor(private player1: WebSocket, private player2: WebSocket) {
        this.board = new Chess();
        this.moveCount = 0;
        this.initializeGame();
    }

    private initializeGame() {
        this.player1.send(JSON.stringify({ type: "INIT_GAME", color: "white" }));
        this.player2.send(JSON.stringify({ type: "INIT_GAME", color: "black" }));
        redis.set(`game:${this.player1}`, JSON.stringify(this.board.fen()));
    }

    public makeMove(socket: WebSocket, move: { from: string; to: string }) {
        if ((this.moveCount % 2 === 0 && socket !== this.player1) ||
            (this.moveCount % 2 === 1 && socket !== this.player2)) {
            return;
        }

        try {
            this.board.move(move);
            redis.set(`game:${this.player1}`, JSON.stringify(this.board.fen()));
            this.broadcastMove(move);
            this.moveCount++;

            if (this.board.isGameOver()) {
                this.endGame();
            }
        } catch (error) {
            console.error("Invalid move:", error);
        }
    }

    private broadcastMove(move: { from: string; to: string }) {
        const targetPlayer = this.moveCount % 2 === 0 ? this.player2 : this.player1;
        targetPlayer.send(JSON.stringify({ type: "MOVE", payload: move }));
    }

    private endGame() {
        const winner = this.board.turn() === "w" ? "black" : "white";
        [this.player1, this.player2].forEach(player => {
            player.send(JSON.stringify({ type: "GAME_OVER", payload: { winner } }));
        });
    }
}
```

---

### 2. **Matchmaking Service**
   - **Responsibilities**:
     - Match players based on Elo rating and preferences (e.g., time control, chess variant).
     - Store a matchmaking queue in Redis for fast operations.
     - Use worker services to process matchmaking requests and pair players.
   - **How It Works**:
     - Players are added to a matchmaking queue stored in Redis.
     - A worker service picks two players with similar Elo ratings and preferences to start a game.
     - The matched players are connected via WebSocket for real-time communication.

#### **Code for Matchmaking Service**
```typescript
import Redis from "ioredis";
const redis = new Redis();

export class Matchmaking {
    public async addPlayerToQueue(playerId: string, elo: number) {
        await redis.zadd("matchmakingQueue", elo, playerId);
    }

    public async matchPlayers() {
        const players = await redis.zrange("matchmakingQueue", 0, 1);
        if (players.length === 2) {
            const [player1, player2] = players;
            this.startGame(player1, player2);
            await redis.zrem("matchmakingQueue", player1, player2);
        }
    }

    private startGame(player1: string, player2: string) {
        console.log(`Starting game between ${player1} and ${player2}`);
        // Logic to initialize game instance
    }
}
```

---

### 3. **User Service**
   - **Responsibilities**:
     - Manage user authentication and session management.
     - Store user profiles, ratings, and game history in PostgreSQL.
     - Implement friend lists and other social features.
   - **How It Works**:
     - Frequently accessed data like user profiles and ratings are cached in Redis to reduce database load.
     - PostgreSQL is used for structured storage of user data and game history.
     - Friend lists and social interactions are stored as hashed data in Redis for quick access.

#### **Code for User Service**
```typescript
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();
const redis = new Redis();

export class UserService {
    public async getUserProfile(userId: string) {
        const cachedProfile = await redis.get(`user:${userId}`);
        if (cachedProfile) return JSON.parse(cachedProfile);

        const profile = await prisma.user.findUnique({ where: { id: userId } });
        if (profile) {
            await redis.set(`user:${userId}`, JSON.stringify(profile));
        }
        return profile;
    }

    public async updateUserRating(userId: string, newRating: number) {
        await prisma.user.update({ where: { id: userId }, data: { rating: newRating } });
        await redis.del(`user:${userId}`); // Clear cache to ensure consistency
    }
}
```

---

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install chess.js ws ioredis @prisma/client
   npm install -g prisma
   ```

2. **Configure Redis**:
   - Ensure Redis is installed and running on your system.
   - Default port: `6379`.

3. **Setup PostgreSQL**:
   - Create a database for user data.
   - Run Prisma migrations:
     ```bash
     npx prisma migrate dev --name init
     ```

4. **Run Services**:
   - Start the server:
     ```bash
     node index.js
     ```
   - Logs will indicate the status of WebSocket connections, game events, and matchmaking.

---

## Example Logs
```
[INFO] WebSocket server started on port 8080
[INFO] Player1 connected, added to matchmaking queue
[INFO] Match found: Player1 vs Player2
[INFO] Game initialized between Player1 and Player2
[INFO] Player1 moved e2 to e4
[INFO] Player2 moved e7 to e5
[INFO] Game over! Winner: Player1
```

---

This architecture ensures that the platform is modular, efficient, and scalable, making it easy to add new features or handle increased user traffic.
+---------------------------------------------------------------+
|                       Chess Gaming Platform                   |
|---------------------------------------------------------------|
|                         <<Interface>>                         |
| +-----------------------------------------------------------+ |
| |  User Interface                                          | |
| |                                                         | |
| | +---------------+     +---------------+     +-----------+ | |
| | | Player1       |     | Player2       |     | Spectator  | |
| | |               |     |               |     |            | |
| | +-------+-------+     +-------+-------+     +-------+---+ | |
| +---------|---------------|---------------|------------|----+ |
|           |               |               |            |      |
|           |               |               |            |      |
+-----------|---------------|---------------|------------|------+
            |               |               |            |
+-----------|---------------|---------------|------------|------+
|           |               |               |            |      |
| +---------+----------+    +---------------+    +-------+------+ |
| |       Redis       |    |  WebSocket    |    |  PrismaClient  | |
| +---------+----------+    +-------+-------+    +-------+------+ |
|           |                       |                     |      |
|           |                       |                     |      |
+-----------|-----------------------|---------------------|------+
            |                       |                     |
+-----------|-----------------------|---------------------|------+
|           |                       |                     |      |
| +---------|----------+  +---------|----------+  +-------|------+ |
| |  Matchmaking       |  |   Game Service    |  |  User Service | |
| | Service            |  | Service           |  |               | |
| | +---------------+  |  | +---------------+  |  | +-----------+ | |
| | | addPlayerToQueue |  | | initializeGame |  |  | | getUserProfile | |
| | | matchPlayers     |  | | makeMove       |  |  | | updateUserRating | |
| | +---------------+  |  | +---------------+  |  | | getGameStats    | |
| | +---------------+  |  | +---------------+  |  | | getLeaderboard  | |
| | | Matchmaker Worker|  | | Game Event     |  |  | +-----------+ | |
| | | (Message Queue)  |  | | Processor      |  |  | +-----------+ | |
| | +---------------+  |  | +---------------+  |  | +-----------+ | |
| +--------------------+  +--------------------+  +----------------+ |
+---------------------------------------------------------------+





-------------------------------------new uml design ------------------------------------
+---------------------------------------------------------------+
|                       Chess Gaming Platform                   |
|---------------------------------------------------------------|
|                       <<Clients>>                             |
| +-----------------------------------------------------------+ |
| |       Web Client        Mobile Client      Admin Client    | |
| +---------------------+   +----------------+  +--------------+ |
+---------------------------------------------------------------+
                                  |
                                  V
+------------------------+---------------------------------+
|                      API Gateway                         |
|----------------------------------------------------------|
|  Auth, Rate Limiting, Caching, Routing, Monitoring       |
+------------------------+---------------------------------+
         |                    |                     |
         V                    V                     V
+------------------+  +------------------+  +------------------+
|  User Service    |  |  Game Service    |  |  Matchmaking     |
|------------------|  |------------------|  |------------------|
|  Auth, Profiles, |  |  Live Games,     |  |  Match Players,  |
|  Friends         |  |  Moves, State    |  |  Queues          |
+------------------+  +------------------+  +------------------+
         |                    |                     |
         V                    V                     V
+------------------+  +------------------+  +------------------+
|  Tournament      |  |  Analytics       |  |  Notification    |
|  Service         |  |  Service         |  |  Service         |
|------------------|  |------------------|  |------------------|
|  Tournaments,    |  |  Game Stats,     |  |  Real-time Notifs|
|  Pairings,       |  |  User Insights   |  |  Emails, Push    |
|  Leaderboards    |  +------------------+  |  In-app Messages |
+------------------+                         +------------------+
         |                                            |
         V                                            V
+---------------------------------------------------------+
|                      Admin Service                      |
|---------------------------------------------------------|
|  User Management, Games, Tournaments, Moderation,       |
|  Monitoring, Reporting                                  |
+---------------------------------------------------------+
