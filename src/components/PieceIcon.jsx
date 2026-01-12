import {
  iconChessBishop,
  iconChessKing,
  iconChessKnight,
  iconChessQueen,
  iconChessRook,
  iconChess,
} from "@tabler/icons-react";

import { Color } from "../../engine/util.js";

const ICONS = {
  Pawn: iconChess,
  Knight: iconChessKnight,
  Bishop: iconChessBishop,
  Rook: iconChessRook,
  Queen: iconChessQueen,
  King: iconChessKing,
};

export default function PieceIcon({ piece, size = 34 }) {
  const Icon = ICONS[piece.constructor.name];
  if (!Icon) return null;

  const isWhite = piece.color === Color.WHITE;

  return (
    <span className={isWhite ? "piece pieceWhite" : "piece pieceBlack"} aria-hidden="true">
      <Icon size={size} stroke={2.25} />
    </span>
  );
}
