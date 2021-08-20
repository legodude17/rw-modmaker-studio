import path from 'path';

export const prefs = [
  {
    name: 'rwexec',
    desc: 'RimWorld Executable Path',
    type: 'string',
    fromBase: (base: string) => path.join(base, 'RimWorldWin64.exe'),
  },
  {
    name: 'rwlocalmods',
    desc: 'RimWorld Local Mod Folder Path',
    type: 'string',
    fromBase: (base: string) => path.join(base, 'Mods'),
  },
  {
    name: 'rwassem',
    desc: 'RimWorld Assembly Path',
    type: 'string',
    fromBase: (base: string) =>
      path.join(base, 'RimWorldWin64_Data/Managed/Assembly-CSharp.dll'),
  },
  {
    name: 'unityassem',
    desc: 'UnityEngine Assembly Path',
    type: 'string',
    fromBase: (base: string) =>
      path.join(base, 'RimWorldWin64_Data/Managed/UnityEngine.dll'),
  },
  {
    name: 'extractorpath',
    desc: 'Path to Field Extractor',
    type: 'string',
    fromBase: (base: string) => '',
  },
  {
    name: 'rwdata',
    desc: 'Path to RimWorld Data Folder',
    type: 'string',
    fromBase: (base: string) =>
      path.join(
        base,
        'C:/Program Files (x86)/Steam/steamapps/common/RimWorld/Data'
      ),
  },
  {
    name: 'rwsteammods',
    desc: 'Steam Workshop Mods Folder Path',
    type: 'string',
    fromBase: (base: string) =>
      path.resolve(base, '../../workshop/content/294100'),
  },
];

export const defaultPrefs: { [key: string]: string } = {
  rwexec:
    'C:/Program Files (x86)/Steam/steamapps/common/RimWorld/RimWorldWin64.exe',
  rwlocalmods: 'C:/Program Files (x86)/Steam/steamapps/common/RimWorld/Mods',
  rwassem:
    'C:/Program Files (x86)/Steam/steamapps/common/RimWorld/RimWorldWin64_Data/Managed/Assembly-CSharp.dll',
  unityassem:
    'C:/Program Files (x86)/Steam/steamapps/common/RimWorld/RimWorldWin64_Data/Managed/UnityEngine.dll',
  rwsteammods: 'C:/Program Files (x86)/Steam/steamapps/workshop/content/294100',
  extractorpath:
    'C:/Users/legod/Code/extractor/extractor/bin/Debug/extractor.exe',
  rwdata: 'C:/Program Files (x86)/Steam/steamapps/common/RimWorld/Data',
};
