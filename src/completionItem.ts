export interface TypeInfo {
  childCollected: boolean;
  childDescriptions: {
    [key: string]: string;
  };
  populated: boolean;

  specialType: SpecialType;
  typeIdentifier: string;

  isLeafNode: boolean;
  isDefNode: boolean;
  leafNodeCompletions: CompletionItem[];

  childNodes: {
    [key: string]: string;
  };

  docs: Documentation;
}

export type Documentation = {
  description: string;
  usage: string;
  example: string;
  typeParent: string;
};

export interface DefInfo {
  defName: string;
  name: string | null | undefined;
  parent: string | null | undefined;
  abstract: boolean;
  type: string;
}

export interface SpecialType {
  defName: string;
  isAbstract: boolean;
  enumerable: Enumerable;
  genericArgs: string[];
  customFormats: string[];
  hasCustomReader: boolean;
  hyperlink: boolean;

  customXml: CustomXml;
  comp: boolean;
  parent: string;

  integer: boolean;
  color: boolean;
  intVec: boolean;
  intRange: boolean;
  floatRange: boolean;
  vector: boolean;
  enum: boolean;
  float: boolean;
  string: boolean;
  bool: boolean;
}

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
}

export interface Enumerable {
  genericType: string;
  enumerableType: string;
  isSpecial: boolean;
}

export interface CustomXml {
  key: string;
  value: string;
}

export enum CompletionItemKind {
  Text = 1,
  Field = 5,
  Variable = 6,
  Class = 7,
  Property = 10,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Reference = 18,
  EnumMember = 20,
  Constant = 21,
}

export interface ModInfo {
  name: string;
  desc: string;
  url: string;
  id: string;
  wshopId?: string;
  path: string;
  author: string;
}
