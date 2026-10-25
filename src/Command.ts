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

export class MoveCommand implements Command {
  constructor(private shape: Shape, private dx: number, private dy: number) {}
  execute() { this.shape.move(this.dx, this.dy); }
  undo() { this.shape.move(-this.dx, -this.dy); }
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
    if (this.parent) {
      this.parent.children.splice(this.index, 0, this.shape);
    }
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
    // 逆序放回原处
    for (let i = this.ids.length - 1; i >= 0; i--) {
      const shape = this.newGroup.children.find(c => c.id === this.ids[i]);
      if (shape) {
        const orig = this.originals[i];
        orig.parent.children.splice(orig.index, 0, shape);
      }
    }
  }
}