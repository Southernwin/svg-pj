import { Command } from './Command';

export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private canUndo = true;

  execute(cmd: Command) {
    cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack = [];
    this.canUndo = true;
  }
  undo() {
    if (!this.canUndo) return false;
    const cmd = this.undoStack.pop();
    if (cmd) { cmd.undo(); this.redoStack.push(cmd); return true; }
    return false;
  }
  redo() {
    if (!this.canUndo) return false;
    const cmd = this.redoStack.pop();
    if (cmd) { cmd.execute(); this.undoStack.push(cmd); return true; }
    return false;
  }
  lock() { this.canUndo = false; this.undoStack = []; this.redoStack = []; }
}