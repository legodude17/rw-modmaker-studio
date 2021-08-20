import { DefInfo, ModInfo, TypeInfo } from './completionItem';
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
  namespaces: string[];
};

function defaultCache(): DataCache {
  return {
    defsByType: {},
    typesByName: {},
    modsByName: {},
    parents: new Map(),
    children: new Map(),
    namespaces: [],
  };
}

export function createManager(
  data: AllData,
  failedTypes?: Set<string>
): DataManager {
  let cache = defaultCache();
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

  function allParents(type?: TypeInfo) {
    if (!type) return undefined;
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

  function clearCache() {
    cache = defaultCache();
  }

  function getNamespaces() {
    if (cache.namespaces.length) return cache.namespaces;
    const set: Set<string> = new Set();
    data.types.forEach((type) =>
      set.add(type.typeIdentifier.split('.').slice(0, -1).join('.'))
    );
    cache.namespaces = [...set];
    return cache.namespaces;
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
    clearCache,
    getNamespaces,
  };
}

export function fullType(
  type?: string,
  failedTypes?: Set<string>,
  Data?: DataManager
): string | undefined {
  if (!type) console.warn('Given undefined to fullType');
  if (!Data) console.warn('Not given Data to fullType with type', type);
  // if (!failedTypes) console.warn('Did not pass failedTypes to fullType');
  if (!type || !Data) return type;
  let info = Data.typeByName(type);
  if (info) return type;
  let full = '';
  Data.getNamespaces().forEach((namespace) => {
    info = Data.typeByName(`${namespace}.${type}`);
    if (info) full = `${namespace}.${type}`;
  });
  if (!full && failedTypes) failedTypes.add(type);
  if (!full && (!failedTypes || !failedTypes.has(type))) {
    // console.log(`Failed to find info for ${type}`, !!failedTypes);
  }
  return full || type;
}

function usesFromField(
  node: Node,
  keyPath: string,
  uses: {
    [key: string]: Set<string>;
  },
  parentTypeName: string = keyPath.split('!').reverse()[0],
  Data: DataManager,
  failedTypes?: Set<string>
) {
  if (!Data) return;
  // if (!failedTypes) console.warn('Did not pass failedTypes to usesFromField');
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
    const value = fullType(node.text.content, failedTypes, Data);
    if (key && value) {
      // console.log(`Adding ${value} to uses at ${key}`);
      if (uses[key]) uses[key].add(value);
      else uses[key] = new Set([value]);
    }
  }

  if (node.children.length) {
    node.children.forEach((child) =>
      usesFromField(child, key, uses, type, Data, failedTypes)
    );
  }
}

export function usesFromDefs(
  text: string,
  uses: { [key: string]: Set<string> },
  Data: DataManager,
  failedTypes?: Set<string>
) {
  const doc = parse(text);

  doc.children[0].children.forEach((node) =>
    node.children.map((n) =>
      usesFromField(
        n,
        fullType(node.tag?.content ?? 'Def', failedTypes, Data) ?? 'Verse.Def',
        uses,
        fullType(node.tag?.content ?? 'Def', failedTypes, Data) ?? 'Verse.Def',
        Data,
        failedTypes
      )
    )
  );
}
