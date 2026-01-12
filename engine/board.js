import { Color } from "./util.js";
import { Pawn } from "./pieces/pawn.js";
import { Knight } from "./pieces/knight.js";
import { Bishop } from "./pieces/bishop.js";
import { Rook } from "./pieces/rook.js";
import { Queen } from "./pieces/queen.js";
import { King } from "./pieces/king.js";

class Undo {
  constructor({
    move,
    capturedPiece,
    enPassantTarget,
    castlingRights,
    rookMove = null,
    promotionOriginalPiece = null,
  }) {
    this.move = move;
    this.capturedPiece = capturedPiece;
    this.enPassantTarget = enPassantTarget;
    this.castlingRights = castlingRights;
    this.rookMove = rookMove;
    this.promotionOriginalPiece = promotionOriginalPiece;
  }
}

export class Board {
  constructor() {
    this.grid = Array.from({ length: 8 }, () => Array(8).fill(null));

    this.enPassantTarget = null;

    this._history = [];

    this.castlingRights = {
      [Color.WHITE]: { K: true, Q: true },
      [Color.BLACK]: { K: true, Q: true },
    };

    this._setupInitialPosition();
  }

  // ──────────────────────────────────────────────────────
  // Initial setup
  // ──────────────────────────────────────────────────────

  _setupInitialPosition() {
    // BLACK back rank
    this.grid[0][0] = new Rook(Color.BLACK);
    this.grid[0][1] = new Knight(Color.BLACK);
    this.grid[0][2] = new Bishop(Color.BLACK);
    this.grid[0][3] = new Queen(Color.BLACK);
    this.grid[0][4] = new King(Color.BLACK);
    this.grid[0][5] = new Bishop(Color.BLACK);
    this.grid[0][6] = new Knight(Color.BLACK);
    this.grid[0][7] = new Rook(Color.BLACK);

    // BLACK pawns
    for (let col = 0; col < 8; col++) {
      this.grid[1][col] = new Pawn(Color.BLACK);
    }

    // WHITE pawns
    for (let col = 0; col < 8; col++) {
      this.grid[6][col] = new Pawn(Color.WHITE);
    }

    // WHITE back rank
    this.grid[7][0] = new Rook(Color.WHITE);
    this.grid[7][1] = new Knight(Color.WHITE);
    this.grid[7][2] = new Bishop(Color.WHITE);
    this.grid[7][3] = new Queen(Color.WHITE);
    this.grid[7][4] = new King(Color.WHITE);
    this.grid[7][5] = new Bishop(Color.WHITE);
    this.grid[7][6] = new Knight(Color.WHITE);
    this.grid[7][7] = new Rook(Color.WHITE);
  }

  // ──────────────────────────────────────────────────────
  // Basic accessors
  // ──────────────────────────────────────────────────────

  pieceAt(square) {
    const [row, col] = square;
    return this.grid[row][col];
  }

  setPiece(square, piece) {
    const [row, col] = square;
    this.grid[row][col] = piece;
  }

  squareEmpty(square) {
    return this.pieceAt(square) === null;
  }

  // ──────────────────────────────────────────────────────
  // Perspective-aware square movement
  // ──────────────────────────────────────────────────────

  /**
   * horizontalDelta: +right, -left
   * verticalDelta: +toward opponent, -toward own side
   */
  relativeSquare(startSq, horizontalDelta, verticalDelta, color) {
    const [row, col] = startSq;

    let newRow, newCol;

    if (color === Color.WHITE) {
      newRow = row - verticalDelta;
      newCol = col + horizontalDelta;
    } else {
      newRow = row + verticalDelta;
      newCol = col - horizontalDelta;
    }

    if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) {
      return null;
    }

