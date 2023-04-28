import { List, Map } from 'immutable';
import xml, { XmlObject } from 'xml';
import { promises as fs } from 'fs';
import path, { join } from 'path';
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
import { allFilesRecusive, getModPaths, getName } from './util';
import { createManager, fullType } from './DataManager';
import { DataManager, AllData } from './DataManagerType';
import {
  getDefInfo,
  getInstalledMods,
  getTypeInfo,
  getAllAssemblies,
  getModFolders,
  getDefFiles,
  getDefFolders,
  getDocs,
} from './dataGetter';
import log from './log';
import { settings } from './electron';

const idsInUse = new Set<number>();

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

export function readManifest(text: string, Data: DataManager): ModManifest {
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
          [def.type.replace('Rimworld.', '').replace('Verse.', '')]: def.fields
            .map(fieldToXml)
            .concat({
              _attr: {
                ...(def.abstract ? { Abstract: 'True' } : {}),
                ...(def.name ? { Name: def.name } : {}),
                ...(def.parent ? { ParentName: def.parent } : {}),
              },
            }),
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

function genId() {
  let id;
  do {
    id = Math.random() * 10 ** Math.round(Math.random() * 10);
  } while (idsInUse.has(id));
  idsInUse.add(id);
  return id;
}

function readField(
  node: Node,
  Data: DataManager,
  failedTypes?: Set<string>,
  parentTypeName?: string
): Field {
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
        ? fullType(node.text.content, failedTypes, Data)
        : node.text.content;
    return makeField({
      key,
      value,
      attrs:
        node.attributes && Map(node.attributes).map((val) => val ?? undefined),
      type,
      id: genId(),
    });
  }
  if (node.attributes?.Class) {
    const temp = fullType(node.attributes.Class, failedTypes, Data);
    if (temp && Data.typeByName(temp)) type = temp;
  }
  return makeField({
    key: node.tag?.content ?? '',
    value: List(
      node.children.map((n) => readField(n, Data, failedTypes, type))
    ),
    attrs:
      node.attributes && Map(node.attributes).map((val) => val ?? undefined),
    type,
    id: genId(),
  });
}

export function readDefs(
  text: string,
  filePath: string,
  Data: DataManager,
  failedTypes?: Set<string>
): List<Def> {
  const doc = parse(text);

  return List(
    doc.children[0].children.map((node) =>
      makeDef({
        type: fullType(node.tag?.content ?? 'Def', failedTypes, Data),
        name: node.attributes?.Name ?? undefined,
        defName:
          node.children.find((val) => val.tag?.content === 'defName')?.text
            ?.content ?? 'UnnamedDef',
        parent: node.attributes?.ParentName ?? undefined,
        abstract: node.attributes?.Abstract === 'True',
        fields: List(
          node.children.map((n) =>
            readField(
              n,
              Data,
              failedTypes,
              fullType(node.tag?.content ?? 'Def', failedTypes, Data)
            )
          )
        ),
        file: filePath,
      })
    )
  );
}

export async function readProject(folder: string): Promise<Project> {
  log.debug('Reading project from:', folder);
  const project: Partial<ProjectProps> = { folder };
  const failedTypes: Set<string> = new Set();
  const data: AllData = {
    types: [],
    defs: [],
    mods: await getInstalledMods(await getModFolders()),
  };

  const Data = createManager(data);

  try {
    project.manifest = readManifest(
      await fs.readFile(path.join(folder, 'About', 'About.xml'), 'utf-8'),
      Data
    );
  } catch (e) {
    log.error(e);
    project.manifest = makeManifest();
  }

  log.debug('Read manifest');

  const defFiles = await getDefFiles(
    await getDefFolders(project.manifest.deps.map((mod) => mod.path).toArray())
  );

  const readDefsInt = ([text, file]: string[]) => readDefs(text, file, Data);

  try {
    let lastLength = failedTypes.size;
    do {
      /* eslint-disable no-await-in-loop */
      lastLength = failedTypes.size;
      log.debug('Regenerating types with', lastLength, 'failedTypes');
      data.types = await getTypeInfo(
        await getAllAssemblies(
          project.manifest.deps.map((mod) => mod.path).toArray(),
          folder
        ),
        [...failedTypes]
      );
      log.debug('Regenerating defs');
      data.defs = await getDefInfo(defFiles, Data, failedTypes);
      Data.clearCache();
      log.debug('Reading defs');
      project.defs = (
        await Promise.all(
          (
            await Promise.all(
              (await getModPaths([folder], 'Defs'))
                .filter((a) => a)
                .map(allFilesRecusive)
            )
          )
            .reduce((a, b) => a.concat(b), [])
            .map(async (file) => [await fs.readFile(file, 'utf-8'), file])
        )
      )
        .map(readDefsInt)
        .reduce((a, b) => a.concat(b), List());
      log.debug('Reading parents');
      /* eslint-enable */
      log.debug('Now have', failedTypes.size, 'failedTypes');
    } while (failedTypes.size !== lastLength);
  } catch (e) {
    log.error(e);
    project.defs = List();
  }

  log.debug('Finished reading defs');

  const docs = await getDocs(await settings.get('docspath'));

  log.debug('Read documentation files');

  Object.keys(docs).forEach((key) => {
    const defType = Data.typeByName(key);
    if (!defType) return;
    defType.docs = docs[key];
  });

  log.debug('Added documentation');

  project.loaded = true;

  await fs.writeFile(join(folder, '_data.json'), JSON.stringify(Data.data));

  return makeProject(project);
}

async function createIfMissing(folder: string) {
  try {
    await fs.access(folder);
  } catch (e) {
    log.warn(`Missing folder, creating ${folder}`);
    await fs.mkdir(folder);
  }
}

export async function writeProject(project: Project) {
  log.debug('Saving to', project.folder);

  createIfMissing(project.folder);

  createIfMissing(path.join(project.folder, 'About'));

  const manifestPath = path.join(project.folder, 'About', 'About.xml');

  log.debug('Saving manifest to', manifestPath);

  await fs.writeFile(manifestPath, stringifyManifest(project.manifest));

  log.debug('Saved manifest');

  const defsByFile: {
    [key: string]: Def[];
  } = {};

  createIfMissing(path.join(project.folder, 'Defs'));

  project.defs.forEach((def) => {
    const file = def.file.replaceAll(path.posix.sep, path.win32.sep);
    log.debug('Found', getName(def), 'at', file);
    if (defsByFile[file]) defsByFile[file].push(def);
    else defsByFile[file] = [def];
  });

  await Promise.all(
    Object.entries(defsByFile).map(([file, defs]) => {
      log.debug('Saving', defs.map(getName).join(', '), 'to', file);
      return fs.writeFile(file, stringifyDefs(defs));
    })
  );

  log.debug('Saved defs');
}
