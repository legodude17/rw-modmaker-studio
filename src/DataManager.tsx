import { ipcRenderer } from 'electron';
import { promises as fs } from 'fs';
import * as React from 'react';
import settings from 'electron-settings';
import { List, Seq } from 'immutable';
import path from 'path';
import { DefInfo, ModInfo, TypeInfo } from './completionItem';
import { Mod } from './Project';
import { getModPaths } from './util';
import { parse, Node } from './parser/XMLParser';

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

let error = '';
const data: {
  types: TypeInfo[];
  defs: DefInfo[];
  mods: ModInfo[];
  parents: {
    [key: string]: string;
  };
} = {
  types: [],
  defs: [],
  mods: [],
  parents: {},
};
let cache: DataCache;

export function allDefsOfType(type: string) {
  return cache.defsByType[type]
    ? cache.defsByType[type]
    : (cache.defsByType[type] = data.defs.filter((def) => def.type === type));
}

export function typeByName(type: string) {
  return cache.typesByName[type]
    ? cache.typesByName[type]
    : (cache.typesByName[type] = data.types.find(
        (info) => info.typeIdentifier === type
      ));
}

export function allModNames() {
  return data.mods.map((mod) => mod.name);
}

export function modByName(name: string) {
  return cache.modsByName[name]
    ? cache.modsByName[name]
    : (cache.modsByName[name] = data.mods.find((mod) => mod.name === name));
}

export function allParents(type: TypeInfo) {
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

export function allChildren(type?: TypeInfo) {
  if (!type) return undefined;
  if (cache.children.has(type)) return cache.children.get(type);
  const children = data.types.filter((t) => allParents(t)?.includes(type));
  cache.children.set(type, children);
  return children;
}

export const DataContext = React.createContext(data);

export function User({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) {
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function fullType(
  type?: string,
  failedTypes?: Set<string>
): string | undefined {
  if (!type) return type;
  let full = type;
  let info = typeByName(type);
  if (info) {
    // console.log('Found info:', info);
    return full;
  }
  info = typeByName(`RimWorld.${type}`);
  if (info) full = `RimWorld.${type}`;
  info = typeByName(`Verse.${type}`);
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
  parentTypeName: string = keyPath.split('!').reverse()[0]
) {
  let type = '';
  if (node.tag?.content) {
    const parentType = typeByName(parentTypeName);
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

function usesFromDefs(text: string, uses: { [key: string]: Set<string> }) {
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

export const regenerate = async (
  mods: List<Mod>,
  currentFolder: string,
  extraTypes: string[] = []
) => {
  cache = defaultCache();
  let file = await ipcRenderer.invoke('regen-installed-mods', [
    await settings.get('rwlocalmods'),
    await settings.get('rwsteammods'),
  ]);
  try {
    data.mods = JSON.parse(await fs.readFile(file, 'utf-8')) as ModInfo[];
  } catch (e) {
    error = await fs.readFile(file, 'utf-8');
  }

  file = await ipcRenderer.invoke(
    'regen-field-info',
    [
      await settings.get('rwassem'),
      await settings.get('unityassem'),
      ...(
        await Promise.all(
          (
            await getModPaths(
              mods.map((mod) => mod.path).concat(currentFolder),
              'Assemblies'
            )
          )
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
    ],
    extraTypes
  );
  try {
    data.types = JSON.parse(await fs.readFile(file, 'utf-8')) as TypeInfo[];
  } catch (e) {
    error = await fs.readFile(file, 'utf-8');
  }

  let files: string[] = [];

  file = await ipcRenderer.invoke(
    'regen-def-database',
    [
      path.join((await settings.get('rwdata')) as string, 'Core', 'Defs'),
      path.join((await settings.get('rwdata')) as string, 'Royalty', 'Defs'),
      ...(await getModPaths(
        mods.map((mod) => mod.path), // Don't load defs from project folder, those change too frequently. The autocomplete system for Defs will include current project Defs
        'Defs'
      )),
    ].filter((a) => a)
  );
  try {
    const temp = JSON.parse(await fs.readFile(file, 'utf-8'));
    data.defs = temp.defs as DefInfo[];
    data.defs.forEach((def) => (def.type = fullType(def.type) ?? 'Verse.Def'));
    files = temp.files as string[];
  } catch (e) {
    error = await fs.readFile(file, 'utf-8');
  }

  const uses: { [key: string]: Set<string> } = {};

  (
    await Promise.all(files.map((f) => fs.readFile(f, 'utf-8')))
  ).forEach((text) => usesFromDefs(text, uses));

  Object.entries(uses).forEach(([keyPath, values]) => {
    const parents = Seq(values)
      .map((val) => typeByName(val))
      .filter((v) => v)
      .map((t) => allParents(t as TypeInfo))
      .filter((v) => v)
      .toArray() as TypeInfo[][];
    const parent = parents[0]?.find((v) =>
      parents.every((arr) => arr.includes(v))
    );
    if (!parent) return;
    data.parents[keyPath] = parent.typeIdentifier;
  });

  if (error) console.error('Found error', error);
};

window.Data = {
  allDefsOfType,
  allParents,
  allChildren,
  allModNames,
  modByName,
  typeByName,
  data,
};
