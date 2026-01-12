import pawnWhite from "../../assets/pieces/pawn-white.png";
import pawnBlack from "../../assets/pieces/pawn-black.png";
import knightWhite from "../../assets/pieces/knight-white.png";
import knightBlack from "../../assets/pieces/knight-black.png";
import bishopWhite from "../../assets/pieces/bishop-white.png";
import bishopBlack from "../../assets/pieces/bishop-black.png";
import rookWhite from "../../assets/pieces/rook-white.png";
import rookBlack from "../../assets/pieces/rook-black.png";
import queenWhite from "../../assets/pieces/queen-white.png";
import queenBlack from "../../assets/pieces/queen-black.png";
import kingWhite from "../../assets/pieces/king-white.png";
import kingBlack from "../../assets/pieces/king-black.png";

import { Color } from "../../engine/util.js";

import { Pawn } from "../../engine/pieces/pawn.js";
import { Knight } from "../../engine/pieces/knight.js";
import { Bishop } from "../../engine/pieces/bishop.js";
import { Rook } from "../../engine/pieces/rook.js";
import { Queen } from "../../engine/pieces/queen.js";
import { King } from "../../engine/pieces/king.js";

const IMAGES = {
  [Color.WHITE]: {
    Pawn: pawnWhite,
    Knight: knightWhite,
    Bishop: bishopWhite,
    Rook: rookWhite,
    Queen: queenWhite,
    King: kingWhite,
  },
  [Color.BLACK]: {
    Pawn: pawnBlack,
    Knight: knightBlack,
    Bishop: bishopBlack,
    Rook: rookBlack,
    Queen: queenBlack,
    King: kingBlack,
  },
};

export default function PieceIcon({ piece, pieceName, color, size = 34 }) {
  const resolvedName =
    pieceName ??
    (piece instanceof Pawn
      ? "Pawn"
      : piece instanceof Knight
        ? "Knight"
        : piece instanceof Bishop
          ? "Bishop"
          : piece instanceof Rook
            ? "Rook"
            : piece instanceof Queen
              ? "Queen"
              : piece instanceof King
                ? "King"
                : null);
  const resolvedColor = color ?? piece?.color;

  const src = IMAGES[resolvedColor]?.[resolvedName];
  if (!src) return null;

  const isWhite = resolvedColor === Color.WHITE;

  return (
    <span className={isWhite ? "piece pieceWhite" : "piece pieceBlack"} aria-hidden="true">
      <img
        className="pieceImg"
        src={src}
        alt=""
        draggable="false"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
