const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const CANDIDATES = [
  "C:/Program Files (x86)/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "C:/Program Files/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "D:/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "D:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "E:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
];
ipcMain.handle("save-cfg", (_e, text) => {
  const dir = CANDIDATES.find((d) => fs.existsSync(d));
  if (!dir) throw new Error("CS2 não encontrado");
  const file = path.join(dir, "autoexec.cfg");
  fs.writeFileSync(file, text);
  return file;
});
app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1400, height: 900, backgroundColor: "#1a0b0b", title: "KIDS",
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, "..", "electron-dist", "index.html"));
});
app.on("window-all-closed", () => app.quit());
