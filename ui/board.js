export function initBoard(game) {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "Board goes here";
}

export function renderBoard(game) {
  // later: convert game.board → FEN
}
