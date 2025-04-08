import { Chess } from "chess.js";
import { Move } from "./types";

export function parsePGNToMoves(pgn?: string): Move[] {
  if (!pgn || typeof pgn !== "string" || pgn.trim() === "") {
    console.warn("Invalid PGN received:", pgn);
    return []; // Return an empty array instead of throwing an error
  }

  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    console.log("Parsed history moves:", history);
    
    return history.map((move) => ({ from: move.from, to: move.to }));
  } catch (error) {
    console.error("Error parsing PGN:", error);
    return []; // Return an empty array to avoid breaking the app
  }
}