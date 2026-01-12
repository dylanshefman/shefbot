export const Color = {
  WHITE: "white",
  BLACK: "black",
  opponent(color) {
    return color === this.WHITE ? this.BLACK : this.WHITE;
  }
};
