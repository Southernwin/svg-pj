import { Shape } from './Shape';
export class Rect implements Shape {
  constructor(public id: string, public x: number, public y: number, public w: number, public h: number, public fill: string = 'black') {}
  getType() { return 'rect'; }
  move(dx: number, dy: number) { this.x += dx; this.y += dy; }
  toSVG() { return `<rect id="${this.id}" x="${this.x}" y="${this.y}" width="${this.w}" height="${this.h}" fill="${this.fill}"/>`; }
}