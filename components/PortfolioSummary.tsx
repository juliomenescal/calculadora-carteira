import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { PurchaseSuggestion } from "@/types/portfolio";

function statusFor(difference: number) {
  const absolute = Math.abs(difference);
  if (absolute <= 0.02) return { label: "Próximo da meta", dot: "bg-[#ff7900]", text: "text-[#ffad61]" };
  if (absolute <= 0.05) return { label: "Atenção", dot: "bg-[#f1c75b]", text: "text-[#f5d98e]" };
  return { label: "Distante da meta", dot: "bg-[#ef7279]", text: "text-[#ff9ba0]" };
}

export function PortfolioSummary({ suggestions }: { suggestions: PurchaseSuggestion[] }) {
  return (
    <section className="mt-8" aria-labelledby="portfolio-title">
      <h2 id="portfolio-title" className="text-xl font-bold text-white">Carteira após o aporte</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {suggestions.map((item) => {
          const status = statusFor(item.difference);
          return (
            <article key={item.ticker} className="rounded-2xl border border-white/8 bg-[#222222] p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-extrabold">{item.ticker}</h3><span className={`flex items-center gap-1.5 text-xs font-semibold ${status.text}`}><span className={`h-2 w-2 rounded-full ${status.dot}`} />{status.label}</span></div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><dt className="text-[#8f99a5]">Quantidade</dt><dd className="mt-0.5 font-semibold">{item.quantity} + {item.buyQuantity} = {item.finalQuantity}</dd></div>
                <div><dt className="text-[#8f99a5]">Valor final</dt><dd className="mt-0.5 font-semibold">{formatCurrency(item.finalValue)}</dd></div>
                <div><dt className="text-[#8f99a5]">Peso final</dt><dd className="mt-0.5 font-semibold">{formatPercent(item.finalWeight)}</dd></div>
                <div><dt className="text-[#8f99a5]">Meta</dt><dd className="mt-0.5 font-semibold">{formatPercent(item.targetWeight)}</dd></div>
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-white/7 pt-3 text-sm"><span className="text-[#8f99a5]">Diferença</span><strong className={status.text}>{item.difference >= 0 ? "+" : ""}{(item.difference * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} p.p.</strong></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
