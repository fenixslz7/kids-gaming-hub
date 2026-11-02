const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("kids", {
  saveCfg: (text) => ipcRenderer.invoke("save-cfg", text),
  getVideoProfiles: () => ipcRenderer.invoke("get-video-profiles"),
  saveVideoConfig: (payload) => ipcRenderer.invoke("save-video-config", payload),
});
