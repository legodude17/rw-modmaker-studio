import { app as electronApp, remote } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';

export const app = {
  getPath(
    name:
      | 'home'
      | 'appData'
      | 'userData'
      | 'cache'
      | 'temp'
      | 'exe'
      | 'module'
      | 'desktop'
      | 'documents'
      | 'downloads'
      | 'music'
      | 'pictures'
      | 'videos'
      | 'recent'
      | 'logs'
      | 'pepperFlashSystemPlugin'
      | 'crashDumps'
  ) {
    if (this.isRenderer()) return remote.app.getPath(name);
    return electronApp.getPath(name);
  },
  isRenderer: () => process && process.type === 'renderer',
  processType: process?.type,
};

export const settings = {
  path: '',
  async get(key: string) {
    if (!this.path) await this.init({});
    return JSON.parse(await fs.readFile(settings.path, 'utf-8'))[key] as string;
  },
  async set(key: string, value: string) {
    if (!this.path) await this.init({});
    const obj = JSON.parse(await fs.readFile(settings.path, 'utf-8'));
    obj[key] = value;
    await fs.writeFile(settings.path, JSON.stringify(obj));
  },
  async init(defaultSettings: { [key: string]: string }) {
    this.path = path.join(app.getPath('userData'), 'settings.json');
    try {
      await fs.access(settings.path);
      const obj = {
        ...defaultSettings,
        ...JSON.parse(await fs.readFile(settings.path, 'utf-8')),
      };
      await fs.writeFile(settings.path, JSON.stringify(obj));
    } catch (e) {
      await fs.writeFile(settings.path, JSON.stringify(defaultSettings));
    }
  },
};
