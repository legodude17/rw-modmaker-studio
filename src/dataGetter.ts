import path from 'path';
import { promises as fs } from 'fs';
import execa from 'execa';
import { Seq } from 'immutable';
import { DefInfo, ModInfo, TypeInfo } from './completionItem';
import { DataManager } from './DataManagerType';
import { app, settings } from './electron';
import { parse } from './parser/XMLParser';
import { fullType } from './DataManager';
import { doTasks } from './WorkerManager';
import { allFilesRecusive, getModPaths } from './util';
import log from './log';

export async function getTypeInfo(assems: string[], extraTypes: string[]) {
  const extractor = (await settings.get('extractorpath')) as string;
  const output = path.join(app.getPath('temp'), 'fieldinfo.json');
  const logPath = path.join(
    app.getPath('temp'),
    `log-${extraTypes.length}.txt`
  );
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

export async function getDefInfo(
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

export async function getInstalledMods(modFolders: string[]) {
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

export async function getParents(
  files: string[],
  Data: DataManager,
  parents: {
    [key: string]: string;
  },
  failedTypes?: Set<string>
) {
  const uses: { [key: string]: Set<string> } = {};

  const results = await doTasks(
    (
      await Promise.all(files.map((f) => fs.readFile(f, 'utf-8')))
    ).map((text) => ({
      type: 'uses',
      data: Data.data,
      text,
      id: 0,
    }))
  );

  log.debug(`Found ${results.length} results`);

  results.forEach((result) => {
    Object.entries(result.uses).forEach(([key, val]) => {
      uses[key] = new Set([...(uses[key] ?? []), ...val]);
    });
    result.failedTypes.forEach((ft) => failedTypes?.add(ft));
  });

  log.debug('Found uses');

  await fs.writeFile(
    path.join(__dirname, 'uses.json'),
    JSON.stringify(
      Object.fromEntries(
        Object.entries(uses).map(([key, value]) => [key, [...value]])
      )
    )
  );

  Object.entries(uses).forEach(([keyPath, values]) => {
    const allParents = Seq(values)
      .map((val) => Data.typeByName(val))
      .filter((v) => v)
      .map((t) => [t].concat(Data.allParents(t as TypeInfo)))
      .filter((v) => v && v.every((t) => t))
      .toArray() as TypeInfo[][];
    const parent = allParents[0]?.find((v) =>
      allParents.every((arr) => arr.includes(v))
    );

    if (!parent) {
      log.warn(
        `Failed to find common parent for ${keyPath}:`,
        allParents,
        values
      );
      return;
    }

    log.debug(`Found common parent for ${keyPath} : ${parent}`);
    parents[keyPath] = parent.typeIdentifier;
  });

  Object.entries(parents).forEach(([key, type]) => {
    const typeInfo = Data.typeByName(type);
    log.debug(`Failing type ${type}`);
    if (!typeInfo) failedTypes?.add(type);
  });

  // console.log('Parents:', parents);

  return parents;
}

export const getAllAssemblies = async (
  mods: string[],
  currentFolder: string
) => [
  (await settings.get('rwassem')) as string,
  (await settings.get('unityassem')) as string,
  ...(
    await Promise.all(
      (await getModPaths(mods.concat(currentFolder), 'Assemblies'))
        .filter((a) => a)
        .map(async (folder) =>
          (await fs.readdir(folder))
            .map((assem) => path.resolve(folder, assem))
            .filter((assem) => path.extname(assem) === '.dll')
        )
    )
  )
    .reduce((a, b) => a.concat(b), [])
    .filter((a) => a),
];

export const getDefFolders = async (mods: string[]) =>
  [
    path.join((await settings.get('rwdata')) as string, 'Core', 'Defs'),
    path.join((await settings.get('rwdata')) as string, 'Royalty', 'Defs'),
    ...(await getModPaths(
      mods, // Don't load defs from project folder, those change too frequently. The autocomplete system for Defs will include current project Defs
      'Defs'
    )),
  ].filter((a) => a);

export const getModFolders = async () => [
  (await settings.get('rwlocalmods')) as string,
  (await settings.get('rwsteammods')) as string,
];

export const getDefFiles = async (defFolders: string[]) =>
  (await Promise.all(defFolders.map((f) => allFilesRecusive(f)))).flat();
