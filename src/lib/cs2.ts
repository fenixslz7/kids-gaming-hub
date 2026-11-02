export type Crosshair = {
  style: number;
  size: number;
  gap: number;
  thickness: number;
  dot: boolean;
  outline: boolean;
  r: number;
  g: number;
  b: number;
};

export type ProConfig = {
  name: string;
  team: string;
  dpi: number;
  sens: number;
  resolution: string;
  aspect: string;
  crosshair: Crosshair;
  video: Record<string, string>;
};

export const edpi = (dpi: number, sens: number) => Math.round(dpi * sens * 100) / 100;

/** Converte a sensibilidade mantendo o mesmo eDPI ao trocar de DPI. */
export const convertSens = (oldDpi: number, sens: number, newDpi: number) =>
  Math.round(((oldDpi * sens) / newDpi) * 1000) / 1000;

export const CROSSHAIRS: Record<string, Crosshair> = {
  "Clássica Verde": { style: 4, size: 2, gap: -3, thickness: 0.5, dot: false, outline: false, r: 0, g: 255, b: 0 },
  "Ponto Ciano": { style: 4, size: 0, gap: -3, thickness: 1, dot: true, outline: true, r: 0, g: 255, b: 255 },
  "Pequena Amarela": { style: 4, size: 1.5, gap: -2, thickness: 0.6, dot: false, outline: true, r: 255, g: 255, b: 0 },
  "Grande Branca": { style: 4, size: 3.5, gap: -1, thickness: 1, dot: false, outline: true, r: 255, g: 255, b: 255 },
  "Vermelha Máfia": { style: 4, size: 2.5, gap: -2.5, thickness: 0.8, dot: true, outline: true, r: 255, g: 30, b: 30 },
};

const lowVideo = {
  "Sombras": "Baixo",
  "Texturas": "Baixo",
  "Shaders": "Baixo",
  "Partículas": "Baixo",
  "MSAA": "4x",
  "Modo": "Tela cheia",
};
const highVideo = { ...lowVideo, "Sombras": "Alto", "Shaders": "Alto", "MSAA": "8x" };

// Valores aproximados com base em fontes públicas; pros mudam configs com frequência.
export const PROS: ProConfig[] = [
  { name: "FalleN", team: "FURIA", dpi: 400, sens: 2.2, resolution: "1280x960", aspect: "4:3 esticado",
    crosshair: { style: 4, size: 2, gap: -2, thickness: 1, dot: false, outline: false, r: 0, g: 255, b: 255 }, video: highVideo },
  { name: "zayow", team: "—", dpi: 800, sens: 1.1, resolution: "1280x960", aspect: "4:3 esticado",
    crosshair: { style: 4, size: 1.5, gap: -3, thickness: 0.5, dot: false, outline: true, r: 255, g: 255, b: 0 }, video: lowVideo },
  { name: "molodoy", team: "FURIA", dpi: 400, sens: 1.75, resolution: "1280x960", aspect: "4:3 esticado",
    crosshair: { style: 4, size: 1, gap: -3, thickness: 0.5, dot: false, outline: false, r: 0, g: 255, b: 0 }, video: lowVideo },
  { name: "s1mple", team: "—", dpi: 400, sens: 3.09, resolution: "1280x960", aspect: "4:3 esticado",
    crosshair: { style: 4, size: 2, gap: -3, thickness: 0, dot: false, outline: false, r: 0, g: 255, b: 0 }, video: highVideo },
  { name: "ZywOo", team: "Vitality", dpi: 400, sens: 2, resolution: "1280x960", aspect: "4:3 esticado",
    crosshair: { style: 4, size: 2, gap: -3, thickness: 1, dot: false, outline: false, r: 0, g: 255, b: 0 }, video: highVideo },
  { name: "m0NESY", team: "Falcons", dpi: 800, sens: 1.1, resolution: "1280x960", aspect: "4:3 esticado",
    crosshair: { style: 4, size: 1, gap: -4, thickness: 1, dot: false, outline: true, r: 255, g: 255, b: 255 }, video: lowVideo },
  { name: "donk", team: "Spirit", dpi: 800, sens: 1.25, resolution: "1280x960", aspect: "4:3 esticado",
    crosshair: { style: 4, size: 1.5, gap: -3, thickness: 0.5, dot: false, outline: true, r: 0, g: 255, b: 255 }, video: lowVideo },
  { name: "KSCERATO", team: "FURIA", dpi: 400, sens: 2.5, resolution: "1280x960", aspect: "4:3 esticado",
    crosshair: { style: 4, size: 2, gap: -3, thickness: 1, dot: false, outline: false, r: 255, g: 255, b: 0 }, video: highVideo },
];

export const OPTIMIZE_CFG = [
  "fps_max 0",
  "fps_max_ui 120",
  "rate 786432",
  "cl_interp_ratio 1",
  "cl_updaterate 128",
  "r_dynamic 0",
  "engine_low_latency_sleep_after_client_tick true",
  "cl_showfps 1",
  "snd_mute_losefocus 0",
];

export const LAUNCH_OPTIONS = "-novid -high -fullscreen +fps_max 0 +exec autoexec.cfg";

export function crosshairCfg(c: Crosshair) {
  return [
    `cl_crosshairstyle ${c.style}`,
    `cl_crosshairsize ${c.size}`,
    `cl_crosshairgap ${c.gap}`,
    `cl_crosshairthickness ${c.thickness}`,
    `cl_crosshairdot ${c.dot ? 1 : 0}`,
    `cl_crosshair_drawoutline ${c.outline ? 1 : 0}`,
    `cl_crosshaircolor 5`,
    `cl_crosshaircolor_r ${c.r}`,
    `cl_crosshaircolor_g ${c.g}`,
    `cl_crosshaircolor_b ${c.b}`,
  ];
}

export function buildAutoexec(opts: { dpi: number; sens: number; crosshair: Crosshair; optimize: boolean; title?: string }) {
  return [
    `// KIDS PANEL — autoexec.cfg ${opts.title ? `(${opts.title})` : ""}`,
    `// DPI do mouse recomendado: ${opts.dpi} (ajuste no software do seu mouse)`,
    `// eDPI: ${edpi(opts.dpi, opts.sens)}`,
    `sensitivity ${opts.sens}`,
    `zoom_sensitivity_ratio 1`,
    ...crosshairCfg(opts.crosshair),
    ...(opts.optimize ? ["// Otimização", ...OPTIMIZE_CFG] : []),
    `host_writeconfig`,
    `echo "KIDS config carregada"`,
  ].join("\n");
}
