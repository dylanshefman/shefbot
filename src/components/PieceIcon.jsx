import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChessPawn,
  faChessKnight,
  faChessBishop,
  faChessRook,
  faChessQueen,
  faChessKing,
} from "@fortawesome/free-solid-svg-icons";

import { Color } from "../../engine/util.js";

const ICONS = {
  Pawn: faChessPawn,
  Knight: faChessKnight,
  Bishop: faChessBishop,
  Rook: faChessRook,
  Queen: faChessQueen,
  King: faChessKing,
};

export default function PieceIcon({ piece, size = 34 }) {
  const icon = ICONS[piece.constructor.name];
  if (!icon) return null;

  const isWhite = piece.color === Color.WHITE;

  return (
    <span className={isWhite ? "piece pieceWhite" : "piece pieceBlack"} aria-hidden="true">
      <FontAwesomeIcon icon={icon} style={{ fontSize: size }} />
    </span>
  );
}
