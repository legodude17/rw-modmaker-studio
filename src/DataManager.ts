import { promises as fs } from 'fs';
import settings from 'electron-settings';
import path from 'path';
import { DefInfo, ModInfo, TypeInfo } from './completionItem';
import { allFilesRecusive, getModPaths } from './util';
import { parse, Node } from './parser/XMLParser';
import { AllData, DataManager } from './DataManagerType';

type DataCache = {
  defsByType: {
    [key: string]: DefInfo[];
  };
  typesByName: {
    [key: string]: TypeInfo | undefined;
  };
  modsByName: {
    [key: string]: ModInfo | undefined;
  };
  parents: Map<TypeInfo, TypeInfo[] | undefined>;
  children: Map<TypeInfo, TypeInfo[]>;
};

function defaultCache(): DataCache {
  return {
    defsByType: {},
    typesByName: {},
    modsByName: {},
    parents: new Map(),
    children: new Map(),
  };
}

export function createManager(
  data: AllData,
  failedTypes?: Set<string>
): DataManager {
  const cache = defaultCache();
  function allDefsOfType(type: string) {
    return cache.defsByType[type]
      ? cache.defsByType[type]
      : (cache.defsByType[type] = data.defs.filter((def) => def.type === type));
  }

  function typeByName(type: string) {
    return cache.typesByName[type]
      ? cache.typesByName[type]
      : (cache.typesByName[type] = data.types.find(
          (info) => info.typeIdentifier === type
        ));
  }

  function allModNames() {
    return data.mods.map((mod) => mod.name);
  }

  function modByName(name: string) {
    return cache.modsByName[name]
      ? cache.modsByName[name]
      : (cache.modsByName[name] = data.mods.find((mod) => mod.name === name));
  }

  function allParents(type: TypeInfo) {
    if (cache.parents.has(type)) return cache.parents.get(type);
    const parents: TypeInfo[] = [];
    let parent = typeByName(type.specialType?.parent);
    while (parent) {
      parents.push(parent);
      parent = typeByName(parent.specialType?.parent);
    }
    cache.parents.set(type, parents);
    return parents;
  }

  function allChildren(type?: TypeInfo) {
    if (!type) return undefined;
    if (cache.children.has(type)) return cache.children.get(type);
    const children = data.types.filter((t) => allParents(t)?.includes(type));
    cache.children.set(type, children);
    return children;
  }

  return {
    allDefsOfType,
    typeByName,
    allModNames,
    modByName,
    allParents,
    allChildren,
    data,
    failedTypes,
  };
}

export function fullType(
  type?: string,
  failedTypes?: Set<string>,
  Data?: DataManager
): string | undefined {
  if (!type || !Data) return type;
  let full = type;
  let info = Data.typeByName(type);
  if (info) {
    // console.log('Found info:', info);
    return full;
  }
  info = Data.typeByName(`RimWorld.${type}`);
  if (info) full = `RimWorld.${type}`;
  info = Data.typeByName(`Verse.${type}`);
  if (info) full = `Verse.${type}`;
  // console.log('fullType', type, '->', full);
  if (!info && failedTypes) failedTypes.add(type);
  return full;
}

function usesFromField(
  node: Node,
  keyPath: string,
  uses: {
    [key: string]: Set<string>;
  },
  parentTypeName: string = keyPath.split('!').reverse()[0],
  Data?: DataManager
) {
  if (!Data) return;
  let type = '';
  if (node.tag?.content) {
    const parentType = Data.typeByName(parentTypeName);
    if (parentType) {
      if (parentType.specialType?.enumerable?.genericType) {
        type = parentType.specialType.enumerable.genericType;
      } else {
        const children = parentType.childNodes;
        if (children) {
          const temp = children[node.tag.content];
          if (temp) type = temp;
        }
      }
    }
  }
  const key = `${keyPath}!${node.tag?.content}`;
  if (
    node.children.length === 0 &&
    node.text?.content &&
    type === 'System.Type'
  ) {
    const value = fullType(node.text.content);
    if (key && value) {
      if (uses[key]) uses[key].add(value);
      else uses[key] = new Set([value]);
    }
  }

  if (node.children.length) {
    node.children.forEach((child) => usesFromField(child, key, uses, type));
  }
}

export function usesFromDefs(
  text: string,
  uses: { [key: string]: Set<string> }
) {
  const doc = parse(text);

  doc.children[0].children.forEach((node) =>
    node.children.map((n) =>
      usesFromField(
        n,
        fullType(node.tag?.content ?? 'Def') ?? 'Verse.Def',
        uses
      )
    )
  );
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
