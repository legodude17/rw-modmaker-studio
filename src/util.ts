/* eslint-disable promise/no-nesting */
import { promises as fs, constants } from 'fs';
import { List, RecordOf } from 'immutable';
import path from 'path';
import { createContext } from 'react';
import { TypeInfo } from './completionItem';
import { DataManager } from './DataManagerType';
import { Def, NewValue, Project, ProjectAction } from './Project';
import log from './log';

export const allFilesRecusive = (folder: string): Promise<string[]> =>
  fs
    .readdir(folder, { withFileTypes: true })
    .then((files) =>
      files.reduce(
        (p, file) =>
          p.then(async (arr) =>
            arr.concat(
              await (file.isDirectory()
                ? allFilesRecusive(`${folder}/${file.name}`)
                : `${folder}/${file.name}`)
            )
          ),
        (async (): Promise<string[]> => [])()
      )
    );

export function getModPaths(
  mods: string[],
  subPath: string
): Promise<string[]> {
  return Promise.all(
    mods.map(async (mod) => {
      if (!mod) return [''];
      const modPath = [''];
      try {
        await fs.access(path.join(mod, subPath), constants.R_OK);
        modPath.push(path.join(mod, subPath));
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
      try {
        await fs.access(path.join(mod, '1.2', subPath), constants.R_OK);
        modPath.push(path.join(mod, '1.2', subPath));
        return modPath;
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }

      try {
        await fs.access(path.join(mod, '1.1', subPath), constants.R_OK);
        modPath.push(path.join(mod, '1.1', subPath));
        return modPath;
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
      return modPath;
    })
  ).then((paths) => paths.reduce((a, b) => a.concat(b), []));
}

export function getName(def: Def): string {
  return def.defName && def.defName !== 'UnnamedDef'
    ? def.defName
    : def.name ?? 'UnnamedDef';
}

export function getId(def: Def): string {
  return `${def.type}/${getName(def)}`;
}

export enum SidebarTab {
  Code,
  Search,
}

export const DispatchContext = createContext<React.Dispatch<ProjectAction>>(
  (action: ProjectAction) => action.newValue as Project
);

export const DataContext = createContext<DataManager | undefined>(undefined);

export const isSingleInput = (typeInfo: TypeInfo) =>
  typeInfo?.specialType?.string ||
  typeInfo?.specialType?.float ||
  typeInfo?.specialType?.integer ||
  (typeInfo?.specialType?.customFormats &&
    typeInfo.specialType?.customFormats.length) ||
  typeInfo?.specialType?.enum ||
  typeInfo?.specialType?.bool ||
  typeInfo?.typeIdentifier === 'System.Type' ||
  typeInfo?.specialType?.defName ||
  typeInfo?.typeIdentifier === 'Verse.Rot4';

export function projectReducer<T extends NewValue & RecordOf<any>>(
  prevState: T,
  action: ProjectAction
): T {
  log.debug('Dispatched:', action.path, action.type);
  /* eslint-disable no-console */
  console.groupCollapsed('Values:');
  action.path.forEach((_val, i, arr) => {
    console.log(arr.slice(0, i), prevState.getIn(arr.slice(0, i)));
  });
  console.log('New:', action.newValue);
  console.groupEnd();
  /* eslint-enable no-console */
  switch (action.type) {
    case 'set':
      return prevState.setIn(action.path, action.newValue);
    case 'switch':
      return action.newValue as T;
    case 'add':
      return prevState.setIn(
        action.path,
        (prevState.getIn(action.path) as List<NewValue>).push(action.newValue)
      );
    case 'remove': {
      const val = prevState.getIn(action.path);
      if (List.isList(val)) {
        const list = val as List<NewValue>;
        return prevState.setIn(
          action.path,
          list.remove(list.indexOf(action.newValue))
        );
      }
      return prevState.removeIn(action.path);
    }
    default:
      return prevState;
  }
}

export const DefsContext = createContext<{ defs: Def[]; folder: string }>({
  defs: [] as Def[],
  folder: '',
});
