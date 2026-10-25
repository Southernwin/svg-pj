import { Shape } from './Shape';
export class Circle implements Shape {
  constructor(public id: string, public cx: number, public cy: number, public r: number, public fill: string = 'black') {}
  getType() { return 'circle'; }
  move(dx: number, dy: number) { this.cx += dx; this.cy += dy; }
  toSVG() { return `<circle id="${this.id}" cx="${this.cx}" cy="${this.cy}" r="${this.r}" fill="${this.fill}"/>`; }
}