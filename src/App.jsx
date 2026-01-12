import { useEffect, useMemo, useState } from "react";
import { Game } from "../engine/game.js";
import { Color } from "../engine/util.js";
import { findBestMove } from "../engine/search.js";

import {
  IconChessQueen,
  IconChessRook,
  IconChessBishop,
  IconChessKnight,
} from "@tabler/icons-react";

import ChessBoard from "./components/ChessBoard.jsx";
import CapturedPieces from "./components/CapturedPieces.jsx";

function getStatusText(game) {
  const legalMoves = game.legalMoves();

  if (legalMoves.length === 0) {
    if (game.isInCheck(game.turn)) {
      return game.turn === Color.WHITE
        ? "Checkmate! Black wins."
        : "Checkmate! White wins.";
    }
    return "Stalemate.";
  }

  return game.turn === Color.WHITE ? "White to move" : "Black to move";
}

export default function App() {
  const [game, setGame] = useState(() => new Game());
  const [playerColor, setPlayerColor] = useState(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [capturedByWhite, setCapturedByWhite] = useState([]);
  const [capturedByBlack, setCapturedByBlack] = useState([]);
  const [kingFlashSquare, setKingFlashSquare] = useState(null);
  const [checkmateAnim, setCheckmateAnim] = useState(false);
  const [checkmatedKingSquare, setCheckmatedKingSquare] = useState(null);
  const [tick, setTick] = useState(0);
  const [isEngineThinking, setIsEngineThinking] = useState(false);

  const engineDepth = 3;
  const engineColor = useMemo(
    () => (playerColor ? Color.opponent(playerColor) : null),
    [playerColor]
  );

  const statusText = useMemo(() => getStatusText(game), [game, tick]);

  const checkmateInfo = useMemo(() => {
    const legal = game.legalMoves();
    const isCheckmate = legal.length === 0 && game.isInCheck(game.turn);
    return {
      isCheckmate,
      checkmatedColor: isCheckmate ? game.turn : null,
    };
  }, [game, tick]);

  const highlightedSquares = useMemo(() => {
    if (!selectedSquare) return [];
    return game
      .legalMoves()
      .filter((m) => squaresEqual(m.fromSq, selectedSquare))
      .map((m) => m.toSq);
  }, [game, tick, selectedSquare]);

  function forceRender() {
    setTick((t) => t + 1);
  }

  function resetGame() {
    setGame(new Game());
    setPlayerColor(null);
    setSelectedSquare(null);
    setPendingPromotion(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setKingFlashSquare(null);
    setCheckmateAnim(false);
    setCheckmatedKingSquare(null);
    setIsEngineThinking(false);
  }

  useEffect(() => {
    if (!checkmateInfo.isCheckmate) {
      setCheckmateAnim(false);
      setCheckmatedKingSquare(null);
      return;
    }

    // Wait 3 seconds, then play a fun checkmate animation.
    const kingSq = game.findKing(checkmateInfo.checkmatedColor);
    setCheckmatedKingSquare(kingSq);

    const startTimer = window.setTimeout(() => {
      setCheckmateAnim(true);
    }, 3000);

    const stopTimer = window.setTimeout(() => {
      setCheckmateAnim(false);
    }, 3000 + 1400);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(stopTimer);
    };
  }, [checkmateInfo.isCheckmate, checkmateInfo.checkmatedColor, game]);

  function flashKing(color) {
    const kingSq = game.findKing(color);
    // Toggle off then on to reliably restart the CSS animation.
    setKingFlashSquare(null);
    window.requestAnimationFrame(() => {
      setKingFlashSquare(kingSq);
      window.setTimeout(() => setKingFlashSquare(null), 520);
    });
  }

  function recordCapture(move, moverColor) {
    if (!move?.captured) return;
    if (moverColor === Color.WHITE) {
      setCapturedByWhite((prev) => [...prev, move.captured]);
    } else {
      setCapturedByBlack((prev) => [...prev, move.captured]);
    }
  }

  function squaresEqual(a, b) {
    return a && b && a[0] === b[0] && a[1] === b[1];
  }

  function requestEngineMove(forGame = game, forEngineColor = engineColor) {
    if (!forEngineColor) return;
    if (forGame.turn !== forEngineColor) return;

    const replies = forGame.legalMoves();
    if (replies.length === 0) return;

    setIsEngineThinking(true);

    window.setTimeout(() => {
      try {
        const moverColor = forGame.turn;
        const reply = findBestMove(forGame, engineDepth);
        if (!reply) return;

        recordCapture(reply, moverColor);
        forGame.board.push(reply);
        setLastMove(reply);
        forGame.switchTurn();
        forceRender();
      } finally {
        setIsEngineThinking(false);
      }
    }, 250);
  }

  function applyMove(move) {
    const moverColor = game.turn;
    recordCapture(move, moverColor);
    game.board.push(move);
    setLastMove(move);
    game.switchTurn();
    setSelectedSquare(null);
    setPendingPromotion(null);
    forceRender();
    requestEngineMove();
  }

  function onSquareClick(square) {
    if (isEngineThinking) return;
    if (pendingPromotion) return;
    if (!playerColor) return;
    if (game.turn !== playerColor) return;

    const piece = game.board.pieceAt(square);

    if (!selectedSquare) {
      if (piece && piece.color === game.turn) {
        setSelectedSquare(square);
      }
      return;
    }

    // If you click another of your own pieces, switch selection immediately.
    // Clicking the same square toggles selection off.
    if (piece && piece.color === game.turn) {
      if (squaresEqual(selectedSquare, square)) {
        setSelectedSquare(null);
      } else {
        setSelectedSquare(square);
      }
      return;
    }

    const candidates = game
      .legalMoves()
      .filter(
        (m) => squaresEqual(m.fromSq, selectedSquare) && squaresEqual(m.toSq, square)
      );

    if (candidates.length === 0) {
      const selectedPiece = game.board.pieceAt(selectedSquare);
      const pseudoMoves =
        selectedPiece?.pseudoLegalMoves?.(game.board, selectedSquare) ?? [];
      const hasPseudoTo = pseudoMoves.some((m) => squaresEqual(m.toSq, square));

      // If the move is pseudo-legal but not legal, it's illegal due to self-check.
      if (hasPseudoTo) {
        flashKing(game.turn);
      }

      setSelectedSquare(null);
      return;
    }

    if (candidates.length === 1) {
      applyMove(candidates[0]);
      return;
    }

    // Promotion: multiple legal moves for the same from/to squares.
    setPendingPromotion({ fromSq: selectedSquare, toSq: square, moves: candidates });
  }

  function onChoosePlayerColor(nextColor) {
    setPlayerColor(nextColor);

    const newGame = new Game();
    setGame(newGame);
    setSelectedSquare(null);
    setPendingPromotion(null);
    setLastMove(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setIsEngineThinking(false);
    forceRender();

    if (nextColor === Color.BLACK) {
      requestEngineMove(newGame, Color.WHITE);
    }
  }

  function onChoosePromotion(promo) {
    if (!pendingPromotion) return;
    const chosen = pendingPromotion.moves.find((m) => m.promotion === promo);
    if (!chosen) return;
    applyMove(chosen);
  }

  return (
    <div className="page">
      <div className="pageActions">
        <button className="button" onClick={resetGame} disabled={isEngineThinking}>
          New game
        </button>
      </div>
      <main className="layout">
        <section className="card">
          <div className="playArea">
            <ChessBoard
              game={game}
              perspective={playerColor ?? Color.WHITE}
              selectedSquare={selectedSquare}
              highlightedSquares={highlightedSquares}
              lastMove={lastMove}
              kingFlashSquare={kingFlashSquare}
              checkmateAnim={checkmateAnim}
              checkmatedKingSquare={checkmatedKingSquare}
              onSquareClick={onSquareClick}
            />
            <CapturedPieces
              capturedByWhite={capturedByWhite}
              capturedByBlack={capturedByBlack}
            />
          </div>

          {pendingPromotion ? (
            <div className="promotionRow" role="group" aria-label="Choose promotion">
              <div className="promotionLabel">Promote to</div>
              <button
                type="button"
                className="button promoButton"
                onClick={() => onChoosePromotion("Q")}
              >
                <IconChessQueen size={18} stroke={2.2} />
                Queen
              </button>
              <button
                type="button"
                className="button promoButton"
                onClick={() => onChoosePromotion("R")}
              >
                <IconChessRook size={18} stroke={2.2} />
                Rook
              </button>
              <button
                type="button"
                className="button promoButton"
                onClick={() => onChoosePromotion("B")}
              >
                <IconChessBishop size={18} stroke={2.2} />
                Bishop
              </button>
              <button
                type="button"
                className="button promoButton"
                onClick={() => onChoosePromotion("N")}
              >
                <IconChessKnight size={18} stroke={2.2} />
                Knight
              </button>
              <button
                type="button"
                className="button promoButton"
                onClick={() => setPendingPromotion(null)}
              >
                Cancel
              </button>
            </div>
          ) : null}

          <div className="statusRow">
            <div className="status">{statusText}</div>
            {isEngineThinking ? <div className="thinking">Engine thinking…</div> : null}
          </div>
        </section>
      </main>

      {!playerColor ? (
        <div className="modalOverlay" role="dialog" aria-modal="true">
          <div className="modalCard">
            <div className="modalTitle">Choose your color</div>
            <div className="modalActions">
              <button
                className="button modalButton"
                onClick={() => onChoosePlayerColor(Color.WHITE)}
                type="button"
              >
                White
              </button>
              <button
                className="button modalButton"
                onClick={() => onChoosePlayerColor(Color.BLACK)}
                type="button"
              >
                Black
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
