import * as readline from 'readline';
import * as fs from 'fs';
import { Group } from './Group';
import { BaseShape, Shape } from './Shape';
import { CommandManager } from './CommandManager';
import { AddCommand, DeleteCommand, MoveCommand, ScaleCommand, SetCommand, GroupCommand, UngroupCommand, ZOrderCommand, AddToCommand } from './Command';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'svg> ' });
let root = new Group('svg');
let canvasSize = { w: 800, h: 600 };
const cmdMgr = new CommandManager();

console.log("svg-editor 0.1 — type 'help' for commands");
rl.prompt();

function checkAndFixId(id: string, existing: string[]): string {
  if (!existing.includes(id)) return id;
  let i = 1;
  while (existing.includes(`${id}${i}`)) i++;
  console.log(`warning: assigned id ${id}${i} to unnamed <${id}>`);
  return `${id}${i}`;
}

rl.on('line', (line: string) => {
  const args: string[] = (line.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || []) as string[];
  const cmd = args[0]?.replace(/"/g, '');
  if (!cmd) { rl.prompt(); return; }

  try {
    if (cmd === 'exit') process.exit(0);
    else if (cmd === 'help') {
      console.log("Commands: init, read, save, canvas, create, delete, move, scale, set, group, ungroup, addto, front, back, tree, show, undo, redo, help, exit");
    }
    else if (cmd === 'init') {
      root = new Group('svg');
      canvasSize = { w: parseInt(args[1]) || 800, h: parseInt(args[2]) || 600 };
      cmdMgr.lock();
      console.log(`canvas ${canvasSize.w}x${canvasSize.h} created`);
    }
    else if (cmd === 'canvas') {
      if (args.length === 1) console.log(`canvas ${canvasSize.w}x${canvasSize.h}`);
      else { canvasSize = { w: parseInt(args[1]), h: parseInt(args[2]) }; cmdMgr.lock(); console.log(`canvas changed to ${canvasSize.w}x${canvasSize.h}`); }
    }
    else if (cmd === 'create') {
      const type = args[1], rawId = args[2];
      if (!['rect', 'circle', 'ellipse', 'line', 'text', 'g'].includes(type)) { console.log(`error: unknown shape type: ${type}`); rl.prompt(); return; }
      let id = rawId;
      if (root.find(id)) { console.log(`error: id already exists: ${id}`); rl.prompt(); return; }

      const inIdx = args.indexOf('in');
      const parentId = inIdx !== -1 ? args[inIdx + 1] : 'svg';
      const parent = root.find(parentId) as Group;
      if (!parent || parent.getType() !== 'g') { console.log(`error: no such container: ${parentId}`); rl.prompt(); return; }

      const attrs: any = {};
      if (type === 'rect') { attrs.x = +args[3]; attrs.y = +args[4]; attrs.width = +args[5]; attrs.height = +args[6]; if(args[7]) attrs.fill = args[7]; }
      else if (type === 'circle') { attrs.cx = +args[3]; attrs.cy = +args[4]; attrs.r = +args[5]; if(args[6]) attrs.fill = args[6]; }
      else if (type === 'ellipse') { attrs.cx = +args[3]; attrs.cy = +args[4]; attrs.rx = +args[5]; attrs.ry = +args[6]; if(args[7]) attrs.fill = args[7]; }
      else if (type === 'line') { attrs.x1 = +args[3]; attrs.y1 = +args[4]; attrs.x2 = +args[5]; attrs.y2 = +args[6]; if(args[7]) attrs.stroke = args[7]; }
      else if (type === 'text') { attrs.x = +args[3]; attrs.y = +args[4]; attrs.text = args[5].replace(/"/g, ''); }
      
      const shape = type === 'g' ? new Group(id) : new BaseShape(id, type, attrs);
      cmdMgr.execute(new AddCommand(parent, shape));
      console.log(`${type}#${id} created${inIdx !== -1 ? ' in ' + parentId : ''}`);
    }
    else if (cmd === 'delete') {
      const shape = root.find(args[1]);
      if (shape) { cmdMgr.execute(new DeleteCommand(root, shape)); console.log(`${args[1]} deleted`); }
      else console.log(`error: no such shape: ${args[1]}`);
    }
    else if (cmd === 'move') {
      const shape = root.find(args[1]);
      if (shape) { cmdMgr.execute(new MoveCommand(shape, +args[2], +args[3])); console.log(`${args[1]} moved`); }
      else console.log(`error: no such shape: ${args[1]}`);
    }
    else if (cmd === 'scale') {
      const shape = root.find(args[1]);
      if (!shape) console.log(`error: no such shape: ${args[1]}`);
      else if (+args[2] <= 0) console.log(`error: scale factor must be positive`);
      else { cmdMgr.execute(new ScaleCommand(shape, +args[2])); console.log(`${args[1]} scaled by ${args[2]}`); }
    }
    else if (cmd === 'set') {
      const shape = root.find(args[1]);
      if (shape) {
        const success = shape.set(args[2], args[3].replace(/"/g, ''));
        if (success) { cmdMgr.execute(new SetCommand(shape, args[2], args[3].replace(/"/g, ''))); console.log(`${args[1]} updated: ${args[2]}=${args[3]}`); }
        else console.log(`error: unknown attribute: ${args[2]}`);
      } else console.log(`error: no such shape: ${args[1]}`);
    }
    else if (cmd === 'group') {
      const newId = args[1], ids = args.slice(2);
      if (root.find(newId)) console.log(`error: id already exists: ${newId}`);
      else {
        cmdMgr.execute(new GroupCommand(root, ids, newId));
        console.log(`g#${newId} created with ${ids.length} children`);
      }
    }
    else if (cmd === 'ungroup') {
      const g = root.find(args[1]);
      if (!g || g.getType() !== 'g') console.log(`error: no such container: ${args[1]}`);
      else { cmdMgr.execute(new UngroupCommand(root, args[1])); console.log(`g#${args[1]} ungrouped`); }
    }
    else if (cmd === 'addto') {
      const g = root.find(args[1]), shape = root.find(args[2]);
      if (!g || g.getType() !== 'g') console.log(`error: no such container: ${args[1]}`);
      else if (!shape) console.log(`error: no such shape: ${args[2]}`);
      else { cmdMgr.execute(new AddToCommand(root, args[1], args[2])); console.log(`${args[2]} moved into g#${args[1]}`); }
    }
    else if (cmd === 'front' || cmd === 'back') {
      const shape = root.find(args[1]);
      if (shape) { cmdMgr.execute(new ZOrderCommand(root, args[1], cmd === 'front')); console.log(`${args[1]} sent to ${cmd}`); }
      else console.log(`error: no such shape: ${args[1]}`);
    }
    else if (cmd === 'undo') { console.log(cmdMgr.undo() ? 'undo done' : 'error: undo not allowed after io command'); }
    else if (cmd === 'redo') { console.log(cmdMgr.redo() ? 'redo done' : 'error: undo not allowed after io command'); }
    else if (cmd === 'tree') { console.log(root.toSVG()); }
    else if (cmd === 'show') {
      const shape = root.find(args[1]);
      if (shape) { console.log(shape.toSVG()); }
      else console.log(`error: no such shape: ${args[1]}`);
    }
    else if (cmd === 'save') {
      const filename = args[1] || 'output.svg';
      const content = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize.w}" height="${canvasSize.h}" viewBox="0 0 ${canvasSize.w} ${canvasSize.h}">\n${root.toSVG()}\n</svg>`;
      fs.writeFileSync(filename, content);
      cmdMgr.lock();
      console.log(`saved to ${filename}`);
    }
    else if (cmd === 'read') {
      if (!fs.existsSync(args[1])) { console.log(`error: cannot read file: ${args[1]}`); }
      else {
        const content = fs.readFileSync(args[1], 'utf-8');
        // 简易解析 SVG
        root = new Group('svg');
        const tagRegex = /<(rect|circle|ellipse|line|text|g)(?:\s+([^>]+))?>(?:([^<]*)<\/text>)?/g;
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
          const tag = match[1], attrStr = match[2] || '', text = match[3];
          const attrs: any = {};
          const attrRegex = /(\w[\w-]*)=["']([^"']*)["']/g;
          let attrMatch;
          while ((attrMatch = attrRegex.exec(attrStr)) !== null) attrs[attrMatch[1]] = attrMatch[2];
          
          let id = attrs.id;
          if (!id) {
            const allIds = Array.from(content.matchAll(/id=["']([^"']+)["']/g)).map(m => m[1]);
            id = checkAndFixId(tag, allIds);
          }
          delete attrs.id;
          if (tag === 'text') attrs.text = text || '';
          root.add(tag === 'g' ? new Group(id) : new BaseShape(id, tag, attrs));
        }
        cmdMgr.lock();
        console.log(`read ${args[1]} successfully`);
      }
    }
    else { console.log(`error: unknown command: ${cmd}`); }
  } catch (err: any) { console.log(`error: ${err.message}`); }
  rl.prompt();
});