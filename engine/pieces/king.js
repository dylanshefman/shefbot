import { Piece } from "./piece.js";
import { Move } from "../move.js";
import { Color } from "../util.js";
import { Rook } from "./rook.js";

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

    moves.push(...this._castlingMoves(board, startSq));

    return moves;
  }

  _castlingMoves(board, startSq) {
    const moves = [];
    const [row, col] = startSq;

    // Only allow castling from the home file.
    if (col !== 4) return moves;

    const rights = board.castlingRights?.[this.color];
    if (!rights) return moves;

    const opponent = Color.opponent(this.color);

    // Can't castle out of check.
    if (board.isSquareAttacked(startSq, opponent)) return moves;

    // King-side castling: e-file -> g-file, rook h-file -> f-file
    if (rights.K) {
      const rookSq = [row, 7];
      const fSq = [row, 5];
      const gSq = [row, 6];

      const rook = board.pieceAt(rookSq);
      const pathClear = board.squareEmpty(fSq) && board.squareEmpty(gSq);

      if (
        rook &&
        rook.color === this.color &&
        rook instanceof Rook &&
        pathClear &&
        !board.isSquareAttacked(fSq, opponent) &&
        !board.isSquareAttacked(gSq, opponent)
      ) {
        moves.push(new Move(startSq, gSq, { isCastling: true }));
      }
    }

    // Queen-side castling: e-file -> c-file, rook a-file -> d-file
    if (rights.Q) {
      const rookSq = [row, 0];
      const dSq = [row, 3];
      const cSq = [row, 2];
      const bSq = [row, 1];

      const rook = board.pieceAt(rookSq);
      const pathClear =
        board.squareEmpty(dSq) && board.squareEmpty(cSq) && board.squareEmpty(bSq);

      if (
        rook &&
        rook.color === this.color &&
        rook instanceof Rook &&
        pathClear &&
        !board.isSquareAttacked(dSq, opponent) &&
        !board.isSquareAttacked(cSq, opponent)
      ) {
        moves.push(new Move(startSq, cSq, { isCastling: true }));
      }
    }

    return moves;
  }
}
