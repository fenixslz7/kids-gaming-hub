// Single source of truth for the desktop bridge exposed by electron/preload.cjs.
// Both the panel and the clips studio read the same `window.kids` object, so the
// type is declared once here instead of per component.

export type ClipSource = { id: string; name: string };

export type VideoProfile = {
  id: string;
  label: string;
  file: string;
  exists: boolean;
  values: Record<string, string>;
};

export interface KidsBridge {
  saveCfg: (text: string) => Promise<string>;
  getVideoProfiles: () => Promise<VideoProfile[]>;
  saveVideoConfig: (
    payload: Record<string, string | number | boolean>,
  ) => Promise<{ file: string; backup: string | null }>;
  getClipSources: () => Promise<ClipSource[]>;
  setClipHotkey: (key: string) => Promise<string>;
  saveClip: (payload: { data: string; suggestedName: string }) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;
  onClipHotkey: (callback: () => void) => () => void;
  minecraftApplyProfile: (profile: string) => Promise<{ file: string; backup: string }>;
  minecraftImportFile: (kind: "mod" | "resourcepack") => Promise<{ canceled: boolean; filePath?: string }>;
}

declare global {
  interface Window {
    kids?: KidsBridge;
  }
}
