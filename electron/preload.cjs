const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("kids", { saveCfg: (t) => ipcRenderer.invoke("save-cfg", t) });
