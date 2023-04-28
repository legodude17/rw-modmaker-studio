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
import log from './log';
import { settings } from './electron';
import { defaultPrefs } from './prefs';
import MenuBuilder from './menu';
import { readProject, writeProject } from './fileLoadSaver';
import { createManager } from './DataManager';
import { AllData, DataManager } from './DataManagerType';
import { fromJS, Project } from './Project';
import {
  getAllAssemblies,
  getDefFiles,
  getDefFolders,
  getDefInfo,
  getInstalledMods,
  getModFolders,
  getTypeInfo,
} from './dataGetter';

export default class AppUpdater {
  constructor() {
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
  .then(() => log.init())
  .then(() => settings.init(defaultPrefs))
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

ipcMain.handle('read-project', (_event, folder: string) =>
  readProject(folder).then((proj) => proj.toJS())
);

ipcMain.handle(
  'refresh-data',
  async (_event, project: Project): Promise<DataManager> => {
    const data: AllData = {
      types: [],
      defs: [],
      mods: await getInstalledMods(await getModFolders()),
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

    return Data;
  }
);

ipcMain.handle('save', (_event, project) => writeProject(fromJS(project)));

// readProject(
//   'C:\\Program Files (x86)\\Steam\\steamapps\\common\\RimWorld\\Mods\\AntimatterAnnihilation'
// )
//   .then(writeProject)
//   .then(console.log)
//   .then(() => process.exit(0))
//   .catch(console.error);
