import { DefInfo, TypeInfo, ModInfo } from './completionItem';

export type DataManager = {
  allDefsOfType: (type: string) => DefInfo[];
  typeByName: (type: string) => TypeInfo | undefined;
  allModNames: () => string[];
  modByName: (name: string) => ModInfo | undefined;
  allParents: (type: TypeInfo) => TypeInfo[] | undefined;
  allChildren: (type: TypeInfo) => TypeInfo[] | undefined;
  data: AllData;
  failedTypes?: Set<string>;
};

export type AllData = {
  types: TypeInfo[];
  defs: DefInfo[];
  mods: ModInfo[];
  parents: {
    [key: string]: string;
  };
};
