import { Piece } from "./piece.js";
import { Move } from "../move.js";

export class Knight extends Piece {
  pseudoLegalMoves(board, startSq) {
    const moves = [];

    const deltas = [1, -1, 2, -2];

    for (const h of deltas) {
      for (const v of deltas) {
        // knight moves must be (2,1) or (1,2)
        if (Math.abs(h) === Math.abs(v)) continue;

        const targetSq = board.relativeSquare(
          startSq,
          h,
          v,
          this.color
        );

        if (!targetSq) continue;

        const targetPiece = board.pieceAt(targetSq);

        if (!targetPiece) {
          moves.push(new Move(startSq, targetSq));
        } else if (targetPiece.color !== this.color) {
          moves.push(new Move(startSq, targetSq, { captured: targetPiece }));
        }
      }
    }

    return moves;
  }
}
