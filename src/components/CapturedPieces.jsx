import PieceIcon from "./PieceIcon.jsx";

const MATERIAL_ORDER = ["Queen", "Rook", "Bishop", "Knight", "Pawn"];

function groupCaptured(pieces) {
  const groups = new Map();

  for (const piece of pieces) {
    const key = piece?.constructor?.name;
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
              <div key={`w-${piece.constructor.name}`} className="capturedItem">
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
              <div key={`b-${piece.constructor.name}`} className="capturedItem">
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
