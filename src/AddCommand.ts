import { Command } from './Command';
import { Group } from './Group';
import { Shape } from './Shape';
export class AddCommand implements Command {
  constructor(private parent: Group, private shape: Shape) {}
  execute() { this.parent.add(this.shape); }
  undo() { this.parent.remove(this.shape.id); }
}