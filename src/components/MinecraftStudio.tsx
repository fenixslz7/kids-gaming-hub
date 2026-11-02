import { useMemo, useState } from "react";
import { CraftingCatalog } from "./CraftingCatalog";
import { Search, Download, PackagePlus, Zap, Image, Hammer, ExternalLink } from "lucide-react";

type Recipe = { name: string; pattern: string[]; ingredients: string[]; result: string; count?: number };
const RECIPES: Recipe[] = [
 {name:"Espada de diamante",pattern:[" D "," D "," P "],ingredients:["D = Diamante","P = Graveto"],result:"1 Espada de diamante"},
 {name:"Picareta de diamante",pattern:["DDD"," P "," P "],ingredients:["D = Diamante","P = Graveto"],result:"1 Picareta de diamante"},
 {name:"Machado de diamante",pattern:["DD ","DP "," P "],ingredients:["D = Diamante","P = Graveto"],result:"1 Machado de diamante"},
 {name:"Pá de diamante",pattern:[" D "," P "," P "],ingredients:["D = Diamante","P = Graveto"],result:"1 Pá de diamante"},
 {name:"Enxada de diamante",pattern:["DD "," P "," P "],ingredients:["D = Diamante","P = Graveto"],result:"1 Enxada de diamante"},
 {name:"Espada de ferro",pattern:[" I "," I "," P "],ingredients:["I = Barra de ferro","P = Graveto"],result:"1 Espada de ferro"},
 {name:"Mesa de trabalho",pattern:["PP ","PP ","   "],ingredients:["P = Tábuas de madeira"],result:"1 Mesa de trabalho"},
 {name:"Baú",pattern:["PPP","P P","PPP"],ingredients:["P = Tábuas de madeira"],result:"1 Baú"},
 {name:"Fornalha",pattern:["CCC","C C","CCC"],ingredients:["C = Pedregulho ou ardósia"],result:"1 Fornalha"},
 {name:"Tocha",pattern:["   "," C "," P "],ingredients:["C = Carvão ou carvão vegetal","P = Graveto"],result:"4 Tochas"},
 {name:"Arco",pattern:[" FP","F P"," FP"],ingredients:["F = Graveto","P = Linha"],result:"1 Arco"},
 {name:"Flecha",pattern:[" F "," P ","   "],ingredients:["F = Pederneira","P = Graveto","(abaixo do graveto): Pena"],result:"4 Flechas"},
 {name:"Escudo",pattern:["PFP","PPP"," P "],ingredients:["P = Tábuas","F = Barra de ferro"],result:"1 Escudo"},
 {name:"Bancada de encantamento",pattern:[" D ","LBL","OOO"],ingredients:["D = Diamante","L = Livro","B = Obsidiana","O = Obsidiana"],result:"1 Mesa de encantamento"},
 {name:"Pão",pattern:["   ","   ","WWW"],ingredients:["W = Trigo"],result:"1 Pão"},
 {name:"Papel",pattern:["   ","   ","SSS"],ingredients:["S = Cana-de-açúcar"],result:"3 Papéis"},
 {name:"Livro",pattern:[" P "," P "," L "],ingredients:["P = Papel (3 unidades)","L = Couro"],result:"1 Livro"},
 {name:"Pistão",pattern:["WWW","CIC","R R"],ingredients:["W = Tábuas","C = Pedregulho","I = Barra de ferro","R = Redstone"],result:"1 Pistão"},
 {name:"Balde",pattern:["I I"," I ","   "],ingredients:["I = Barra de ferro"],result:"1 Balde"},
 {name:"Pérola do Ender (olho)",pattern:["   "," B "," P "],ingredients:["B = Pérola do Ender","P = Pó de blaze"],result:"1 Olho do Ender"},
];
const PACKS = [
 {name:"TruthFul PvP",desc:"Pack competitivo 1.8.9 feito para Bedwars: lã legível, itens limpos e espadas curtas.",url:"https://modrinth.com/resourcepack/truthfull-pvp-pack",version:"1.8.9 · PvP / Bedwars"},
 {name:"AuraFault 16x",desc:"Texturas 16x leves, GUI customizada e foco em FPS e Bedwars.",url:"https://modrinth.com/resourcepack/aurafault-16x",version:"1.8.9 · 16x"},
 {name:"Pxrple 16x",desc:"Visual simples, espadas menores, hotbar e céu customizados.",url:"https://modrinth.com/resourcepack/pxrple-16x",version:"1.8.9 · 16x"},
 {name:"Serenity 16x",desc:"Pack minimalista para Bedwars, com espadas curtas e interface customizada.",url:"https://modrinth.com/resourcepack/serenity-16x",version:"1.8.9 · 16x"},
 {name:"Blade 16x",desc:"Pack leve de Bedwars com espadas menores e hotbar customizada. Requer OptiFine para recursos recomendados.",url:"https://modrinth.com/resourcepack/blade-16x",version:"1.8.9 · 16x"},
 {name:"Odyssey 16x",desc:"Pack clean para Bedwars e fireball fights, com céu e hotbar customizados.",url:"https://modrinth.com/resourcepack/odyssey-16x",version:"1.8.9 · 16x"},
 {name:"Twilight Revenge 16x",desc:"Texturas limpas, overlay de armadura, água clara e foco em PCs de FPS baixo.",url:"https://modrinth.com/resourcepack/twilight-reveng-16x",version:"1.8.9 · 16x"},
 {name:"Gilded 16x",desc:"Tema dourado para Bedwars, com céu customizado (OptiFine para o céu).",url:"https://modrinth.com/resourcepack/gilded-16x",version:"1.8.9 · 16x"},
];
const MODS = [
 {name:"Sodium",desc:"Otimização de renderização para Fabric.",url:"https://modrinth.com/mod/sodium"},
 {name:"Lithium",desc:"Otimizações de lógica e ticks.",url:"https://modrinth.com/mod/lithium"},
 {name:"FerriteCore",desc:"Reduz uso de memória.",url:"https://modrinth.com/mod/ferrite-core"},
 {name:"Entity Culling",desc:"Evita renderizar entidades ocultas.",url:"https://modrinth.com/mod/entityculling"},
];
export function MinecraftStudio() {
 const [tab,setTab]=useState<"profiles"|"packs"|"mods"|"craft">("profiles");
 const [item,setItem]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [profile,setProfile]=useState("balanced");
 const [recipe,setRecipe]=useState<Recipe|null>(null);
 const found=useMemo(()=>RECIPES.filter(r=>r.name.toLowerCase().includes(item.trim().toLowerCase())),[item]);
 const run=async(fn:()=>Promise<unknown>,ok:string)=>{setBusy(true);setMessage("");try{const result=await fn();setMessage(ok+(typeof result==="string"?": "+result:""));}catch(e){setMessage(e instanceof Error?e.message:"Não foi possível concluir a operação.");}finally{setBusy(false);}};
 const apply=()=>run(async()=>{if(!window.kids?.minecraftApplyProfile)throw new Error("Disponível no aplicativo Windows instalado.");return window.kids.minecraftApplyProfile(profile);},"Configuração aplicada. Backup criado");
 const importPack=()=>run(async()=>{if(!window.kids?.minecraftImportFile)throw new Error("Importação disponível no aplicativo Windows instalado.");return window.kids.minecraftImportFile("resourcepack");},"Textura instalada");
 const importMod=()=>run(async()=>{if(!window.kids?.minecraftImportFile)throw new Error("Importação disponível no aplicativo Windows instalado.");return window.kids.minecraftImportFile("mod");},"Mod instalado");
 return <section className="space-y-5">
  <div className="rounded-xl border border-red-500/30 bg-[#100708]/95 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs tracking-[.3em] text-red-300">KIDS GAMING HUB / MINECRAFT</p><h2 className="font-display text-3xl text-white">MINECRAFT CONTROL</h2><p className="text-sm text-zinc-400">Perfis gráficos, packs PvP 1.8.9 para Bedwars, mods e crafting.</p></div><span className="rounded border border-red-500/40 px-3 py-2 text-xs text-red-300">JAVA EDITION</span></div>
   <div className="mt-5 flex flex-wrap gap-2">{([["profiles","Perfis"],["packs","Texturas"],["mods","Mods"],["craft","Crafting"]] as const).map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`rounded-md border px-4 py-2 text-sm font-semibold ${tab===id?"border-red-400 bg-red-700 text-white":"border-zinc-700 bg-black/50 text-zinc-300 hover:border-red-500"}`}>{label}</button>)}</div>
  </div>
  {tab==="profiles"&&<div className="grid gap-4 md:grid-cols-3">{[
   {id:"quality",title:"Alta qualidade",tag:"SURVIVAL",desc:"Prioriza qualidade visual e distância de renderização.",details:"Gráficos bonitos · Distância 16 chunks · Iluminação suave"},
   {id:"balanced",title:"Média qualidade",tag:"EQUILIBRADO",desc:"Equilíbrio entre imagem fluida e FPS.",details:"Gráficos rápidos · Distância 10 chunks · FPS ilimitado"},
   {id:"pvp",title:"FPS máximo",tag:"PVP",desc:"Reduz efeitos e distância para priorizar desempenho.",details:"Gráficos rápidos · 6 chunks · Partículas mínimas"},
  ].map(p=><article key={p.id} className={`rounded-xl border p-5 ${profile===p.id?"border-red-400 bg-red-950/30":"border-zinc-800 bg-black/65"}`}><Zap className="mb-3 text-red-400"/><p className="text-xs tracking-widest text-red-300">{p.tag}</p><h3 className="my-2 font-display text-2xl text-white">{p.title}</h3><p className="text-sm text-zinc-300">{p.desc}</p><p className="mt-3 text-xs text-zinc-500">{p.details}</p><button onClick={()=>setProfile(p.id)} className="mt-4 w-full rounded border border-red-500/50 px-3 py-2 text-sm text-red-200 hover:bg-red-900/40">{profile===p.id?"Selecionado":"Selecionar perfil"}</button></article>)}
   <div className="md:col-span-3 rounded-xl border border-red-500/20 bg-black/60 p-4"><button disabled={busy} onClick={apply} className="rounded-md bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-50">{busy?"Aplicando...":"Aplicar configurações no Minecraft"}</button><p className="mt-2 text-xs text-zinc-500">Feche o Minecraft antes de aplicar. O arquivo options.txt será salvo com backup para permitir restauração.</p></div>
  </div>}
  {tab==="packs"&&<div className="space-y-4"><div className="grid gap-3 md:grid-cols-2">{PACKS.map(p=><article key={p.name} className="rounded-xl border border-zinc-800 bg-black/65 p-4"><div className="flex items-center gap-2"><Image className="text-red-400"/><h3 className="font-display text-xl text-white">{p.name}</h3></div><p className="my-1 text-[11px] uppercase tracking-wider text-red-300">{p.version}</p><p className="my-2 text-sm text-zinc-400">{p.desc}</p><a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-red-200">Ver e baixar pack <ExternalLink size={14}/></a></article>)}</div><div className="rounded-xl border border-red-500/25 bg-black/60 p-4"><button disabled={busy} onClick={importPack} className="inline-flex items-center gap-2 rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50"><PackagePlus size={17}/> Importar ZIP de textura</button><p className="mt-2 text-xs text-zinc-500">Baixe o arquivo .zip do pack e importe aqui. O painel copia para .minecraft/resourcepacks; depois selecione-o em Opções → Pacotes de recursos.</p></div></div>}
  {tab==="mods"&&<div className="space-y-4"><div className="grid gap-3 md:grid-cols-2">{MODS.map(m=><article key={m.name} className="rounded-xl border border-zinc-800 bg-black/65 p-4"><div className="flex items-center gap-2"><PackagePlus className="text-red-400"/><h3 className="font-display text-xl text-white">{m.name}</h3></div><p className="my-2 text-sm text-zinc-400">{m.desc}</p><a href={m.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-red-300">Baixar no Modrinth <ExternalLink size={14}/></a></article>)}</div><div className="rounded-xl border border-red-500/25 bg-black/60 p-4"><button disabled={busy} onClick={importMod} className="inline-flex items-center gap-2 rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50"><PackagePlus size={17}/> Importar arquivo .JAR</button><p className="mt-2 text-xs text-zinc-500">Instale o Fabric ou Forge compatível antes. O painel copia o .jar para .minecraft/mods e não instala loaders automaticamente.</p></div></div>}
  {tab==="craft"&&<CraftingCatalog/>}
  {message&&<p role="status" className="rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-100">{message}</p>}
 </section>;
}
