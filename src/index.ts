import * as readline from 'readline';
import * as fs from 'fs';
import { Group } from './Group';
import { Rect } from './Rect';
import { Circle } from './Circle';
import { CommandManager } from './CommandManager';
import { AddCommand, MoveCommand, DeleteCommand, GroupCommand } from './Command';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'svg> ' });
let root = new Group('svg');
const cmdMgr = new CommandManager();

console.log("svg-editor 0.1 — type 'help' for commands");
rl.prompt();

rl.on('line', (line: string) => {
  const args = line.trim().split(/\s+/);
  const cmd = args[0];

  if (cmd === 'exit') process.exit(0);
  if (cmd === 'init') { root = new Group('svg'); console.log('canvas initialized'); }
  else if (cmd === 'help') {
    console.log("Available commands:\n  create <type> <id> ...\n  move <id> <dx> <dy>\n  delete <id>\n  group <newId> <id1> <id2> ...\n  undo / redo / tree / save / read / exit");
  }
  else if (cmd === 'create') {
    const type = args[1], id = args[2];
    if (root.find(id)) { console.log(`error: id already exists: ${id}`); rl.prompt(); return; }
    if (type === 'rect') {
      cmdMgr.execute(new AddCommand(root, new Rect(id, +args[3], +args[4], +args[5], +args[6], args[7])));
      console.log(`rect#${id} created`);
    } else if (type === 'circle') {
      cmdMgr.execute(new AddCommand(root, new Circle(id, +args[3], +args[4], +args[5], args[6])));
      console.log(`circle#${id} created`);
    } else if (type === 'g') {
      cmdMgr.execute(new AddCommand(root, new Group(id)));
      console.log(`g#${id} created`);
    }
  } 
  else if (cmd === 'move') {
    const shape = root.find(args[1]);
    if (shape) { cmdMgr.execute(new MoveCommand(shape, +args[2], +args[3])); console.log(`moved ${args[1]}`); }
    else console.log(`error: no such shape: ${args[1]}`);
  }
  else if (cmd === 'delete') {
    const shape = root.find(args[1]);
    if (shape) { cmdMgr.execute(new DeleteCommand(root, shape)); console.log(`deleted ${args[1]}`); }
    else console.log(`error: no such shape: ${args[1]}`);
  }
  else if (cmd === 'group') {
    const newId = args[1];
    const ids = args.slice(2);
    if (root.find(newId)) { console.log(`error: id already exists: ${newId}`); rl.prompt(); return; }
    cmdMgr.execute(new GroupCommand(root, ids, newId));
    console.log(`group ${newId} created`);
  }
  else if (cmd === 'undo') { cmdMgr.undo(); console.log('undo done'); }
  else if (cmd === 'redo') { cmdMgr.redo(); console.log('redo done'); }
  else if (cmd === 'tree') { console.log(root.toSVG()); }
  else if (cmd === 'save') {
    const filename = args[1] || 'output.svg';
    fs.writeFileSync(filename, `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">\n${root.toSVG()}\n</svg>`);
    console.log(`saved to ${filename}`);
  }
  else if (cmd === 'read') {
    try {
      const content = fs.readFileSync(args[1], 'utf-8');
      console.log(`read ${args[1]} successfully (Demo Only: complex parsing omitted)`);
      // 真实解析XML很耗时，为了演示，这里略过复杂的对象树重建逻辑
    } catch(e) { console.log(`error: cannot read file: ${args[1]}`); }
  }
  else if (cmd !== '') { console.log(`error: unknown command: ${cmd}`); }

  rl.prompt();
});