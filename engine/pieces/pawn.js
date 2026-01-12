import { Piece } from "./piece.js";
import { Move } from "../move.js";

export class Pawn extends Piece {
  pseudoLegalMoves(board, startSq) {
    let moves = [];

    moves = moves.concat(this._forwardMoves(board, startSq));
    moves = moves.concat(this._captureMoves(board, startSq));
    moves = moves.concat(this._enPassantMoves(board, startSq));

    return moves;
  }

  _forwardMoves(board, startSq) {
    const moves = [];

    const oneStep = board.relativeSquare(startSq, 0, 1, this.color);
    if (!oneStep || !board.squareEmpty(oneStep)) return moves;

    if (oneStep[0] === board.getPromotionRow(this.color)) {
      for (const promo of ["Q", "R", "B", "N"]) {
        moves.push(new Move(startSq, oneStep, { promotion: promo }));
      }
    } else {
      moves.push(new Move(startSq, oneStep));
    }

    if (startSq[0] !== board.getPawnStartRow(this.color)) return moves;

    const twoStep = board.relativeSquare(startSq, 0, 2, this.color);
    if (twoStep && board.squareEmpty(twoStep)) {
      moves.push(new Move(startSq, twoStep));
    }

    return moves;
  }

  _captureMoves(board, startSq) {
    const moves = [];

    for (const h of [-1, 1]) {
      const targetSq = board.relativeSquare(startSq, h, 1, this.color);
      if (!targetSq) continue;

      const targetPiece = board.pieceAt(targetSq);
      if (!targetPiece || targetPiece.color === this.color) continue;

      if (targetSq[0] === board.getPromotionRow(this.color)) {
        for (const promo of ["Q", "R", "B", "N"]) {
          moves.push(
            new Move(startSq, targetSq, {
              captured: targetPiece,
              promotion: promo,
            })
          );
        }
      } else {
        moves.push(
          new Move(startSq, targetSq, { captured: targetPiece })
        );
      }
    }

    return moves;
  }

  _enPassantMoves(board, startSq) {
    const moves = [];
    const ep = board.enPassantTarget;
    if (!ep) return moves;

    for (const h of [-1, 1]) {
      const targetSq = board.relativeSquare(startSq, h, 1, this.color);
      if (!targetSq) continue;
      if (targetSq[0] !== ep[0] || targetSq[1] !== ep[1]) continue;

      const capturedSq = board.relativeSquare(startSq, h, 0, this.color);
      const capturedPiece = board.pieceAt(capturedSq);

      if (capturedPiece && capturedPiece.color !== this.color) {
        moves.push(
          new Move(startSq, targetSq, {
            captured: capturedPiece,
            isEnPassant: true,
          })
        );
      }
    }

    return moves;
  }
}
