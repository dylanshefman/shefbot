import { Pawn } from "./pieces/pawn.js";
import { Knight } from "./pieces/knight.js";
import { Bishop } from "./pieces/bishop.js";
import { Rook } from "./pieces/rook.js";
import { Queen } from "./pieces/queen.js";
import { King } from "./pieces/king.js";

// Scores are in centipawns (pawn = 100).
const PIECE_VALUES = new Map([
  [Pawn, 100],
  [Knight, 320],
  [Bishop, 330],
  [Rook, 500],
  [Queen, 900],
  [King, 0], // king is handled by search (mate scores)
]);

// Piece-square tables from White's perspective.
// board.grid is indexed [row][col] with row 0 = rank 8 and row 7 = rank 1.
// For Black, we mirror vertically (row -> 7-row).
const PST = {
  pawn: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  knight: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  bishop: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  rook: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  queen: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  kingMg: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
  kingEg: [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ],
};

function mirroredRow(row, pieceColor) {
  return pieceColor === "white" ? row : 7 - row;
}

function pstForPiece(piece, row, col, endgameWeight) {
  const r = mirroredRow(row, piece.color);

  if (piece instanceof Pawn) return PST.pawn[r][col];
  if (piece instanceof Knight) return PST.knight[r][col];
  if (piece instanceof Bishop) return PST.bishop[r][col];
  if (piece instanceof Rook) return PST.rook[r][col];
  if (piece instanceof Queen) return PST.queen[r][col];
  if (piece instanceof King) {
    // Taper king PSQ between midgame and endgame.
    const mg = PST.kingMg[r][col];
    const eg = PST.kingEg[r][col];
    return Math.round(mg * (1 - endgameWeight) + eg * endgameWeight);
  }

  return 0;
}

function computeEndgameWeight(board) {
  // Simple tapered evaluation phase based on remaining material.
  // Max phase = 24 (Q=4, R=2, B=1, N=1 per side).
  let phase = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.grid[r][c];
      if (!piece) continue;
      if (piece instanceof Queen) phase += 4;
      else if (piece instanceof Rook) phase += 2;
      else if (piece instanceof Bishop) phase += 1;
      else if (piece instanceof Knight) phase += 1;
    }
  }
  const maxPhase = 24;
  const clamped = Math.max(0, Math.min(maxPhase, phase));
  // More pieces => middlegame; fewer pieces => endgame.
  return 1 - clamped / maxPhase;
}

function pawnStructureScore(board, perspectiveColor) {
  // Very small, cheap pawn features to reduce obvious blunders.
  const myPawnsByFile = Array(8).fill(0);
  const oppPawnsByFile = Array(8).fill(0);
  const myPawnSquares = [];
  const oppPawnSquares = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.grid[r][c];
      if (!piece || !(piece instanceof Pawn)) continue;

      if (piece.color === perspectiveColor) {
        myPawnsByFile[c]++;
        myPawnSquares.push([r, c]);
      } else {
        oppPawnsByFile[c]++;
        oppPawnSquares.push([r, c]);
      }
    }
  }

  let score = 0;

  // Doubled pawns penalty
  for (let file = 0; file < 8; file++) {
    if (myPawnsByFile[file] > 1) score -= 10 * (myPawnsByFile[file] - 1);
    if (oppPawnsByFile[file] > 1) score += 10 * (oppPawnsByFile[file] - 1);
  }

  // Isolated pawns penalty
  for (let file = 0; file < 8; file++) {
    if (myPawnsByFile[file] > 0) {
      const left = file > 0 ? myPawnsByFile[file - 1] : 0;
      const right = file < 7 ? myPawnsByFile[file + 1] : 0;
      if (left === 0 && right === 0) score -= 15;
    }
    if (oppPawnsByFile[file] > 0) {
      const left = file > 0 ? oppPawnsByFile[file - 1] : 0;
      const right = file < 7 ? oppPawnsByFile[file + 1] : 0;
      if (left === 0 && right === 0) score += 15;
    }
  }

  // Passed pawns bonus (small)
  const oppPawnSet = new Set(oppPawnSquares.map(([r, c]) => `${r},${c}`));
  for (const [r, c] of myPawnSquares) {
    let isPassed = true;
    const filesToCheck = [c];
    if (c > 0) filesToCheck.push(c - 1);
    if (c < 7) filesToCheck.push(c + 1);

    if (perspectiveColor === "white") {
      for (let rr = r - 1; rr >= 0 && isPassed; rr--) {
        for (const ff of filesToCheck) {
          if (oppPawnSet.has(`${rr},${ff}`)) {
            isPassed = false;
            break;
          }
        }
      }
      if (isPassed) {
        const advance = 6 - r; // from start rank (row 6) toward promotion
        score += 10 + 5 * Math.max(0, advance);
      }
    } else {
      for (let rr = r + 1; rr <= 7 && isPassed; rr++) {
        for (const ff of filesToCheck) {
          if (oppPawnSet.has(`${rr},${ff}`)) {
            isPassed = false;
            break;
          }
        }
      }
      if (isPassed) {
        const advance = r - 1; // from start rank (row 1) toward promotion
        score += 10 + 5 * Math.max(0, advance);
      }
    }
  }

  return score;
}

export function evaluate(board, color) {
  const endgameWeight = computeEndgameWeight(board);

  let score = 0;
  let bishopsFor = 0;
  let bishopsAgainst = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board.grid[r][c];
      if (!piece) continue;

      const value = PIECE_VALUES.get(piece.constructor) || 0;
      const psq = pstForPiece(piece, r, c, endgameWeight);

      const signed = piece.color === color ? 1 : -1;
      score += signed * (value + psq);

      if (piece instanceof Bishop) {
        if (piece.color === color) bishopsFor++;
        else bishopsAgainst++;
      }
    }
  }

  // Bishop pair bonus
  if (bishopsFor >= 2) score += 30;
  if (bishopsAgainst >= 2) score -= 30;

  // Pawn structure bonuses/penalties
  score += pawnStructureScore(board, color);

  return score;
}
