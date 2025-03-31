import { Chess } from "chess.js";
import { Move } from "./types";

export   function parsePGNToMoves(pgn: string): Move[] {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    console.log("history move ", history);
    return history.map((move) => ({ from: move.from, to: move.to }));
  }