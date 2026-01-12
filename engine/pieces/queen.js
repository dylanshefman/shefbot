import { Piece } from "./piece.js";
import { Move } from "../move.js";

export class Queen extends Piece {
  pseudoLegalMoves(board, startSq) {
    const moves = [];

    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],     // rook-like
      [1, 1], [-1, 1], [1, -1], [-1, -1],   // bishop-like
    ];

    for (const [h, v] of directions) {
      let step = 1;

      while (true) {
        const targetSq = board.relativeSquare(
          startSq,
          h * step,
          v * step,
          this.color
        );

        if (!targetSq) break;

        const targetPiece = board.pieceAt(targetSq);

        if (!targetPiece) {
          moves.push(new Move(startSq, targetSq));
        } else if (targetPiece.color !== this.color) {
          moves.push(new Move(startSq, targetSq, { captured: targetPiece }));
          break;
        } else {
          break;
        }

        step++;
      }
    }

    return moves;
  }
}
