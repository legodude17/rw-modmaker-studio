/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import settings from 'electron-settings';
import execa from 'execa';
import { promises as fs } from 'fs';
import { List, Seq } from 'immutable';
import { defaultPrefs } from './prefs';
import MenuBuilder from './menu';
import { DefInfo, ModInfo, TypeInfo } from './completionItem';
import { parse } from './parser/XMLParser';
import { readProject } from './fileLoadSaver';
import {
  createManager,
  fullType,
  getAllAssemblies,
  getDefFiles,
  getDefFolders,
  getModFolders,
  usesFromDefs,
} from './DataManager';
import { AllData, DataManager } from './DataManagerType';
import { Mod, Project } from './Project';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .then(() => console.log('Installed Extensions!'))
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(createWindow)
  .then(() => settings.get())
  .then((object) => {
    if (
      Object.keys(object).filter((key) => object[key]).length !==
      Object.keys(defaultPrefs).length
    ) {
      settings.set({ ...object, ...defaultPrefs });
    }
    return object;
  })
  //  .then((obj) => {
  //    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //      callback({
  //        responseHeaders: {
  //          ...details.responseHeaders,
  //          'Content-Security-Policy': ["script-src 'self' 'unsafe-eval' 'unsafe-inline'"],
  //        },
  //      });
  //    });
  //   return obj;
  // })
  .catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

async function getTypeInfo(assems: string[], extraTypes: string[]) {
  const extractor = (await settings.get('extractorpath')) as string;
  const output = path.join(app.getPath('temp'), 'fieldinfo.json');
  const logPath = path.join(app.getPath('temp'), 'log.txt');
  try {
    await execa(
      extractor,
      assems.concat([
        '--OutputMode',
        'file',
        '-o',
        output,
        '--log',
        logPath,
        '-v',
        '--extraTypes',
        extraTypes.join(' '),
      ])
    );
  } catch (e) {
    if (e.exitCode === 1) {
      throw new Error(
        (await fs.readFile(logPath, 'utf-8'))
          .split('\n')
          .find((s) => s.includes('ERROR'))
      );
    }
  }
  return JSON.parse(await fs.readFile(output, 'utf-8')) as TypeInfo[];
}

async function getDefInfo(
  defFiles: string[],
  Data?: DataManager,
  failedTypes?: Set<string>
) {
  const defs: DefInfo[] = [];
  await Promise.all(
    defFiles.map(async (file: string) => {
      const text = await fs.readFile(file, 'utf-8');
      const doc = parse(text);
      const defsNode = doc.children[0];
      defsNode.children.forEach((node) => {
        defs.push({
          type: fullType(node.tag?.content, failedTypes, Data) ?? 'Verse.Def',
          name: node.attributes?.Name,
          defName:
            node.children.find((val) => val.tag?.content === 'defName')?.text
              ?.content ?? 'UnnamedDef',
          parent: node.attributes?.ParentName,
          abstract: node.attributes?.Abstract === 'True',
        });
      });
    })
  );
  return defs;
}

async function getInstalledMods(modFolders: string[]) {
  const mods: ModInfo[] = [];
  const folders = (
    await Promise.all(
      modFolders.map(async (folder) =>
        (await fs.readdir(folder)).map((sub) => path.resolve(folder, sub))
      )
    )
  ).reduce((a, b) => a.concat(b), []);
  await Promise.all(
    folders.map(async (modPath) => {
      try {
        const text = await fs.readFile(
          path.join(modPath, 'About', 'About.xml'),
          'utf-8'
        );
        const doc = parse(text);
        const metaNode = doc.children[0];
        const mod: Partial<ModInfo> = { path: modPath };
        metaNode.children.forEach((node) => {
          switch (node.tag?.content) {
            case 'name':
              mod.name = node.text?.content;
              break;
            case 'author':
              mod.author = node.text?.content;
              break;
            case 'url':
              mod.url = node.text?.content;
              break;
            case 'description':
              mod.desc = node.text?.content;
              break;
            case 'packageId':
              mod.id = node.text?.content;
              break;
            default:
          }
        });
        try {
          mod.wshopId = await fs.readFile(
            path.join(modPath, 'About', 'PublishedFileId.txt'),
            'utf-8'
          );
        } catch (e) {
          if (e.code !== 'ENOENT') throw e;
          mod.wshopId = undefined;
        }
        mods.push(mod as ModInfo);
      } catch (e) {
        if (e.code === 'ENOENT') return;
        throw e;
      }
    })
  );
  return mods;
}

async function getParents(files: string[], Data: DataManager) {
  const uses: { [key: string]: Set<string> } = {};
  const parents: { [key: string]: string } = {};

  (
    await Promise.all(files.map((f) => fs.readFile(f, 'utf-8')))
  ).forEach((text) => usesFromDefs(text, uses));

  Object.entries(uses).forEach(([keyPath, values]) => {
    const allParents = Seq(values)
      .map((val) => Data.typeByName(val))
      .filter((v) => v)
      .map((t) => Data.allParents(t as TypeInfo))
      .filter((v) => v)
      .toArray() as TypeInfo[][];
    const parent = allParents[0]?.find((v) =>
      allParents.every((arr) => arr.includes(v))
    );
    if (!parent) return;
    parents[keyPath] = parent.typeIdentifier;
  });
  return parents;
}

ipcMain.handle('read-project', (_event, folder: string) =>
  readProject(folder, {
    typeInfo: getTypeInfo,
    defInfo: getDefInfo,
    modInfo: getInstalledMods,
  }).then((proj) => proj.toJS())
);

ipcMain.handle(
  'refresh-data',
  async (_event, project: Project): Promise<DataManager> => {
    const data: AllData = {
      types: [],
      defs: [],
      mods: await getInstalledMods(await getModFolders()),
      parents: {},
    };
    const Data = createManager(data);

    const defFiles = await getDefFiles(
      await getDefFolders(
        project.manifest.deps.map((mod) => mod.path).toArray()
      )
    );

    const failedTypes: Set<string> = new Set();
    let lastLength = failedTypes.size;
    do {
      /* eslint-disable no-await-in-loop */
      lastLength = failedTypes.size;
      data.types = await getTypeInfo(
        await getAllAssemblies(
          project.manifest.deps.map((mod) => mod.path).toArray(),
          project.folder
        ),
        [...failedTypes]
      );
      data.defs = await getDefInfo(defFiles, Data, failedTypes);
      /* eslint-enable */
    } while (failedTypes.size !== lastLength);
    data.parents = await getParents(defFiles, Data);

    return Data;
  }
);
