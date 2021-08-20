import {
  Map,
  List,
  RecordOf,
  Record,
  isIndexed,
  fromJS as originalFromJS,
} from 'immutable';

export type BaseProps = {
  REC_TYPE: string;
};

export type Project = RecordOf<ProjectProps>;
export type ProjectProps = {
  manifest: ModManifest;
  defs: List<Def>;
  folder: string;
  loaded: boolean;
  current: string;
} & BaseProps;

export type Field = RecordOf<FieldProps>;

export type FieldProps = {
  key: string;
  value: List<Field> | string;
  type: string;
  attrs?: Map<string, string | undefined>;
  id: number;
} & BaseProps;

export const makeField = Record<FieldProps>({
  key: 'defName',
  value: 'UnnamedDef',
  type: 'System.String',
  attrs: Map(),
  REC_TYPE: 'Field',
  id: -1,
});

export type Def = RecordOf<DefProps>;

export type DefProps = {
  fields: List<Field>;
  defName: string;
  name?: string;
  parent?: string;
  abstract: boolean;
  type: string;
  file: string;
} & BaseProps;

export const makeDef = Record<DefProps>({
  fields: List(),
  defName: 'UnnamedDef',
  name: undefined,
  parent: undefined,
  abstract: false,
  type: 'Verse.ThingDef',
  REC_TYPE: 'Def',
  file: 'Defs/Defs.xml',
});

export type ModProps = {
  url: string;
  workshop: string;
  id: string;
  name: string;
  path: string;
} & BaseProps;

export type Mod = RecordOf<ModProps>;

export const makeMod = Record<ModProps>({
  url: '',
  workshop: '',
  id: 'author.mod',
  name: 'Mod',
  path: 'INVALID',
  REC_TYPE: 'Mod',
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
} & BaseProps;

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
  REC_TYPE: 'Manifest',
});

export const makeProject = Record<ProjectProps>({
  manifest: makeManifest(),
  defs: List(),
  folder: '',
  loaded: false,
  REC_TYPE: 'Project',
  current: '.manifest',
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

const knownRecordTypes: { [key: string]: Record.Factory<any> } = {
  Def: makeDef,
  Field: makeField,
  Project: makeProject,
  Manifest: makeManifest,
  Mod: makeMod,
};

export function fromJS(jsValue: any) {
  return originalFromJS(jsValue, (_key, value) => {
    if (isIndexed(value)) return value.toList();
    const maker = knownRecordTypes[value.get('REC_TYPE')];
    if (maker) return maker(value);
    return value.toMap();
  });
}
