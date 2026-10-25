import * as readline from 'readline';
import * as fs from 'fs';
import { Group } from './Group';
import { Rect } from './Rect';
import { Circle } from './Circle';
import { CommandManager } from './CommandManager';
import { AddCommand } from './AddCommand';
import { MoveCommand } from './MoveCommand';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'svg> ' });
const root = new Group('svg');
const cmdMgr = new CommandManager();

console.log("svg-editor 0.1 — type 'help' for commands");
rl.prompt();

rl.on('line', (line: string) => {
  const args = line.trim().split(/\s+/);
  const cmd = args[0];

  if (cmd === 'exit') process.exit(0);
  if (cmd === 'init') { console.log('canvas initialized'); }
  else if (cmd === 'create') {
    const type = args[1], id = args[2];
    if (type === 'rect') {
      const shape = new Rect(id, +args[3], +args[4], +args[5], +args[6], args[7]);
      cmdMgr.execute(new AddCommand(root, shape));
      console.log(`rect#${id} created`);
    } else if (type === 'circle') {
      const shape = new Circle(id, +args[3], +args[4], +args[5], args[6]);
      cmdMgr.execute(new AddCommand(root, shape));
      console.log(`circle#${id} created`);
    } else if (type === 'g') {
      const shape = new Group(id);
      cmdMgr.execute(new AddCommand(root, shape));
      console.log(`g#${id} created`);
    }
  } 
  else if (cmd === 'move') {
    const id = args[1], dx = +args[2], dy = +args[3];
    const shape = root.find(id);
    if (shape) {
      cmdMgr.execute(new MoveCommand(shape, dx, dy));
      console.log(`moved ${id} by (${dx},${dy})`);
    } else { console.log(`error: no such shape: ${id}`); }
  }
  else if (cmd === 'undo') { cmdMgr.undo(); console.log('undo done'); }
  else if (cmd === 'redo') { cmdMgr.redo(); console.log('redo done'); }
  else if (cmd === 'tree') { console.log(root.toSVG()); }
  else if (cmd === 'save') {
    const filename = args[1] || 'output.svg';
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">\n${root.toSVG()}\n</svg>`;
    fs.writeFileSync(filename, svgContent);
    console.log(`saved to ${filename}`);
  }
  else { console.log(`error: unknown command: ${cmd}`); }

  rl.prompt();
});