import { useEffect, useRef, useState } from "react";

type Source = { id: string; name: string };
declare global {
  interface Window { kids?: {
    getClipSources: () => Promise<Source[]>;
    setClipHotkey: (key: string) => Promise<string>;
    saveClip: (payload: { data: string; suggestedName: string }) => Promise<{ canceled: boolean; filePath?: string }>;
    onClipHotkey: (callback: () => void) => () => void;
  }; }
}

export function ClipsStudio() {
  const [sources, setSources] = useState<Source[]>([]);
  const [source, setSource] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [key, setKey] = useState("F12");
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Escolha uma tela e inicie a captura.");
  const [videoUrl, setVideoUrl] = useState("");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [caption, setCaption] = useState("");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [exporting, setExporting] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<{ at: number; blob: Blob }[]>([]);
  const busy = useRef(false);

  async function refresh() {
    try { const list = await window.kids?.getClipSources(); if (list) { setSources(list); if (!source && list[0]) setSource(list[0].id); } }
    catch { setStatus("Não foi possível listar as telas."); }
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => window.kids?.onClipHotkey(() => { void saveReplay(); }), [seconds]);

  async function setGlobalKey() {
    try { const value = await window.kids?.setClipHotkey(key); if (value) setStatus("Atalho global " + value + " configurado."); }
    catch (e) { setStatus(e instanceof Error ? e.message : "Atalho indisponível."); }
  }
  async function start() {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { mandatory: { chromeMediaSource: "desktop", chromeMediaSourceId: source, maxFrameRate: 30 } } as MediaTrackConstraints });
      stream.current = media; chunks.current = [];
      const rec = new MediaRecorder(media, { mimeType: "video/webm" });
      recorder.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) { chunks.current.push({ at: Date.now(), blob: e.data }); const cutoff = Date.now() - 190000; chunks.current = chunks.current.filter((c) => c.at > cutoff); }
      };
      rec.start(1000); await setGlobalKey(); setActive(true);
      setStatus("Capturando. Pressione " + key + " para salvar os últimos " + seconds + " segundos.");
    } catch (e) { setStatus(e instanceof Error ? e.message : "Falha ao iniciar captura."); }
  }
  function stop() { recorder.current?.stop(); stream.current?.getTracks().forEach((t) => t.stop()); recorder.current = null; stream.current = null; setActive(false); setStatus("Captura parada."); }
  async function saveReplay() {
    if (busy.current || !recorder.current || recorder.current.state !== "recording") return;
    busy.current = true;
    try {
      await new Promise<void>((resolve) => { recorder.current!.addEventListener("dataavailable", () => resolve(), { once: true }); recorder.current!.requestData(); });
      const recent = chunks.current.filter((c) => c.at >= Date.now() - seconds * 1000);
      if (!recent.length) throw new Error("Aguarde alguns segundos para formar o replay.");
      const bytes = new Uint8Array(await new Blob(recent.map((c) => c.blob), { type: "video/webm" }).arrayBuffer());
      let binary = ""; for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
      const result = await window.kids?.saveClip({ data: btoa(binary), suggestedName: "KIDS-Clip-" + Date.now() + ".webm" });
      setStatus(result?.canceled ? "Salvamento cancelado." : "Clipe salvo em " + result?.filePath);
    } catch (e) { setStatus(e instanceof Error ? e.message : "Erro ao salvar clipe."); }
    finally { busy.current = false; }
  }
  function importVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file)); setTrimStart(0); setTrimEnd(0);
  }
  async function exportVideo() {
    const v = video.current; if (!v || !videoUrl) return;
    setExporting(true);
    try {
      const canvas = document.createElement("canvas"); canvas.width = v.videoWidth; canvas.height = v.videoHeight;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas indisponível.");
      const output = canvas.captureStream(30); const parts: BlobPart[] = [];
      const rec = new MediaRecorder(output, { mimeType: "video/webm" });
      rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
      rec.onstop = () => { const url = URL.createObjectURL(new Blob(parts, { type: "video/webm" })); const a = document.createElement("a"); a.href = url; a.download = "KIDS-Editado.webm"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); output.getTracks().forEach((t) => t.stop()); setExporting(false); setStatus("Vídeo editado exportado. Esta versão exporta vídeo sem áudio."); };
      v.currentTime = trimStart; await new Promise<void>((resolve) => { v.onseeked = () => resolve(); });
      rec.start(300); await v.play();
      const draw = () => {
        if (v.paused || v.ended || (trimEnd > trimStart && v.currentTime >= trimEnd)) { if (rec.state === "recording") rec.stop(); return; }
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height); ctx.filter = "none";
        if (caption) { ctx.font = "bold 38px Arial"; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = "#000"; ctx.fillStyle = "#fff"; ctx.strokeText(caption, canvas.width / 2, canvas.height - 48, canvas.width - 40); ctx.fillText(caption, canvas.width / 2, canvas.height - 48, canvas.width - 40); }
        requestAnimationFrame(draw);
      }; v.muted = true; draw();
    } catch (e) { setExporting(false); setStatus(e instanceof Error ? e.message : "Erro ao exportar."); }
  }

  return <div className="space-y-6">
    <section className="rounded-xl border border-emerald-400/20 bg-[#07130f]/90 p-5">
      <h2 className="font-display text-2xl tracking-widest text-emerald-300">CLIP STUDIO</h2>
      <p className="mb-4 text-sm text-muted-foreground">Replay buffer com atalho global para salvar os últimos segundos da tela ou janela.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">Tela/janela<select value={source} onChange={(e) => setSource(e.target.value)} className="mt-1 w-full rounded border border-border bg-background p-2">{sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <div className="flex items-end gap-2"><button className="btn-outline" onClick={() => void refresh()}>Atualizar lista</button><button className="btn" onClick={active ? stop : start}>{active ? "Parar" : "Iniciar captura"}</button></div>
        <label className="text-sm">Duração<select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="mt-1 w-full rounded border border-border bg-background p-2">{[15,30,45,60,90,120,180].map((n) => <option key={n} value={n}>{n < 60 ? n + " segundos" : n / 60 + " minuto(s)"}</option>)}</select></label>
        <label className="text-sm">Tecla de clipe<div className="mt-1 flex gap-2"><input value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} className="w-full rounded border border-border bg-background p-2" /><button className="btn-outline" onClick={() => void setGlobalKey()}>Salvar</button></div></label>
      </div>
      <button disabled={!active} className="btn mt-4 w-full disabled:opacity-40" onClick={() => void saveReplay()}>Salvar últimos {seconds}s agora</button>
      <p className="mt-3 text-xs text-muted-foreground">A captura inicial grava a tela/janela selecionada, sem áudio do sistema. O buffer fica temporariamente na memória do computador.</p>
    </section>
    <section className="rounded-xl border border-emerald-400/20 bg-[#07130f]/90 p-5">
      <h2 className="mb-2 font-display text-2xl tracking-widest text-emerald-300">EDITOR DE VÍDEO</h2>
      <label className="btn inline-flex cursor-pointer">Importar vídeo<input type="file" accept="video/*" onChange={importVideo} className="hidden" /></label>
      {videoUrl && <><video ref={video} src={videoUrl} controls className="mt-4 max-h-[460px] w-full rounded bg-black" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }} onLoadedMetadata={(e) => setTrimEnd(e.currentTarget.duration)} />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm">Brilho {brightness}%<input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" /></label>
          <label className="text-sm">Contraste {contrast}%<input type="range" min="50" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" /></label>
          <label className="text-sm">Saturação {saturation}%<input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full" /></label>
        </div>
        <label className="mt-3 block text-sm">Legenda<input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="Texto sobre o vídeo" className="mt-1 w-full rounded border border-border bg-background p-2" /></label>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="text-sm">Corte inicial {trimStart.toFixed(1)}s<input type="range" min="0" max={trimEnd || 1} step="0.1" value={trimStart} onChange={(e) => setTrimStart(Number(e.target.value))} className="w-full" /></label>
          <label className="text-sm">Corte final {trimEnd.toFixed(1)}s<input type="range" min={trimStart + 0.1} max={video.current?.duration || trimEnd || 1} step="0.1" value={trimEnd} onChange={(e) => setTrimEnd(Number(e.target.value))} className="w-full" /></label>
        </div>
        <button className="btn mt-4" disabled={exporting} onClick={() => void exportVideo()}>{exporting ? "Exportando..." : "Exportar clipe editado"}</button>
      </>}
      <p role="status" className="mt-4 rounded border border-border bg-card p-3 text-sm text-muted-foreground">{status}</p>
    </section>
  </div>;
}
