import { Shape } from './Shape';
export class Group implements Shape {
  public children: Shape[] = [];
  constructor(public id: string) {}
  getType() { return 'g'; }
  add(shape: Shape) { this.children.push(shape); }
  remove(id: string) { 
    const idx = this.children.findIndex(c => c.id === id);
    if (idx !== -1) return this.children.splice(idx, 1)[0];
    return undefined;
  }
  find(id: string): Shape | undefined {
    for (const child of this.children) {
      if (child.id === id) return child;
      if (child instanceof Group) {
        const found = child.find(id);
        if (found) return found;
      }
    }
    return undefined;
  }
  findParent(id: string): Group | undefined {
    if (this.children.some(c => c.id === id)) return this;
    for (const child of this.children) {
      if (child instanceof Group) {
        const p = child.findParent(id);
        if (p) return p;
      }
    }
    return undefined;
  }
  move(dx: number, dy: number) { this.children.forEach(c => c.move(dx, dy)); }
  toSVG() { return `<g id="${this.id}">\n${this.children.map(c => c.toSVG()).join('\n')}\n</g>`; }
}