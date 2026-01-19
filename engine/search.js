import { Color } from "./util.js";
import { evaluate } from "./evaluation.js";

import { Pawn } from "./pieces/pawn.js";
import { Knight } from "./pieces/knight.js";
import { Bishop } from "./pieces/bishop.js";
import { Rook } from "./pieces/rook.js";
import { Queen } from "./pieces/queen.js";

const INF = 1e15;
const MATE = 1e12;

const TT_FLAG = {
  EXACT: 0,
  LOWER: 1,
  UPPER: 2,
};

function pieceValueCp(piece) {
  if (!piece) return 0;
  if (piece instanceof Pawn) return 100;
  if (piece instanceof Knight) return 320;
  if (piece instanceof Bishop) return 330;
  if (piece instanceof Rook) return 500;
  if (piece instanceof Queen) return 900;
  return 0;
}

function squareKey([r, c]) {
  return `${r}${c}`;
}

function moveKey(move) {
  const promo = move.promotion ? move.promotion : "";
  const ep = move.isEnPassant ? "e" : "";
  const cs = move.isCastling ? "c" : "";
  return `${squareKey(move.fromSq)}-${squareKey(move.toSq)}-${promo}${ep}${cs}`;
}

function positionKey(game) {
  const ep = game.board.enPassantTarget ? squareKey(game.board.enPassantTarget) : "-";
  const crW = game.board.castlingRights[Color.WHITE];
  const crB = game.board.castlingRights[Color.BLACK];
  const cr = `${crW.K ? "K" : ""}${crW.Q ? "Q" : ""}${crB.K ? "k" : ""}${crB.Q ? "q" : ""}` || "-";
  return `${game.board.toFEN()}|t:${game.turn}|ep:${ep}|cr:${cr}`;
}

function isTactical(move) {
  return !!move.captured || move.isEnPassant || !!move.promotion;
}

