import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { OptimizationResult } from "@/types/portfolio";
import { PortfolioSummary } from "./PortfolioSummary";

export function Results({ result, onConfirm }: { result: OptimizationResult; onConfirm: () => void }) {
  return (
    <section className="mt-10 border-t border-white/8 pt-8" aria-labelledby="results-title">
      <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff7900]">Resultado</p><h2 id="results-title" className="mt-1 text-2xl font-extrabold tracking-tight">Sugestão de compra</h2></div><span className="text-right text-xs text-[#7f8995]">{result.evaluatedCombinations.toLocaleString("pt-BR")} combinações</span></div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-white/8 bg-[#222222]">
        {result.suggestions.map((item) => <div key={item.ticker} className="flex items-center justify-between gap-4 border-b border-white/7 p-4 last:border-b-0"><div><h3 className="font-extrabold">{item.ticker}</h3><p className="mt-1 text-sm text-[#8f99a5]">Comprar <strong className="text-white">{item.buyQuantity}</strong> {item.ticker === "BPAC11" ? "units" : item.buyQuantity === 1 ? "ação" : "ações"}</p></div><strong className="text-lg tabular-nums">{formatCurrency(item.buyValue)}</strong></div>)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#222222] p-4"><span className="text-sm text-[#8f99a5]">Total investido</span><strong className="mt-1 block text-xl tabular-nums">{formatCurrency(result.invested)}</strong></div><div className="rounded-2xl bg-[#222222] p-4"><span className="text-sm text-[#8f99a5]">Sobra</span><strong className="mt-1 block text-xl tabular-nums">{formatCurrency(result.leftover)}</strong></div></div>
      {result.usedFallback && <p className="mt-3 text-xs leading-relaxed text-[#7f8995]">Para manter o cálculo rápido, foi usada uma busca otimizada para este valor de aporte.</p>}
      <PortfolioSummary suggestions={result.suggestions} />
      <button type="button" onClick={onConfirm} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#ff7900]/30 bg-[#ff7900]/12 px-5 text-base font-bold text-[#ffad61] transition hover:bg-[#ff7900]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7900]"><Check className="h-5 w-5" />Confirmar compra e atualizar carteira</button>
    </section>
  );
}
