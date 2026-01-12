import { Pawn } from "./pieces/pawn.js";
import { Knight } from "./pieces/knight.js";
import { Bishop } from "./pieces/bishop.js";
import { Rook } from "./pieces/rook.js";
import { Queen } from "./pieces/queen.js";
import { King } from "./pieces/king.js";

const VALUES = new Map([
  [Pawn, 1],
  [Knight, 3],
  [Bishop, 3],
  [Rook, 5],
  [Queen, 9],
  [King, 0],
]);

export function evaluate(board, color) {
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.grid[r][c];
      if (!piece) continue;

      const value = VALUES.get(piece.constructor) || 0;
      score += piece.color === color ? value : -value;
    }
  }

  return score;
}
