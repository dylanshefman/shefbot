import { Game } from "../engine/game.js";
import { Color } from "../engine/util.js";
import { findBestMove } from "../engine/search.js";


const game = new Game();
const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");

let selectedSquare = null;

/* ─────────────────────────────────────────────
   Rendering
───────────────────────────────────────────── */

function render() {
  boardDiv.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const squareDiv = document.createElement("div");
      squareDiv.classList.add("square");

      const isLight = (row + col) % 2 === 0;
      squareDiv.classList.add(isLight ? "white" : "black");

      const square = [row, col];
      const piece = game.board.pieceAt(square);

      if (piece) {
        const img = document.createElement("img");
        img.src = pieceImageSrc(piece);
        img.alt = piece.constructor.name;

        squareDiv.appendChild(img);
      }

      if (
        selectedSquare &&
        selectedSquare[0] === row &&
        selectedSquare[1] === col
      ) {
        squareDiv.classList.add("selected");
      }

      squareDiv.addEventListener("click", () => onSquareClick(square));

      boardDiv.appendChild(squareDiv);
    }
  }

  updateStatus();
}

function updateStatus() {
  const legalMoves = game.legalMoves();

  if (legalMoves.length === 0) {
    if (game.isInCheck(game.turn)) {
      statusDiv.textContent =
        game.turn === Color.WHITE
          ? "Checkmate! Black wins."
          : "Checkmate! White wins.";
    } else {
      statusDiv.textContent = "Stalemate.";
    }
    return;
  }

  statusDiv.textContent =
    game.turn === Color.WHITE ? "White to move" : "Black to move";
}

/* ─────────────────────────────────────────────
   Interaction
───────────────────────────────────────────── */

function onSquareClick(square) {
  const piece = game.board.pieceAt(square);

  // No square selected yet → select own piece
  if (!selectedSquare) {
    if (piece && piece.color === game.turn) {
      selectedSquare = square;
      render();
    }
    return;
  }

  // Try to make a move
  const move = game
    .legalMoves()
    .find(
      (m) =>
        squaresEqual(m.fromSq, selectedSquare) && squaresEqual(m.toSq, square)
    );

  // Illegal → deselect
  if (!move) {
    selectedSquare = null;
    render();
    return;
  }

  // Apply player move
  game.board.push(move);
  game.switchTurn();
  selectedSquare = null;
  render();

  // Engine reply (TEMP: random move)
  setTimeout(() => {
    const replies = game.legalMoves();
    if (replies.length === 0) return;

    const reply = findBestMove(game, 3); // depth 3

    game.board.push(reply);
    game.switchTurn();
    render();
  }, 300);
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function squaresEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function pieceImageSrc(piece) {
  const nameMap = {
    Pawn: "pawn",
    Knight: "knight",
    Bishop: "bishop",
    Rook: "rook",
    Queen: "queen",
    King: "king",
  };

  const pieceName = nameMap[piece.constructor.name];
  const color = piece.color === Color.WHITE ? "white" : "black";

  return `assets/pieces/${pieceName}-${color}.png`;
}


/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */

render();
