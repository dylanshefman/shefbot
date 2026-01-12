import { Board } from "./board.js";
import { Color } from "./util.js";
import { King } from "./pieces/king.js";

export class Game {
  constructor() {
    this.board = new Board();
    this.turn = Color.WHITE;
  }

  // ──────────────────────────────────────────────────────
  // Turn helpers
  // ──────────────────────────────────────────────────────

  switchTurn() {
    this.turn = Color.opponent(this.turn);
  }

  // ──────────────────────────────────────────────────────
  // Move generation
  // ──────────────────────────────────────────────────────

  /**
   * Returns all LEGAL moves for the current player
   */
  legalMoves() {
    const legal = [];

    for (const [square, piece] of this.board.piecesOfColor(this.turn)) {
      const pseudoMoves = piece.pseudoLegalMoves(this.board, square);

      for (const move of pseudoMoves) {
        // NOTE: push/pop will be implemented next
        this.board.push(move);
        this.switchTurn();

        if (!this.isInCheck(Color.opponent(this.turn))) {
          legal.push(move);
        }

        this.switchTurn();
        this.board.pop();
      }
    }

    return legal;
  }

  // ──────────────────────────────────────────────────────
  // Check detection
  // ──────────────────────────────────────────────────────

  isInCheck(color) {
    const kingSq = this.findKing(color);
    return this.board.isSquareAttacked(
      kingSq,
      Color.opponent(color)
    );
  }

  findKing(color) {
    for (const [square, piece] of this.board.piecesOfColor(color)) {
      if (piece instanceof King) {
        return square;
      }
    }
    throw new Error(`King not found for ${color}`);
  }
}
