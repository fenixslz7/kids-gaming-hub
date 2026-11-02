import { useEffect, useState } from "react";
import {
  CROSSHAIRS, PROS, LAUNCH_OPTIONS, OPTIMIZE_CFG, buildAutoexec, convertSens, crosshairCfg, edpi,
  type Crosshair, type ProConfig,
} from "@/lib/cs2";

const GAMES = [
  { id: "cs2", name: "Counter-Strike 2", ready: true },
  { id: "val", name: "Valorant", ready: false },
  { id: "fn", name: "Fortnite", ready: false },
  { id: "gta", name: "GTA V RP", ready: false },
];

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function KidsPanel() {
  const [game, setGame] = useState("cs2");
  const [dpi, setDpi] = useState(400);
  const [sens, setSens] = useState(2);
  const [cross, setCross] = useState<Crosshair>(CROSSHAIRS["Clássica Verde"]);
  const [optimize, setOptimize] = useState(true);
  const [activePro, setActivePro] = useState<ProConfig | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("kids-cs2");
    if (s) { const d = JSON.parse(s); setDpi(d.dpi); setSens(d.sens); setCross(d.cross); setOptimize(d.optimize); }
  }, []);
  useEffect(() => {
    localStorage.setItem("kids-cs2", JSON.stringify({ dpi, sens, cross, optimize }));
  }, [dpi, sens, cross, optimize]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const copy = (t: string, m = "Copiado!") => { navigator.clipboard.writeText(t); flash(m); };

  const changeDpi = (n: number) => { setSens(convertSens(dpi, sens, n)); setDpi(n); };
  const applyPro = (p: ProConfig) => {
    setDpi(p.dpi); setSens(p.sens); setCross(p.crosshair); setActivePro(p);
    flash(`Config de ${p.name} setada 💸`);
  };
  const cfg = buildAutoexec({ dpi, sens, crosshair: cross, optimize, title: activePro?.name });

  return (
    <div className="min-h-screen bg-background text-foreground money-bg">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💵</span>
            <h1 className="font-display text-5xl tracking-widest text-primary">KIDS</h1>
            <span className="hidden sm:block text-xs uppercase tracking-[0.3em] text-muted-foreground">La Famiglia · Game Panel</span>
          </div>
          <span className="font-display text-xl text-gold">$ eDPI {edpi(dpi, sens)}</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl grid lg:grid-cols-[220px_1fr] gap-6 p-6">
        <nav className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Áreas de jogos</p>
          {GAMES.map((g) => (
            <button key={g.id} disabled={!g.ready} onClick={() => setGame(g.id)}
              className={`w-full text-left px-4 py-3 rounded-md border font-semibold transition ${game === g.id ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:border-primary"} disabled:opacity-40`}>
              {g.name}{!g.ready && <span className="block text-xs font-normal">em breve</span>}
            </button>
          ))}
        </nav>

        <main className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Panel title="DPI & Sensibilidade">
              <label className="text-sm text-muted-foreground">DPI do mouse</label>
              <div className="flex flex-wrap gap-2 my-2">
                {[400, 800, 1600, 3200].map((d) => (
                  <button key={d} onClick={() => changeDpi(d)}
                    className={`px-3 py-1 rounded border ${dpi === d ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{d}</button>
                ))}
                <input type="number" value={dpi} onChange={(e) => changeDpi(Number(e.target.value) || 1)}
                  className="w-24 rounded border border-input bg-background px-2" />
              </div>
              <label className="text-sm text-muted-foreground">Sensibilidade no jogo: <b className="text-foreground">{sens}</b></label>
              <input type="range" min={0.1} max={6} step={0.01} value={sens} onChange={(e) => setSens(Number(e.target.value))} className="w-full accent-primary" />
              <p className="text-xs text-muted-foreground mt-2">Ao trocar o DPI, a sensi é convertida para manter o mesmo eDPI. O DPI físico é alterado no software do seu mouse (Logitech G Hub, Razer Synapse...).</p>
              <button onClick={() => copy(`sensitivity ${sens}`)} className="btn mt-3">Copiar comando</button>
            </Panel>

            <Panel title="Mira">
              <div className="flex gap-4">
                <CrosshairPreview c={cross} />
                <div className="flex-1 grid gap-1">
                  {Object.entries(CROSSHAIRS).map(([n, c]) => (
                    <button key={n} onClick={() => setCross(c)} className="text-left text-sm px-2 py-1 rounded hover:bg-accent">{n}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                {(["size", "gap", "thickness"] as const).map((k) => (
                  <label key={k}>{k}
                    <input type="number" step={0.5} value={cross[k]} onChange={(e) => setCross({ ...cross, [k]: Number(e.target.value) })}
                      className="w-full rounded border border-input bg-background px-1" /></label>
                ))}
              </div>
              <div className="flex gap-4 text-sm mt-2">
                <label><input type="checkbox" checked={cross.dot} onChange={(e) => setCross({ ...cross, dot: e.target.checked })} /> Ponto</label>
                <label><input type="checkbox" checked={cross.outline} onChange={(e) => setCross({ ...cross, outline: e.target.checked })} /> Contorno</label>
                <input type="color" value={`#${[cross.r, cross.g, cross.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`}
                  onChange={(e) => { const h = e.target.value; setCross({ ...cross, r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) }); }} />
              </div>
              <button onClick={() => copy(crosshairCfg(cross).join("; "), "Mira copiada — cole no console")} className="btn mt-3">Copiar mira</button>
            </Panel>
          </div>

          <Panel title="Configs de Pro Players 🎩">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {PROS.map((p) => (
                <div key={p.name} className={`rounded-md border p-4 bg-background/60 ${activePro?.name === p.name ? "border-primary" : "border-border"}`}>
                  <div className="font-display text-2xl tracking-wide">{p.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{p.team}</div>
                  <div className="text-sm">DPI {p.dpi} · Sensi {p.sens}</div>
                  <div className="text-sm text-gold">eDPI {edpi(p.dpi, p.sens)}</div>
                  <div className="text-xs text-muted-foreground">{p.resolution} {p.aspect}</div>
                  <button onClick={() => applyPro(p)} className="btn w-full mt-3">Setar config</button>
                </div>
              ))}
            </div>
            {activePro && (
              <div className="mt-4 text-sm grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat k="Resolução" v={`${activePro.resolution} (${activePro.aspect})`} />
                {Object.entries(activePro.video).map(([k, v]) => <Stat key={k} k={k} v={v} />)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">Valores aproximados de fontes públicas; pros mudam suas configs com frequência.</p>
          </Panel>

          <div className="grid md:grid-cols-2 gap-6">
            <Panel title="Otimização Teclado & Mouse">
              <label className="flex gap-2 text-sm mb-3"><input type="checkbox" checked={optimize} onChange={(e) => setOptimize(e.target.checked)} /> Incluir comandos de desempenho no autoexec</label>
              <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
                <li>Mouse: polling rate 1000 Hz (ou mais) no software do mouse</li>
                <li>Windows: desative "Aumentar precisão do ponteiro"</li>
                <li>Windows: velocidade do ponteiro em 6/11</li>
                <li>Teclado: atraso de repetição no mínimo, taxa no máximo</li>
                <li>Ative "Modo de Jogo" e plano de energia "Alto desempenho"</li>
                <li>NVIDIA Reflex: Ativado + Boost no jogo</li>
              </ul>
              <div className="mt-3 text-xs font-mono bg-background p-2 rounded border border-border">{OPTIMIZE_CFG.join("; ")}</div>
              <p className="text-sm mt-3">Opções de inicialização (Steam):</p>
              <div className="flex gap-2 mt-1">
                <code className="flex-1 text-xs bg-background p-2 rounded border border-border">{LAUNCH_OPTIONS}</code>
                <button onClick={() => copy(LAUNCH_OPTIONS)} className="btn">Copiar</button>
              </div>
            </Panel>

            <Panel title="Aplicar no jogo">
              <pre className="text-xs font-mono bg-background p-3 rounded border border-border h-48 overflow-auto">{cfg}</pre>
              <div className="flex gap-2 mt-3">
                <button onClick={() => download("autoexec.cfg", cfg)} className="btn">Baixar autoexec.cfg</button>
                <button onClick={() => copy(cfg)} className="btn-outline">Copiar tudo</button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Coloque o arquivo em <code>Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg</code> e adicione <code>+exec autoexec.cfg</code> nas opções de inicialização.</p>
            </Panel>
          </div>
        </main>
      </div>

      {toast && <div className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-3 rounded-md shadow-lg font-semibold">{toast}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-red)]">
      <h2 className="font-display text-2xl tracking-widest text-primary mb-4 border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded border border-border p-2"><div className="text-xs text-muted-foreground">{k}</div>{v}</div>;
}

function CrosshairPreview({ c }: { c: Crosshair }) {
  const color = `rgb(${c.r},${c.g},${c.b})`;
  const len = c.size * 4, gap = (c.gap + 5) * 1.5, t = Math.max(c.thickness * 2, 1);
  const stroke = c.outline ? "rgb(0,0,0)" : "none";
  const bars = [
    [50 - t / 2, 50 - gap - len, t, len], [50 - t / 2, 50 + gap, t, len],
    [50 - gap - len, 50 - t / 2, len, t], [50 + gap, 50 - t / 2, len, t],
  ];
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 rounded border border-border bg-muted">
      {bars.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={color} stroke={stroke} strokeWidth={0.5} />)}
      {c.dot && <rect x={50 - t / 2} y={50 - t / 2} width={t} height={t} fill={color} stroke={stroke} strokeWidth={0.5} />}
    </svg>
  );
}
