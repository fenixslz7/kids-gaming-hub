const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { autoUpdater } = require("electron-updater");

const CANDIDATES = [
  "C:/Program Files (x86)/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "C:/Program Files/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "D:/Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "D:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
  "E:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg",
];

const STEAM_ROOTS = [
  process.env.PROGRAMFILES_X86 && path.join(process.env.PROGRAMFILES_X86, "Steam"),
  process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Steam"),
  "C:/Program Files (x86)/Steam",
  "C:/Program Files/Steam",
  "D:/Steam",
  "D:/SteamLibrary",
  "E:/Steam",
  "E:/SteamLibrary",
].filter(Boolean);

let mainWindow;

function findVideoProfiles() {
  const profiles = [];
  const seen = new Set();
  for (const root of STEAM_ROOTS) {
    const userdata = path.join(root, "userdata");
    if (!fs.existsSync(userdata)) continue;
    let accounts = [];
    try { accounts = fs.readdirSync(userdata, { withFileTypes: true }).filter((d) => d.isDirectory() && /^\d+$/.test(d.name)); } catch {}
    for (const account of accounts) {
      const cfgDir = path.join(userdata, account.name, "730", "local", "cfg");
      const videoFile = path.join(cfgDir, "cs2_video.txt");
      if (!fs.existsSync(cfgDir) || seen.has(videoFile)) continue;
      seen.add(videoFile);
      profiles.push({ id: account.name, label: `Steam ID ${account.name}`, file: videoFile, exists: fs.existsSync(videoFile) });
    }
  }
  return profiles;
}

function readVideoValues(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, "utf8");
  const values = {};
  for (const match of content.matchAll(/"([^"]+)"\s+"([^"]*)"/g)) values[match[1]] = match[2];
  return values;
}

function updateKeyValues(content, updates) {
  let result = content || '"video.cfg"\n{\n}\n';
  for (const [key, value] of Object.entries(updates)) {
    const line = new RegExp('(^[\\t ]*"' + key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + '"[\\t ]+")[^"]*(")', "m");
    if (line.test(result)) result = result.replace(line, `$1${String(value)}$2`);
    else result = result.replace(/\n?}\s*$/, `\n  "${key}" "${String(value)}"\n}\n`);
  }
  return result;
}

ipcMain.handle("save-cfg", (_e, text) => {
  const dir = CANDIDATES.find((d) => fs.existsSync(d));
  if (!dir) throw new Error("Pasta de configuração do CS2 não encontrada. Verifique se o jogo está instalado pela Steam.");
  const file = path.join(dir, "autoexec.cfg");
  fs.writeFileSync(file, text, "utf8");
  return file;
});

ipcMain.handle("get-video-profiles", () => {
  const profiles = findVideoProfiles();
  return profiles.map(({ id, label, file, exists }) => ({
    id, label, file, exists, values: readVideoValues(file),
  }));
});

ipcMain.handle("save-video-config", (_e, payload) => {
  if (!payload || typeof payload.profileId !== "string") throw new Error("Selecione a conta Steam.");
  const profile = findVideoProfiles().find((p) => p.id === payload.profileId);
  if (!profile) throw new Error("Perfil Steam não encontrado. Verifique a instalação da Steam.");
  const width = Number(payload.width), height = Number(payload.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 640 || width > 7680 || height < 480 || height > 4320) {
    throw new Error("Resolução inválida.");
  }
  const current = fs.existsSync(profile.file) ? fs.readFileSync(profile.file, "utf8") : '"video.cfg"\n{\n}\n';
  const updates = {
    "setting.defaultres": width,
    "setting.defaultresheight": height,
    "setting.aspectratiomode": Number(payload.aspect),
    "setting.fullscreen": payload.fullscreen ? 1 : 0,
    "setting.nowindowborder": payload.fullscreen ? 0 : 1,
    "setting.mat_vsync": payload.vsync ? 1 : 0,
    "setting.videocfg_shadow_quality": Number(payload.shadows),
    "setting.videocfg_texture_detail": Number(payload.textures),
    "setting.videocfg_particle_detail": Number(payload.particles),
    "setting.videocfg_ao_detail": Number(payload.ambientOcclusion),
    "setting.msaa_samples": Number(payload.msaa),
    "setting.r_texturefilteringquality": Number(payload.filtering),
  };
  const updated = updateKeyValues(current, updates);
  fs.mkdirSync(path.dirname(profile.file), { recursive: true });
  if (fs.existsSync(profile.file)) fs.copyFileSync(profile.file, profile.file + ".kids-backup");
  fs.writeFileSync(profile.file, updated, "utf8");
  return { file: profile.file, backup: fs.existsSync(profile.file + ".kids-backup") ? profile.file + ".kids-backup" : null };
});


let clipHotkey = "F12";
function registerClipHotkey(accelerator) {
  globalShortcut.unregister(clipHotkey);
  const normalized = String(accelerator || "F12").trim();
  if (!/^(F[1-9]|F1[0-2]|Ctrl\+F[1-9]|Ctrl\+F1[0-2]|Alt\+F[1-9]|Alt\+F1[0-2]|Shift\+F[1-9]|Shift\+F1[0-2])$/.test(normalized)) {
    throw new Error("Atalho inválido. Use F1–F12 ou Ctrl/Alt/Shift + F1–F12.");
  }
  const registered = globalShortcut.register(normalized, () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("clip-hotkey");
  });
  if (!registered) throw new Error("Essa tecla já está sendo usada por outro aplicativo. Escolha outro atalho.");
  clipHotkey = normalized;
  return clipHotkey;
}

ipcMain.handle("clip-sources", async () => {
  const sources = await desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 240, height: 135 }, fetchWindowIcons: false });
  return sources.map((s) => ({ id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL() }));
});
ipcMain.handle("clip-set-hotkey", (_e, accelerator) => registerClipHotkey(accelerator));
ipcMain.handle("clip-save", async (_e, { data, suggestedName }) => {
  if (typeof data !== "string" || data.length > 600 * 1024 * 1024) throw new Error("Arquivo de clipe inválido ou muito grande (limite 450 MB).");
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Salvar clipe",
    defaultPath: suggestedName || "KIDS-Clip.webm",
    filters: [{ name: "Vídeo WebM", extensions: ["webm"] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  fs.writeFileSync(result.filePath, Buffer.from(data, "base64"));
  return { canceled: false, filePath: result.filePath };
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
      type: "info", title: "Atualização pronta",
      message: "Uma nova versão do KIDS Gaming Hub foi baixada.",
      detail: `Versão ${info.version} pronta para instalar. O aplicativo será reiniciado para concluir a atualização.`,
      buttons: ["Atualizar e reiniciar", "Depois"], defaultId: 0, cancelId: 1,
    });
    if (choice.response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.checkForUpdatesAndNotify().catch((error) => console.error("[KIDS] Não foi possível verificar atualizações:", error));
}

app.whenReady().then(() => { createWindow(); setupAutoUpdates(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
