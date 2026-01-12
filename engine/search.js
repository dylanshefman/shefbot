import { Color } from "./util.js";
import { evaluate } from "./evaluation.js";

const INF = 1e9;

/**
 * Entry point: find best move for current player
 */
export function findBestMove(game, depth) {
  let bestMove = null;
  let bestScore = -INF;

  const moves = game.legalMoves();

  for (const move of moves) {
    game.board.push(move);
    game.switchTurn();

    const score = minimax(
      game,
      depth - 1,
      -INF,
      INF,
      false
    );

    game.switchTurn();
    game.board.pop();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(game, depth, alpha, beta, maximizing) {
  const moves = game.legalMoves();

  // ── Terminal conditions ───────────────────────────────
  if (depth === 0) {
    return evaluate(game.board, Color.opponent(game.turn));
  }

  if (moves.length === 0) {
    // Checkmate or stalemate
    if (game.isInCheck(game.turn)) {
      return maximizing ? -INF : INF;
    }
    return 0;
  }

  // ── Max node ─────────────────────────────────────────
  if (maximizing) {
    let value = -INF;

    for (const move of moves) {
      game.board.push(move);
      game.switchTurn();

      value = Math.max(
        value,
        minimax(game, depth - 1, alpha, beta, false)
      );

      game.switchTurn();
      game.board.pop();

      alpha = Math.max(alpha, value);
      if (alpha >= beta) break; // beta cutoff
    }

    return value;
  }

  // ── Min node ─────────────────────────────────────────
  else {
    let value = INF;

    for (const move of moves) {
      game.board.push(move);
      game.switchTurn();

      value = Math.min(
        value,
        minimax(game, depth - 1, alpha, beta, true)
      );

      game.switchTurn();
      game.board.pop();

      beta = Math.min(beta, value);
      if (beta <= alpha) break; // alpha cutoff
    }

    return value;
  }
}
