export interface Shape {
  id: string;
  getType(): string;
  toSVG(): string;
  move(dx: number, dy: number): void;
  scale(factor: number): void;
  set(attr: string, value: string): boolean;
}

export class BaseShape implements Shape {
  constructor(public id: string, public tag: string, public attrs: Record<string, any>) {}
  getType() { return this.tag; }
  
  move(dx: number, dy: number) {
    const numericKeys = ['x', 'y', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2'];
    for (const k of numericKeys) {
      if (this.attrs[k] !== undefined) this.attrs[k] += dx;
      if (k === 'x' && this.attrs.y !== undefined) this.attrs.y += dy;
    }
  }
  
  scale(f: number) {
    const numericKeys = ['x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'x1', 'y1', 'x2', 'y2'];
    for (const k of numericKeys) {
      if (this.attrs[k] !== undefined) this.attrs[k] *= f;
    }
  }
  
  set(attr: string, value: string): boolean {
    const whiteList = ['fill', 'stroke', 'stroke-width'];
    const geoList = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'text'];
    if (!whiteList.includes(attr) && !geoList.includes(attr)) return false;
    
    const oldValue = this.attrs[attr];
    if (geoList.includes(attr) && attr !== 'text') {
      this.attrs[attr] = parseFloat(value);
    } else {
      this.attrs[attr] = value;
    }
    return true;
  }
  
  toSVG(): string {
    const attrStr = Object.entries(this.attrs)
      .filter(([k, v]) => k !== 'text' && v !== undefined)
      .map(([k, v]) => `${k}="${v}"`).join(' ');
    if (this.tag === 'text') {
      return `<text id="${this.id}" ${attrStr}>${this.attrs.text || ''}</text>`;
    }
    return `<${this.tag} id="${this.id}" ${attrStr}/>`;
  }
}