    return [newRow, newCol];
  }

  // ──────────────────────────────────────────────────────
  // Pawn helpers
  // ──────────────────────────────────────────────────────

  getPawnStartRow(color) {
    return color === Color.WHITE ? 6 : 1;
  }

  getPromotionRow(color) {
    return color === Color.WHITE ? 0 : 7;
  }

  // ──────────────────────────────────────────────────────
  // Iteration helpers
  // ──────────────────────────────────────────────────────

  /**
   * Returns array of [square, piece]
   */
  piecesOfColor(color) {
    const pieces = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.grid[row][col];
        if (piece && piece.color === color) {
          pieces.push([[row, col], piece]);
        }
      }
    }

    return pieces;
  }

  push(move) {
    const [fromRow, fromCol] = move.fromSq;
    const [toRow, toCol] = move.toSq;

    const movingPiece = this.grid[fromRow][fromCol];
    let capturedPiece = this.grid[toRow][toCol];

    // Save undo information
    const undo = new Undo({
      move,
      capturedPiece,
      enPassantTarget: this.enPassantTarget,
      castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
    });

    // Clear en passant by default
    this.enPassantTarget = null;

    // ── En passant capture ────────────────────────────────
    if (move.isEnPassant) {
      const capturedSq = [fromRow, toCol];
      capturedPiece = this.grid[capturedSq[0]][capturedSq[1]];
      undo.capturedPiece = capturedPiece;
      this.grid[capturedSq[0]][capturedSq[1]] = null;
    }

    // ── Move the piece ────────────────────────────────────
    this.grid[toRow][toCol] = movingPiece;
    this.grid[fromRow][fromCol] = null;

    // ── Promotion ─────────────────────────────────────────
    if (move.promotion) {
      undo.promotionOriginalPiece = movingPiece;

      const color = movingPiece.color;
      const promoMap = {
        Q: Queen,
        R: Rook,
        B: Bishop,
        N: Knight,
      };
      const PromoPiece = promoMap[move.promotion];
      if (!PromoPiece) {
        throw new Error(`Unknown promotion piece: ${move.promotion}`);
      }
      this.grid[toRow][toCol] = new PromoPiece(color);
    }

    // ── Pawn double move sets en passant target ───────────
    if (movingPiece instanceof Pawn) {
      if (Math.abs(fromRow - toRow) === 2) {
        const midRow = (fromRow + toRow) / 2;
        this.enPassantTarget = [midRow, fromCol];
      }
    }

    // ── Castling ──────────────────────────────────────────
    if (move.isCastling) {
      const row = fromRow;
      let rookFrom, rookTo;

      if (toCol > fromCol) {
        // King-side
        rookFrom = [row, 7];
        rookTo = [row, 5];
      } else {
        // Queen-side
        rookFrom = [row, 0];
        rookTo = [row, 3];
      }

      const rook = this.grid[rookFrom[0]][rookFrom[1]];
      this.grid[rookTo[0]][rookTo[1]] = rook;
      this.grid[rookFrom[0]][rookFrom[1]] = null;

      undo.rookMove = { rookFrom, rookTo };
    }

    // ── Update castling rights ────────────────────────────
    const color = movingPiece.color;

    if (movingPiece instanceof King) {
      this.castlingRights[color].K = false;
      this.castlingRights[color].Q = false;
    }

    if (movingPiece instanceof Rook) {
      if (fromCol === 0) this.castlingRights[color].Q = false;
      if (fromCol === 7) this.castlingRights[color].K = false;
    }

    if (capturedPiece && capturedPiece instanceof Rook) {
      const opp = capturedPiece.color;
      if (toCol === 0) this.castlingRights[opp].Q = false;
      if (toCol === 7) this.castlingRights[opp].K = false;
    }

    this._history.push(undo);
  }

  pop() {
    const undo = this._history.pop();
    const move = undo.move;

    const [fromRow, fromCol] = move.fromSq;
    const [toRow, toCol] = move.toSq;

    const movingPiece = undo.promotionOriginalPiece ?? this.grid[toRow][toCol];

    // ── Undo castling rook move ───────────────────────────
    if (undo.rookMove) {
      const { rookFrom, rookTo } = undo.rookMove;
      const rook = this.grid[rookTo[0]][rookTo[1]];
      this.grid[rookFrom[0]][rookFrom[1]] = rook;
      this.grid[rookTo[0]][rookTo[1]] = null;
    }

    // ── Restore moved piece ───────────────────────────────
    this.grid[fromRow][fromCol] = movingPiece;
    this.grid[toRow][toCol] = undo.capturedPiece;

    // ── Restore en passant capture ───────────────────────
    if (move.isEnPassant) {
      const capturedSq = [fromRow, toCol];
      this.grid[capturedSq[0]][capturedSq[1]] = undo.capturedPiece;
      this.grid[toRow][toCol] = null;
    }

    // ── Restore state ────────────────────────────────────
    this.enPassantTarget = undo.enPassantTarget;
    this.castlingRights = undo.castlingRights;
  }

  isSquareAttacked(square, byColor) {
    const [row, col] = square;

    // ──────────────────────────────────────────────────────
    // 1. Pawn attacks
    // ──────────────────────────────────────────────────────
    for (const h of [-1, 1]) {
      const attackerSq = this.relativeSquare(square, h, -1, byColor);

      if (!attackerSq) continue;

      const piece = this.pieceAt(attackerSq);
      if (piece && piece.color === byColor && piece instanceof Pawn) {
        return true;
      }
    }

    // ──────────────────────────────────────────────────────
    // 2. Knight attacks
    // ──────────────────────────────────────────────────────
    const knightDeltas = [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ];

    for (const [h, v] of knightDeltas) {
      const attackerSq = this.relativeSquare(square, h, v, byColor);

      if (!attackerSq) continue;

      const piece = this.pieceAt(attackerSq);
      if (piece && piece.color === byColor && piece instanceof Knight) {
        return true;
      }
    }

    // ──────────────────────────────────────────────────────
    // 3. Sliding pieces (rook / bishop / queen)
    // ──────────────────────────────────────────────────────
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1], // rook-like
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1], // bishop-like
    ];

    for (const [h, v] of directions) {
      let step = 1;

      while (true) {
        const attackerSq = this.relativeSquare(
          square,
          h * step,
          v * step,
          byColor
        );

        if (!attackerSq) break;

        const piece = this.pieceAt(attackerSq);
        if (!piece) {
          step++;
          continue;
        }

        if (piece.color === byColor) {
          if (
            piece instanceof Queen ||
            (piece instanceof Rook && (h === 0 || v === 0)) ||
            (piece instanceof Bishop && h !== 0 && v !== 0)
          ) {
            return true;
          }
        }

        break; // blocked by any piece
      }
    }

    // ──────────────────────────────────────────────────────
    // 4. King adjacency
    // ──────────────────────────────────────────────────────
    for (const h of [-1, 0, 1]) {
      for (const v of [-1, 0, 1]) {
        if (h === 0 && v === 0) continue;

        const attackerSq = this.relativeSquare(square, h, v, byColor);

        if (!attackerSq) continue;

        const piece = this.pieceAt(attackerSq);
        if (piece && piece.color === byColor && piece instanceof King) {
          return true;
        }
      }
    }

    return false;
  }

  toFEN() {
    const rows = [];

    for (let r = 0; r < 8; r++) {
      let empty = 0;
      let rowStr = "";

      for (let c = 0; c < 8; c++) {
        const piece = this.grid[r][c];

        if (!piece) {
          empty++;
          continue;
        }

        if (empty > 0) {
          rowStr += empty;
          empty = 0;
        }

        let letter = "?";
        if (piece instanceof Pawn) letter = "P";
        else if (piece instanceof Knight) letter = "N";
        else if (piece instanceof Bishop) letter = "B";
        else if (piece instanceof Rook) letter = "R";
        else if (piece instanceof Queen) letter = "Q";
        else if (piece instanceof King) letter = "K";
        rowStr +=
          piece.color === "white" ? letter.toUpperCase() : letter.toLowerCase();
      }

      if (empty > 0) rowStr += empty;
      rows.push(rowStr);
    }

    return rows.join("/");
  }

  // ──────────────────────────────────────────────────────
  // Debug / utility
  // ──────────────────────────────────────────────────────

  clone() {
    const board = new Board();
    board.grid = this.grid.map((row) => row.slice());
    board.enPassantTarget = this.enPassantTarget;
    board.castlingRights = JSON.parse(JSON.stringify(this.castlingRights));
    return board;
  }
}
