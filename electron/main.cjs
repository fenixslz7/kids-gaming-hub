const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");

const CANDIDATES = [
  "C:/Program Files (x86)/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "C:/Program Files/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "D:/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "D:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "E:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
];

let mainWindow;

ipcMain.handle("save-cfg", (_e, text) => {
  const dir = CANDIDATES.find((d) => fs.existsSync(d));
  if (!dir) throw new Error("CS2 não encontrado");
  const file = path.join(dir, "autoexec.cfg");
  fs.writeFileSync(file, text);
  return file;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#07110d",
    title: "KIDS Gaming Hub",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "..", "electron-dist", "index.html"));
  mainWindow.on("closed", () => { mainWindow = null; });
}

function setupAutoUpdates() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("checking-for-update", () => console.log("[KIDS] Verificando atualizações..."));
  autoUpdater.on("update-available", (info) => console.log("[KIDS] Atualização disponível:", info.version));
  autoUpdater.on("update-not-available", () => console.log("[KIDS] Aplicativo atualizado."));
  autoUpdater.on("error", (error) => console.error("[KIDS] Erro no atualizador:", error));

  autoUpdater.on("update-downloaded", async (info) => {
    if (!mainWindow) return;
    const choice = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Atualização pronta",
      message: "Uma nova versão do KIDS Gaming Hub foi baixada.",
      detail: `Versão ${info.version} pronta para instalar. O aplicativo será reiniciado para concluir a atualização.`,
      buttons: ["Atualizar e reiniciar", "Depois"],
      defaultId: 0,
      cancelId: 1,
    });
    if (choice.response === 0) autoUpdater.quitAndInstall();
  });

  // Confere atualizações publicadas como GitHub Releases ao iniciar o aplicativo.
  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.error("[KIDS] Não foi possível verificar atualizações:", error);
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
