import { createFileRoute } from "@tanstack/react-router";
import { KidsPanel } from "@/components/KidsPanel";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KIDS — Painel de Jogos | CS2 Configs" },
      { name: "description", content: "Painel KIDS: DPI, sensibilidade, miras e configs de pro players para CS2." },
      { property: "og:title", content: "KIDS — Painel de Jogos" },
      { property: "og:description", content: "Configs de pro players, miras e otimização para CS2." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KidsPanel,
});

