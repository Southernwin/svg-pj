import { Command } from './Command';
import { Shape } from './Shape';
export class MoveCommand implements Command {
  constructor(private shape: Shape, private dx: number, private dy: number) {}
  execute() { this.shape.move(this.dx, this.dy); }
  undo() { this.shape.move(-this.dx, -this.dy); }
}