export interface Prefs {
  rwexec: string;
  rwlocalmods: string;
  rwassem: string;
  unityassem: string;
  rwsteammods: string;
  extractorpath: string;
  rwdata: string;
}

export const defaultPrefs: Prefs = {
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
