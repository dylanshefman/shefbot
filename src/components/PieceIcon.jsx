import {
  IconChessBishop,
  IconChessKing,
  IconChessKnight,
  IconChessQueen,
  IconChessRook,
  IconChess,
} from "@tabler/icons-react";

import { Color } from "../../engine/util.js";

const ICONS = {
  Pawn: IconChess,
  Knight: IconChessKnight,
  Bishop: IconChessBishop,
  Rook: IconChessRook,
  Queen: IconChessQueen,
  King: IconChessKing,
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
