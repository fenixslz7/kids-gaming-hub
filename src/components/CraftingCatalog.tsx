import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, Loader2 } from "lucide-react";

type McItem = { id:number; name:string; displayName:string };
type Recipe = { inShape?: (number|null)[][]; ingredients?: (number|null)[]; result:{id:number;count?:number} };
type RecipeMap = Record<string, Recipe[]>;
const VERSIONS = ["1.21.4","1.21.3","1.21.1","1.20.4","1.19.4","1.18.2","1.16.5","1.12.2"];
const ASSET_VERSION = "1.21.4";
const itemIcon = (name:string) => `https://mcasset.cloud/${ASSET_VERSION}/assets/minecraft/textures/item/${name}.png`;
export function CraftingCatalog(){
 const [version,setVersion]=useState("1.21.4");
 const [items,setItems]=useState<McItem[]>([]);
 const [recipes,setRecipes]=useState<RecipeMap>({});
 const [query,setQuery]=useState("");
 const [selected,setSelected]=useState<McItem|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let alive=true;setLoading(true);setError("");setSelected(null);
  Promise.all([
   fetch(`https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/${version}/items.json`).then(r=>{if(!r.ok)throw new Error("Versão sem catálogo de itens.");return r.json();}),
   fetch(`https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/${version}/recipes.json`).then(r=>{if(!r.ok)throw new Error("Não foi possível carregar as receitas desta versão.");return r.json();})
  ]).then(([i,r])=>{if(alive){setItems(i.filter((x:McItem)=>x.id!==0));setRecipes(r);}}).catch(e=>{if(alive)setError(e instanceof Error?e.message:"Erro ao carregar catálogo.");}).finally(()=>{if(alive)setLoading(false);});
  return ()=>{alive=false;};
 },[version]);
 const names=useMemo(()=>new Map(items.map(i=>[i.id,i])),[items]);
 const craftable=useMemo(()=>items.filter(i=>recipes[String(i.id)]?.length),[items,recipes]);
 const results=useMemo(()=>craftable.filter(i=>i.displayName.toLowerCase().includes(query.toLowerCase())||i.name.includes(query.toLowerCase())).slice(0,100),[craftable,query]);
 const recipe=selected?recipes[String(selected.id)]?.[0]:undefined;
 const shape=recipe?.inShape??(recipe?.ingredients?.length?[recipe.ingredients]:[]);
 const rows=shape.length?shape:[];
 const grid=rows.flat();
 const maxCols=Math.max(1,...rows.map(r=>r.length));
 const maxRows=Math.max(1,rows.length);
 return <div className="space-y-4 rounded-xl border border-red-500/25 bg-black/70 p-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-2xl text-white">TODAS AS RECEITAS</h3><p className="text-sm text-zinc-400">Catálogo completo de receitas de crafting vanilla por versão do Minecraft Java.</p></div><select value={version} onChange={e=>setVersion(e.target.value)} className="rounded border border-zinc-700 bg-zinc-950 p-2 text-white">{VERSIONS.map(v=><option key={v}>{v}</option>)}</select></div>
  <div className="relative"><Search className="absolute left-3 top-3 text-zinc-500" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar qualquer item craftável..." className="w-full rounded border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-3 text-white outline-none focus:border-red-500"/></div>
  {loading?<p className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="animate-spin"/> Carregando itens e receitas da versão {version}...</p>:error?<p role="alert" className="text-sm text-red-300">{error} Verifique sua conexão e tente novamente.</p>:<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
   <div><p className="mb-3 text-xs text-zinc-500">{craftable.length} itens com receita nesta versão · mostrando até 100 resultados</p><div className="grid max-h-[560px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">{results.map(i=><button key={i.id} onClick={()=>setSelected(i)} className={`rounded-lg border p-2 text-center hover:border-red-500 ${selected?.id===i.id?"border-red-400 bg-red-950/40":"border-zinc-800 bg-zinc-950/80"}`}><img src={itemIcon(i.name)} alt="" loading="lazy" className="mx-auto mb-1 h-10 w-10 object-contain image-render-pixel" onError={e=>{(e.currentTarget as HTMLImageElement).style.visibility="hidden";}}/><span className="block text-xs text-zinc-200">{i.displayName}</span></button>)}</div></div>
   <aside className="rounded-lg border border-red-500/20 bg-zinc-950/80 p-4">{selected&&recipe?<><div className="flex items-center gap-3"><img src={itemIcon(selected.name)} alt={selected.displayName} className="h-12 w-12 object-contain" onError={e=>{(e.currentTarget as HTMLImageElement).style.visibility="hidden";}}/><div><h4 className="font-semibold text-white">{selected.displayName}</h4><p className="text-xs text-zinc-500">Resultado: {recipe.result.count??1} unidade(s)</p></div></div><p className="my-3 text-xs uppercase tracking-wider text-red-300">Receita na bancada</p><div className="mx-auto grid max-w-[210px] gap-1" style={{gridTemplateColumns:`repeat(${maxCols},minmax(0,1fr))`}}>{rows.flatMap((row,ri)=>Array.from({length:maxCols},(_,ci)=>{const id=row[ci]??null;const ingredient=id===null?undefined:names.get(id);return <div key={ri+"-"+ci} title={ingredient?.displayName??"Vazio"} className="flex aspect-square items-center justify-center rounded border border-zinc-700 bg-zinc-900 p-1">{ingredient?<img src={itemIcon(ingredient.name)} alt={ingredient.displayName} className="h-full w-full object-contain" onError={e=>{(e.currentTarget as HTMLImageElement).style.visibility="hidden";}}/>:null}</div>}))}</div><p className="mt-4 text-xs font-semibold text-zinc-300">Ingredientes</p><ul className="mt-2 space-y-1 text-xs text-zinc-400">{Array.from(new Set(grid.filter((id):id is number=>id!==null))).map(id=><li key={id} className="flex items-center gap-2"><img src={itemIcon(names.get(id)?.name??"barrier")} className="h-6 w-6 object-contain" alt=""/>{names.get(id)?.displayName??`Item #${id}`}</li>)}</ul>{(recipes[String(selected.id)]?.length ?? 0)>1&&<p className="mt-3 text-xs text-zinc-500">Este item possui {recipes[String(selected.id)]?.length ?? 1} receitas/variantes. Exibindo a primeira.</p>}</>:<div className="py-12 text-center text-sm text-zinc-500">Selecione um item para ver a imagem, a receita e os ingredientes.</div>}</aside>
  </div>}
  <p className="text-[11px] text-zinc-600">Dados de itens e receitas: PrismarineJS/minecraft-data. Ícones PNG: Minecraft assets via mcasset.cloud. Receitas especiais de fornalha, bigorna, ferraria e outras estações podem não aparecer nesta grade de crafting.</p>
 </div>;
}
