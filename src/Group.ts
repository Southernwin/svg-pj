import { Shape } from './Shape';

export class Group implements Shape {
  public children: Shape[] = [];
  constructor(public id: string) {}
  getType() { return 'g'; }

  toSVG(): string {
    return `<g id="${this.id}">\n${this.children.map(c => '  ' + c.toSVG()).join('\n')}\n</g>`;
  }

  move(dx: number, dy: number) { this.children.forEach(c => c.move(dx, dy)); }
  scale(f: number) { this.children.forEach(c => c.scale(f)); }
  set(attr: string, value: string): boolean {
    let any = false;
    for (const c of this.children) { if (c.set(attr, value)) any = true; }
    return any;
  }

  add(shape: Shape) { this.children.push(shape); }
  remove(id: string): Shape | undefined {
    const idx = this.children.findIndex(c => c.id === id);
    if (idx !== -1) return this.children.splice(idx, 1)[0];
    return undefined;
  }
    find(id: string): Shape | undefined {
    if (this.id === id) return this;
    for (const c of this.children) {
      if (c.id === id) return c;
      if (c instanceof Group) {
        const found = c.find(id);
        if (found) return found;
      }
    }
    return undefined;
  }
  findParent(id: string): Group | undefined {
    if (this.children.some(c => c.id === id)) return this;
    for (const c of this.children) {
      if (c instanceof Group) {
        const p = c.findParent(id);
        if (p) return p;
      }
    }
    return undefined;
  }
}