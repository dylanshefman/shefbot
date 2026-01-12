export class Piece {
  constructor(color) {
    this.color = color;
  }

  /**
   * @param {Board} board
   * @param {[number, number]} startSq
   * @returns {Move[]}
   */
  pseudoLegalMoves(board, startSq) {
    throw new Error("pseudoLegalMoves not implemented");
  }
}