function orderMoves(game, moves, ply, ttBestMoveKey, killerMoves, history) {
  const fromToIndex = (move) => {
    const [fr, fc] = move.fromSq;
    const [tr, tc] = move.toSq;
    return ((fr * 8 + fc) << 6) | (tr * 8 + tc);
  };

  const killer0 = killerMoves[ply]?.[0];
  const killer1 = killerMoves[ply]?.[1];

  const scored = moves.map((move) => {
    const k = moveKey(move);
    let score = 0;

    if (ttBestMoveKey && k === ttBestMoveKey) score += 10_000_000;

    if (move.promotion) score += 5_000_000;

    if (isTactical(move)) {
      // MVV-LVA style capture ordering
      const capturedVal = pieceValueCp(move.captured);
      const moving = game.board.pieceAt(move.fromSq);
      const movingVal = pieceValueCp(moving);
      score += 1_000_000 + capturedVal * 10 - movingVal;
    } else {
      if (killer0 && k === killer0) score += 900_000;
      else if (killer1 && k === killer1) score += 800_000;
      score += history.get(fromToIndex(move)) || 0;
    }

    if (move.isCastling) score += 5_000;

    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.move);
}

/**
 * Entry point: find best move for current player
 */
export function findBestMove(game, depth) {
  // Re-create search state per top-level call to avoid memory leaks.
  const tt = new Map();
  const killerMoves = Array.from({ length: 64 }, () => [null, null]);
  const history = new Map();

  let bestMove = null;
  let bestScore = -INF;
  let alpha = -INF;
  let beta = INF;

  // Iterative deepening gives better move ordering at the same final depth.
  for (let d = 1; d <= depth; d++) {
    const result = rootSearch(game, d, alpha, beta, tt, killerMoves, history);
    bestMove = result.bestMove;
    bestScore = result.bestScore;

    // Aspiration window around last score (kept wide to avoid re-search loops).
    alpha = bestScore - 80;
    beta = bestScore + 80;
    if (alpha < -INF) alpha = -INF;
    if (beta > INF) beta = INF;
  }

  return bestMove;
}

function rootSearch(game, depth, alpha, beta, tt, killerMoves, history) {
  const key = positionKey(game);
  const ttEntry = tt.get(key);
  const ttBestMoveKey = ttEntry?.bestMoveKey || null;

  let moves = game.legalMoves();
  if (moves.length === 0) {
    return { bestMove: null, bestScore: game.isInCheck(game.turn) ? -MATE : 0 };
  }

  moves = orderMoves(game, moves, 0, ttBestMoveKey, killerMoves, history);

  let bestMove = moves[0];
  let bestScore = -INF;
  const alphaStart = alpha;

  for (const move of moves) {
    game.board.push(move);
    game.switchTurn();

    const score = -negamax(game, depth - 1, -beta, -alpha, 1, tt, killerMoves, history);

    game.switchTurn();
    game.board.pop();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }

    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  // Store root in TT for move ordering.
  let flag = TT_FLAG.EXACT;
  if (bestScore <= alphaStart) flag = TT_FLAG.UPPER;
  else if (bestScore >= beta) flag = TT_FLAG.LOWER;
  tt.set(key, { depth, score: bestScore, flag, bestMoveKey: moveKey(bestMove) });

  return { bestMove, bestScore };
}

function negamax(game, depth, alpha, beta, ply, tt, killerMoves, history) {
  const alphaStart = alpha;
  const key = positionKey(game);

  const ttEntry = tt.get(key);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === TT_FLAG.EXACT) return ttEntry.score;
    if (ttEntry.flag === TT_FLAG.LOWER) alpha = Math.max(alpha, ttEntry.score);
    else if (ttEntry.flag === TT_FLAG.UPPER) beta = Math.min(beta, ttEntry.score);
    if (alpha >= beta) return ttEntry.score;
  }

  const moves = game.legalMoves();
  if (moves.length === 0) {
    if (game.isInCheck(game.turn)) {
      // Prefer faster mates: closer ply => larger magnitude.
      return -(MATE - ply);
    }
    return 0;
  }

  if (depth === 0) {
    return quiescence(game, alpha, beta, ply, tt, killerMoves, history);
  }

  const ordered = orderMoves(game, moves, ply, ttEntry?.bestMoveKey || null, killerMoves, history);

  let bestScore = -INF;
  let bestMoveKeyLocal = null;

  for (const move of ordered) {
    game.board.push(move);
    game.switchTurn();

    const score = -negamax(game, depth - 1, -beta, -alpha, ply + 1, tt, killerMoves, history);

    game.switchTurn();
    game.board.pop();

    if (score > bestScore) {
      bestScore = score;
      bestMoveKeyLocal = moveKey(move);
    }

    if (score > alpha) alpha = score;
    if (alpha >= beta) {
      // Update killers/history for quiet moves.
      if (!isTactical(move)) {
        const mk = moveKey(move);
        const km = killerMoves[ply];
        if (km[0] !== mk) {
          km[1] = km[0];
          km[0] = mk;
        }

        const [fr, fc] = move.fromSq;
        const [tr, tc] = move.toSq;
        const idx = ((fr * 8 + fc) << 6) | (tr * 8 + tc);
        history.set(idx, (history.get(idx) || 0) + depth * depth);
      }

      break;
    }
  }

  let flag = TT_FLAG.EXACT;
  if (bestScore <= alphaStart) flag = TT_FLAG.UPPER;
  else if (bestScore >= beta) flag = TT_FLAG.LOWER;
  tt.set(key, { depth, score: bestScore, flag, bestMoveKey: bestMoveKeyLocal });

  return bestScore;
}

function quiescence(game, alpha, beta, ply, tt, killerMoves, history) {
  const standPat = evaluate(game.board, game.turn);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  // Only consider tactical moves to avoid horizon effect.
  let moves = game.legalMoves().filter(isTactical);
  if (moves.length === 0) return alpha;

  moves = orderMoves(game, moves, ply, null, killerMoves, history);

  for (const move of moves) {
    game.board.push(move);
    game.switchTurn();

    const score = -quiescence(game, -beta, -alpha, ply + 1, tt, killerMoves, history);

    game.switchTurn();
    game.board.pop();

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}
