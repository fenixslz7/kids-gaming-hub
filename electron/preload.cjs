const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("kids", {
  saveCfg: (text) => ipcRenderer.invoke("save-cfg", text),
  getVideoProfiles: () => ipcRenderer.invoke("get-video-profiles"),
  saveVideoConfig: (payload) => ipcRenderer.invoke("save-video-config", payload),
  getClipSources: () => ipcRenderer.invoke("clip-sources"),
  setClipHotkey: (key) => ipcRenderer.invoke("clip-set-hotkey", key),
  saveClip: (payload) => ipcRenderer.invoke("clip-save", payload),
  onClipHotkey: (callback) => { const listener = () => callback(); ipcRenderer.on("clip-hotkey", listener); return () => ipcRenderer.removeListener("clip-hotkey", listener); },
});
