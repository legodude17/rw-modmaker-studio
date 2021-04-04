import { List, Map, Seq } from 'immutable';
import xml, { XmlObject } from 'xml';
import { promises as fs } from 'fs';
import path from 'path';
import { parse, Node } from './parser/XMLParser';
import {
  Def,
  Field,
  LoadType,
  makeDef,
  makeField,
  makeManifest,
  makeMod,
  makeProject,
  ModManifest,
  ModManifestProps,
  ModProps,
  Project,
  ProjectProps,
} from './Project';
import * as Data from './DataManager';
import { allFilesRecusive, getModPaths } from './util';
import { TypeInfo } from './completionItem';

export function stringifyManifest(manifest: ModManifest): string {
  return xml(
    [
      {
        ModMetaData: [
          { name: manifest.name },
          { packageId: manifest.id },
          { author: manifest.author },
          { description: manifest.desc },
          { url: manifest.url },
          { supportedVersions: manifest.versions.map((ver) => ({ li: ver })) },
          {
            loadAfter: manifest.loadRules
              .filter((val) => val === LoadType.After)
              .map((_, mod) => ({ li: mod })),
          },
          {
            loadBefore: manifest.loadRules
              .filter((val) => val === LoadType.Before)
              .map((_, mod) => ({ li: mod })),
          },
          {
            modDependencies: manifest.deps.map((dep) => ({
              li: [
                {
                  packageId: dep.id,
                },
                { displayName: dep.name },
                { downloadUrl: dep.url },
                { steamWorkshopUrl: dep.workshop },
              ],
            })),
          },
        ],
      },
    ],
    {
      stream: false,
      indent: '  ',
      declaration: true,
    }
  );
}

export function readManifest(text: string): ModManifest {
  const manifest: Partial<ModManifestProps> = { loadRules: Map() };
  const doc = parse(text);
  doc.children[0].children.forEach((node) => {
    switch (node.tag?.content) {
      case 'name':
        manifest.name = node.text?.content;
        break;
      case 'author':
        manifest.author = node.text?.content;
        break;
      case 'url':
        manifest.url = node.text?.content;
        break;
      case 'description':
        manifest.desc = node.text?.content;
        break;
      case 'packageId':
        manifest.id = node.text?.content;
        break;
      case 'supportedVersions':
        manifest.versions = List(
          node.children
            .map((child) => child.text?.content ?? '')
            .filter((txt) => !!txt)
        );
        break;
      case 'loadBefore':
        node.children.forEach((child) => {
          manifest.loadRules = manifest.loadRules?.set(
            child.text?.content ?? '',
            LoadType.Before
          );
        });
        break;
      case 'loadAfter':
        node.children.forEach((child) => {
          manifest.loadRules = manifest.loadRules?.set(
            child.text?.content ?? '',
            LoadType.After
          );
        });
        break;
      case 'modDependencies':
        manifest.deps = List(
          node.children.map((child) => {
            const mod: Partial<ModProps> = {};
            child.children.forEach((n) => {
              switch (n.tag?.content) {
                case 'packageId':
                  mod.id = n.text?.content;
                  break;
                case 'displayName':
                  mod.name = n.text?.content;
                  break;
                case 'downloadUrl':
                  mod.url = n.text?.content;
                  break;
                case 'steamWorkshopUrl':
                  mod.workshop = n.text?.content;
                  break;
                default:
                  break;
              }
            });
            mod.path = Data.modByName(mod.name ?? '')?.path;
            return makeMod(mod);
          })
        );
        break;
      default:
    }
  });
  return makeManifest(manifest);
}

function fieldToXml(field: Field): XmlObject {
  if (!List.isList(field.value)) {
    return {
      [field.key]: field.value as string,
      _attr: field.attrs,
    } as XmlObject;
  }

  return {
    [field.key]: (field.value as List<Field>).map(fieldToXml),
    _attr: field.attrs,
  } as XmlObject;
}

export function stringifyDefs(defs: Def[]): string {
  return xml(
    [
      {
        Defs: defs.map((def) => ({
          [def.type
            .replace('Rimworld.', '')
            .replace('Verse.', '')]: def.fields.map(fieldToXml),
        })),
      },
    ],
    {
      indent: '  ',
      stream: false,
      declaration: true,
    }
  );
}

const failedTypes: Set<string> = new Set();

function readField(node: Node, parentTypeName?: string): Field {
  let type = '';
  if (parentTypeName && node.tag?.content) {
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
  if (node.children.length === 0 && node.text?.content) {
    const key = node.tag?.content;
    const value =
      type === 'System.Type'
        ? Data.fullType(node.text.content)
        : node.text.content;
    return makeField({
      key,
      value,
      attrs: node.attributes,
      type,
    });
  }
  return makeField({
    key: node.tag?.content ?? '',
    value: List(node.children.map((n) => readField(n, type))),
    attrs: node.attributes,
    type,
  });
}

export function readDefs(text: string): List<Def> {
  const doc = parse(text);

  return List(
    doc.children[0].children.map((node) =>
      makeDef({
        type: Data.fullType(node.tag?.content ?? 'Def'),
        name: node.attributes?.Name ?? undefined,
        defName:
          node.children.find((val) => val.tag?.content === 'defName')?.text
            ?.content ?? 'UnnamedDef',
        parent: node.attributes?.ParentName ?? undefined,
        abstract: node.attributes?.Abstract === 'True',
        fields: List(
          node.children.map((n) =>
            readField(n, Data.fullType(node.tag?.content ?? 'Def'))
          )
        ),
      })
    )
  );
}

export async function readProject(folder: string): Promise<Project> {
  const project: Partial<ProjectProps> = { folder };

  try {
    project.manifest = readManifest(
      await fs.readFile(path.join(folder, 'About', 'About.xml'), 'utf-8')
    );
  } catch (e) {
    project.manifest = makeManifest();
  }

  try {
    let lastLength = failedTypes.size;
    do {
      /* eslint-disable no-await-in-loop */
      lastLength = failedTypes.size;
      await Data.regenerate(project.manifest.deps, folder, [
        ...failedTypes.values(),
      ]);
      project.defs = (
        await Promise.all(
          (
            await Promise.all(
              (await getModPaths(List([folder]), 'Defs'))
                .filter((a) => a)
                .map(allFilesRecusive)
            )
          )
            .reduce((a, b) => a.concat(b), [])
            .map((file) => fs.readFile(file, 'utf-8'))
        )
      )
        .map(readDefs)
        .reduce((a, b) => a.concat(b), List());
      /* eslint-enable */
    } while (failedTypes.size !== lastLength);
  } catch (e) {
    project.defs = List();
  }

  return makeProject(project);
}
