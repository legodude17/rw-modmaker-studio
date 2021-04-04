/* eslint-disable promise/no-nesting */
import { promises as fs, constants } from 'fs';
import { List } from 'immutable';
import path from 'path';
import { Def } from './Project';

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
  mods: List<string>,
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
  return def.defName !== 'UnnamedDef' ? def.defName : def.name ?? 'UnnamedDef';
}

export function getId(def: Def): string {
  return `${def.type}/${getName(def)}`;
}
