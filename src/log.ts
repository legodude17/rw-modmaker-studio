import path from 'path';
import { promises as fs } from 'fs';
import { app } from './electron';

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

export default {
  file: '',
  messages: [] as string[],
  lastWriteTime: Date.now(),
  async init() {
    this.file = path.join(
      app.getPath('temp'),
      `log-${Date.now()}-${app.processType}.txt`
    );
    console.log(`Logging to: ${this.file}`);
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await this.write();
  },
  debug(...args: any[]) {
    console.log(...args);
    this.messages.push(`${args.join(' ')}`);
    this.onMessage();
  },
  info(...args: any[]) {
    console.log(...args);
    this.messages.push(`${args.join(' ')}`);
    this.onMessage();
  },
  warn(...args: any[]) {
    console.warn(...args);
    this.messages.push(`${args.join(' ')}`);
    this.onMessage();
  },
  error(...args: any[]) {
    console.error(...args);
    this.messages.push(`${args.join(' ')}`);
    this.onMessage();
  },
  write() {
    return fs.writeFile(this.file, this.messages.join('\n'));
  },
  async onMessage() {
    if (!this.file) {
      await this.init();
    }
    if (this.messages.length > 1000) {
      console.warn('More than 1000 messages, deduping');
      this.messages = [...new Set(this.messages)];
    }
    if (this.lastWriteTime + 1000 < Date.now()) {
      await this.write();
      this.lastWriteTime = Date.now();
    }
  },
};
