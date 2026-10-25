import { Group } from './Group';
import { Shape } from './Shape';

export interface Command {
  execute(): void;
  undo(): void;
}

export class AddCommand implements Command {
  constructor(private parent: Group, private shape: Shape) {}
  execute() { this.parent.add(this.shape); }
  undo() { this.parent.remove(this.shape.id); }
}

export class DeleteCommand implements Command {
  private parent?: Group;
  private index: number = -1;
  constructor(private root: Group, private shape: Shape) {}
  execute() {
    this.parent = this.root.findParent(this.shape.id);
    if (this.parent) {
      this.index = this.parent.children.findIndex(c => c.id === this.shape.id);
      this.parent.remove(this.shape.id);
    }
  }
  undo() {
    if (this.parent) this.parent.children.splice(this.index, 0, this.shape);
  }
}

export class MoveCommand implements Command {
  constructor(private shape: Shape, private dx: number, private dy: number) {}
  execute() { this.shape.move(this.dx, this.dy); }
  undo() { this.shape.move(-this.dx, -this.dy); }
}

export class ScaleCommand implements Command {
  constructor(private shape: Shape, private factor: number) {}
  execute() { this.shape.scale(this.factor); }
  undo() { this.shape.scale(1 / this.factor); }
}

export class SetCommand implements Command {
  private oldValue: any;
  constructor(private shape: Shape, private attr: string, private newValue: string) {}
  execute() {
    this.oldValue = (this.shape as any).attrs ? (this.shape as any).attrs[this.attr] : undefined;
    this.shape.set(this.attr, this.newValue);
  }
  undo() {
    if (this.oldValue !== undefined) this.shape.set(this.attr, String(this.oldValue));
  }
}

export class GroupCommand implements Command {
  private newGroup: Group;
  private originals: { parent: Group, index: number }[] = [];
  constructor(private root: Group, private ids: string[], groupId: string) {
    this.newGroup = new Group(groupId);
  }
  execute() {
    this.originals = [];
    for (const id of this.ids) {
      const parent = this.root.findParent(id);
      if (parent) {
        const index = parent.children.findIndex(c => c.id === id);
        const shape = parent.remove(id);
        if (shape) {
          this.originals.push({ parent, index });
          this.newGroup.add(shape);
        }
      }
    }
    this.root.add(this.newGroup);
  }
  undo() {
    this.root.remove(this.newGroup.id);
    for (let i = this.ids.length - 1; i >= 0; i--) {
      const shape = this.newGroup.children.find(c => c.id === this.ids[i]);
      if (shape && this.originals[i]) {
        this.originals[i].parent.children.splice(this.originals[i].index, 0, shape);
      }
    }
  }
}

export class UngroupCommand implements Command {
  private parent?: Group;
  private index: number = -1;
  private originalGroup: Group;
  constructor(private root: Group, groupId: string) {
    this.originalGroup = root.find(groupId) as Group;
  }
  execute() {
    this.parent = this.root.findParent(this.originalGroup.id);
    if (this.parent) {
      this.index = this.parent.children.findIndex(c => c.id === this.originalGroup.id);
      this.parent.children.splice(this.index, 1, ...this.originalGroup.children);
    }
  }
  undo() {
    if (this.parent) {
      this.parent.children.splice(this.index, this.originalGroup.children.length, this.originalGroup);
    }
  }
}

export class ZOrderCommand implements Command {
  private parent?: Group;
  private index: number = -1;
  constructor(private root: Group, private shapeId: string, private toFront: boolean) {}
  execute() {
    this.parent = this.root.findParent(this.shapeId);
    if (this.parent) {
      this.index = this.parent.children.findIndex(c => c.id === this.shapeId);
      const shape = this.parent.children.splice(this.index, 1)[0];
      if (this.toFront) this.parent.children.push(shape);
      else this.parent.children.unshift(shape);
    }
  }
  undo() {
    if (this.parent) {
      const shape = this.toFront ? this.parent.children.pop() : this.parent.children.shift();
      if (shape) this.parent.children.splice(this.index, 0, shape);
    }
  }
}

export class AddToCommand implements Command {
  private oldParent?: Group;
  private oldIndex: number = -1;
  constructor(private root: Group, private targetGid: string, private shapeId: string) {}
  execute() {
    const shape = this.root.find(this.shapeId);
    const target = this.root.find(this.targetGid) as Group;
    if (shape && target) {
      this.oldParent = this.root.findParent(this.shapeId);
      if (this.oldParent) {
        this.oldIndex = this.oldParent.children.findIndex(c => c.id === this.shapeId);
        this.oldParent.remove(this.shapeId);
        target.add(shape);
      }
    }
  }
  undo() {
    if (this.oldParent) {
      const target = this.root.find(this.targetGid) as Group;
      target.remove(this.shapeId);
      const shape = target.find(this.shapeId);
      if (shape) this.oldParent.children.splice(this.oldIndex, 0, shape);
    }
  }
}