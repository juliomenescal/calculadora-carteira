interface AssetCardProps {
  ticker: string;
  price: string;
  quantity: string;
  targetWeight: string;
  onChange: (field: "price" | "quantity" | "targetWeight", value: string) => void;
}

const inputClass = "mt-2 h-12 w-full rounded-xl border border-[#3b3b3b] bg-[#191919] px-3.5 text-base text-white outline-none transition focus:border-[#ff7900] focus:ring-2 focus:ring-[#ff7900]/20";

export function AssetCard({ ticker, price, quantity, targetWeight, onChange }: AssetCardProps) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#222222] p-4 shadow-[0_12px_35px_rgba(0,0,0,.14)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight text-white">{ticker}</h2>
        <span className="rounded-full bg-[#ff7900]/12 px-2.5 py-1 text-xs font-bold text-[#ffad61]">B3</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-[#b8c0c9]">
          Preço atual
          <div className="relative"><span className="absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-[#7f8995]">R$</span>
            <input aria-label={`Preço atual de ${ticker}`} inputMode="decimal" min="0" className={`${inputClass} pl-11`} placeholder="0,00" value={price} onChange={(event) => onChange("price", event.target.value)} />
          </div>
        </label>
        <label className="text-sm font-medium text-[#b8c0c9]">
          Quantidade atual
          <input aria-label={`Quantidade atual de ${ticker}`} inputMode="numeric" min="0" step="1" className={inputClass} placeholder="0" value={quantity} onChange={(event) => onChange("quantity", event.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="text-sm font-medium text-[#b8c0c9]">
          Peso-alvo
          <div className="relative"><input aria-label={`Peso-alvo de ${ticker}`} inputMode="decimal" min="0" max="100" className={`${inputClass} pr-10`} placeholder="0" value={targetWeight} onChange={(event) => onChange("targetWeight", event.target.value)} /><span className="absolute right-3.5 top-1/2 mt-1 -translate-y-1/2 text-[#7f8995]">%</span></div>
        </label>
      </div>
    </section>
  );
}
