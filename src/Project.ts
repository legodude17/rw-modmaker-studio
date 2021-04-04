import { Map, List, RecordOf, Record } from 'immutable';

export type Project = RecordOf<ProjectProps>;
export type ProjectProps = {
  manifest: ModManifest;
  defs: List<Def>;
  folder: string;
};

export type Field = RecordOf<FieldProps>;

export type FieldProps = {
  key: string;
  value: List<Field> | string;
  type: string;
  attrs?: {
    [key: string]: string | null;
  };
};

export const makeField = Record<FieldProps>({
  key: 'defName',
  value: 'UnnamedDef',
  type: 'System.String',
  attrs: {},
});

export type Def = RecordOf<DefProps>;

export type DefProps = {
  fields: List<Field>;
  defName: string;
  name?: string;
  parent?: string;
  abstract: boolean;
  type: string;
};

export const makeDef = Record<DefProps>({
  fields: List(),
  defName: 'UnnamedDef',
  name: undefined,
  parent: undefined,
  abstract: false,
  type: 'Verse.ThingDef',
});

export type ModProps = {
  url: string;
  workshop: string;
  id: string;
  name: string;
  path: string;
};

export type Mod = RecordOf<ModProps>;

export const makeMod = Record<ModProps>({
  url: '',
  workshop: '',
  id: 'author.mod',
  name: 'Mod',
  path: 'INVALID',
});

export type ModManifest = RecordOf<ModManifestProps>;

export type ModManifestProps = {
  name: string;
  deps: List<Mod>;
  id: string;
  author: string;
  desc: string;
  url: string;
  versions: List<string>;
  incompat: List<string>;
  loadRules: Map<string, LoadType>;
};

export const makeManifest = Record<ModManifestProps>({
  name: 'Mod',
  deps: List(),
  id: 'person.mod',
  author: 'Person',
  desc: '',
  url: '',
  versions: List(['1.2']),
  incompat: List(),
  loadRules: Map(),
});

export const makeProject = Record<ProjectProps>({
  manifest: makeManifest(),
  defs: List(),
  folder: '',
});

export enum LoadType {
  Before,
  After,
}

export type NewValue =
  | Project
  | ModManifest
  | Def
  | Field
  | Mod
  | number
  | string;

export interface ProjectAction {
  type: 'set' | 'switch' | 'add' | 'remove';
  path: string[];
  newValue: NewValue;
}
