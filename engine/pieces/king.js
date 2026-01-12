import { Piece } from "./piece.js";
import { Move } from "../move.js";

export class King extends Piece {
  pseudoLegalMoves(board, startSq) {
    const moves = [];

    for (const h of [-1, 0, 1]) {
      for (const v of [-1, 0, 1]) {
        if (h === 0 && v === 0) continue;

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
