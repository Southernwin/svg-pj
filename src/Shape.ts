export interface Shape {
  id: string;
  getType(): string;
  toSVG(): string;
  move(dx: number, dy: number): void;
}