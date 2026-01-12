export class Move {
  constructor(fromSq, toSq, options = {}) {
    this.fromSq = fromSq;
    this.toSq = toSq;
    this.captured = options.captured || null;
    this.promotion = options.promotion || null;
    this.isCastling = options.isCastling || false;
    this.isEnPassant = options.isEnPassant || false;
  }
}
