import PieceIcon from "./PieceIcon.jsx";

import { Pawn } from "../../engine/pieces/pawn.js";
import { Knight } from "../../engine/pieces/knight.js";
import { Bishop } from "../../engine/pieces/bishop.js";
import { Rook } from "../../engine/pieces/rook.js";
import { Queen } from "../../engine/pieces/queen.js";

const MATERIAL_ORDER = ["Queen", "Rook", "Bishop", "Knight", "Pawn"];

function pieceType(piece) {
  if (piece instanceof Queen) return "Queen";
  if (piece instanceof Rook) return "Rook";
  if (piece instanceof Bishop) return "Bishop";
  if (piece instanceof Knight) return "Knight";
  if (piece instanceof Pawn) return "Pawn";
  return null;
}

function groupCaptured(pieces) {
  const groups = new Map();

  for (const piece of pieces) {
    const key = pieceType(piece);
    if (!key) continue;

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { piece, count: 1 });
    }
  }

  const ordered = [];
  for (const name of MATERIAL_ORDER) {
    const group = groups.get(name);
    if (group) ordered.push(group);
  }
  return ordered;
}

export default function CapturedPieces({ capturedByWhite = [], capturedByBlack = [] }) {
  const white = groupCaptured(capturedByWhite);
  const black = groupCaptured(capturedByBlack);

  return (
    <aside className="captured" aria-label="Captured pieces">
      <div className="capturedSection">
        <div className="capturedTitle">White captured</div>
        <div className="capturedRow" aria-label="Pieces captured by White">
          {white.length ? (
            white.map(({ piece, count }) => (
              <div key={`w-${pieceType(piece)}`} className="capturedItem">
                <PieceIcon piece={piece} size={28} />
                {count > 1 ? <span className="capturedCount">x{count}</span> : null}
              </div>
            ))
          ) : (
            <div className="capturedEmpty">None</div>
          )}
        </div>
      </div>

      <div className="capturedSection">
        <div className="capturedTitle">Black captured</div>
        <div className="capturedRow" aria-label="Pieces captured by Black">
          {black.length ? (
            black.map(({ piece, count }) => (
              <div key={`b-${pieceType(piece)}`} className="capturedItem">
                <PieceIcon piece={piece} size={28} />
                {count > 1 ? <span className="capturedCount">x{count}</span> : null}
              </div>
            ))
          ) : (
            <div className="capturedEmpty">None</div>
          )}
        </div>
      </div>
    </aside>
  );
}
