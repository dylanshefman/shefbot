import PieceIcon from "./PieceIcon.jsx";
import { Color } from "../../engine/util.js";
import { Crown } from "lucide-react";

export default function ChessBoard({
  game,
  perspective = Color.WHITE,
  selectedSquare,
  highlightedSquares = [],
  highlightedMoves = [],
  lastMove = null,
  kingFlashSquare = null,
  checkmateAnim = false,
  checkmatedKingSquare = null,
  onSquareClick,
}) {
  function isSquareInList(square, list) {
    return list.some((s) => s[0] === square[0] && s[1] === square[1]);
  }

  function squaresEqual(a, b) {
    return a && b && a[0] === b[0] && a[1] === b[1];
  }

  function findHighlightedMoveTo(square) {
    return highlightedMoves.find((m) => squaresEqual(m.toSq, square)) ?? null;
  }

  function toBoardSquare(displayRow, displayCol) {
    if (perspective === Color.BLACK) {
      return [7 - displayRow, 7 - displayCol];
    }
    return [displayRow, displayCol];
  }

  return (
    <div
      className={["board", checkmateAnim ? "boardCheckmate" : ""].join(" ")}
      role="grid"
      aria-label="Chess board"
    >
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((__, col) => {
          const isLight = (row + col) % 2 === 0;
          const square = toBoardSquare(row, col);
          const piece = game.board.pieceAt(square);
          const isSelected =
            selectedSquare && squaresEqual(selectedSquare, square);

          const isLastFrom = lastMove ? squaresEqual(lastMove.fromSq, square) : false;
          const isLastTo = lastMove ? squaresEqual(lastMove.toSq, square) : false;

          const isHighlighted = selectedSquare
            ? isSquareInList(square, highlightedSquares)
            : false;
          const isCaptureHint = isHighlighted && !!piece;
          const highlightedMove = isHighlighted ? findHighlightedMoveTo(square) : null;
          const isCastlingHint =
            isHighlighted && !piece && !!highlightedMove?.isCastling;

          const isKingFlash = kingFlashSquare
            ? squaresEqual(kingFlashSquare, square)
            : false;

          const isCheckmatedKing = checkmatedKingSquare
            ? squaresEqual(checkmatedKingSquare, square)
            : false;

          return (
            <button
              key={`${row}-${col}`}
              type="button"
              className={[
                "square",
                isLight ? "squareLight" : "squareDark",
                isLastFrom ? "squareLastFrom" : "",
                isLastTo ? "squareLastTo" : "",
                isCheckmatedKing ? "squareCheckmatedKing" : "",
                isKingFlash ? "squareKingFlash" : "",
                isSelected ? "squareSelected" : "",
                isHighlighted ? "squareHint" : "",
                isCaptureHint ? "squareHintCapture" : "",
                isCastlingHint ? "squareHintCastle" : "",
              ].join(" ")}
              onClick={() => onSquareClick(square)}
              aria-label={`Square ${row}, ${col}`}
            >
              {piece ? <PieceIcon piece={piece} /> : null}
              {isCastlingHint ? (
                <span className="squareHintCastleIcon" aria-hidden="true">
                  <Crown size={22} strokeWidth={2.25} />
                </span>
              ) : null}
            </button>
          );
        })
      )}
    </div>
  );
}
