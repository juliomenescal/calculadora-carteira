"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Landmark, RotateCcw, ShieldCheck } from "lucide-react";
import { AssetCard } from "./AssetCard";
import { Results } from "./Results";
import { optimizePortfolio } from "@/lib/optimizer";
import { parseDecimal } from "@/lib/formatters";
import { loadPortfolio, savePortfolio } from "@/lib/storage";
import type { OptimizationMode, OptimizationResult, PortfolioAsset } from "@/types/portfolio";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const DEFAULT_ASSETS: PortfolioAsset[] = [
  { ticker: "ITUB4", price: 0, quantity: 0, targetWeight: 0.4 },
  { ticker: "BPAC11", price: 0, quantity: 0, targetWeight: 0.3 },
  { ticker: "BBDC4", price: 0, quantity: 0, targetWeight: 0.2 },
  { ticker: "BBAS3", price: 0, quantity: 0, targetWeight: 0.1 },
];

type AssetForm = { ticker: string; price: string; quantity: string; targetWeight: string };
const toForms = (assets: PortfolioAsset[]): AssetForm[] => assets.map((asset) => ({ ticker: asset.ticker, price: asset.price ? String(asset.price).replace(".", ",") : "", quantity: String(asset.quantity), targetWeight: String(asset.targetWeight * 100).replace(".", ",") }));

export function InvestmentCalculator() {
  const [budget, setBudget] = useState("400,00");
  const [assets, setAssets] = useState<AssetForm[]>(() => toForms(DEFAULT_ASSETS));
  const [mode, setMode] = useState<OptimizationMode>("balance");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setAssets(toForms(loadPortfolio(DEFAULT_ASSETS))); setHydrated(true); }, []);

  const parsedAssets = useMemo(() => assets.map((asset) => ({ ticker: asset.ticker, price: parseDecimal(asset.price), quantity: Number(asset.quantity), targetWeight: parseDecimal(asset.targetWeight) / 100 })), [assets]);
  const weightTotal = parsedAssets.reduce((sum, asset) => sum + (Number.isFinite(asset.targetWeight) ? asset.targetWeight : 0), 0);
  const weightsValid = Math.abs(weightTotal - 1) < 0.0001;

  useEffect(() => {
    if (!hydrated) return;
    const valid = parsedAssets.every((asset) => Number.isFinite(asset.quantity) && asset.quantity >= 0 && Number.isInteger(asset.quantity) && Number.isFinite(asset.targetWeight) && asset.targetWeight >= 0);
    if (valid) savePortfolio(parsedAssets.map((asset) => ({ ...asset, price: 0 })));
  }, [hydrated, parsedAssets]);

  function updateAsset(index: number, field: "price" | "quantity" | "targetWeight", value: string) {
    setAssets((current) => current.map((asset, assetIndex) => assetIndex === index ? { ...asset, [field]: value } : asset));
    setResult(null);
    setError("");
  }

  function validateAndCalculate(showErrors = true) {
    const available = parseDecimal(budget);
    if (!Number.isFinite(available) || available <= 0) {
      if (showErrors) setError("Informe um valor de aporte maior que zero.");
      return null;
    }
    if (parsedAssets.some((asset) => !Number.isFinite(asset.price) || asset.price <= 0 || !Number.isFinite(asset.quantity) || asset.quantity < 0 || !Number.isInteger(asset.quantity) || !Number.isFinite(asset.targetWeight) || asset.targetWeight < 0)) {
      if (showErrors) setError("Preencha preços, quantidades e pesos com valores válidos e não negativos.");
      return null;
    }
    if (!weightsValid) {
      if (showErrors) setError(`A soma dos pesos deve ser 100%. Agora ela está em ${(weightTotal * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%.`);
      return null;
    }
    if (parsedAssets.every((asset) => asset.price > available)) {
      if (showErrors) setError("O valor disponível não é suficiente para comprar nenhuma ação.");
      return null;
    }
    const calculated = optimizePortfolio(parsedAssets, available, mode);
    if (!calculated) {
      if (showErrors) setError("Não foi possível calcular uma combinação válida. Revise os valores informados.");
      return null;
    }
    setError("");
    setResult(calculated);
    setTimeout(() => document.getElementById("results-title")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    return calculated;
  }

  function confirmPurchase() {
    if (!result) return;
    const updated = parsedAssets.map((asset, index) => ({ ...asset, quantity: asset.quantity + result.suggestions[index].buyQuantity }));
    savePortfolio(updated);
    setAssets((current) => current.map((asset, index) => ({ ...asset, quantity: String(updated[index].quantity) })));
    setResult(null);
  }

  function resetPortfolio() {
    const reset = toForms(DEFAULT_ASSETS);
    setAssets(reset);
    savePortfolio(DEFAULT_ASSETS);
    setResult(null);
    setError("");
  }

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "calculate_portfolio_contribution",
      title: "Calcular aporte",
      description: "Calcula e exibe a sugestão de compra usando os valores preenchidos na calculadora.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => {
        const calculated = validateAndCalculate(false);
        if (!calculated) throw new Error("Os dados preenchidos não formam um cálculo válido.");
        return { invested: calculated.invested, leftover: calculated.leftover, purchases: calculated.suggestions.map(({ ticker, buyQuantity }) => ({ ticker, buyQuantity })) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-7 sm:px-6 sm:pt-12">
      <header className="mb-7 flex items-start gap-3"><div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff7900] text-[#1a0c00]"><Landmark className="h-6 w-6" aria-hidden="true" /></div><div><h1 className="text-2xl font-black tracking-[-.035em] sm:text-3xl">Calculadora de Aportes</h1><p className="mt-1 text-sm leading-relaxed text-[#9d9d9d]">Reequilibre sua carteira comprando ações inteiras.</p></div></header>

      <section className="rounded-2xl border border-[#ff7900]/18 bg-gradient-to-br from-[#2a231d] to-[#222222] p-4 sm:p-5">
        <label className="text-sm font-semibold text-[#b8c0c9]" htmlFor="budget">Quanto você tem para aportar?</label>
        <div className="relative mt-2"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#9d9d9d]">R$</span><input id="budget" inputMode="decimal" min="0" value={budget} onChange={(event) => { setBudget(event.target.value); setResult(null); setError(""); }} className="h-16 w-full rounded-2xl border border-[#403a35] bg-[#191919] pl-14 pr-4 text-2xl font-extrabold tabular-nums text-white outline-none transition focus:border-[#ff7900] focus:ring-2 focus:ring-[#ff7900]/20" placeholder="400,00" /></div>
      </section>

      <div className="mt-6 grid gap-3">{assets.map((asset, index) => <AssetCard key={asset.ticker} {...asset} onChange={(field, value) => updateAsset(index, field, value)} />)}</div>

      <div className={`mt-4 flex items-center justify-between rounded-xl border px-3.5 py-3 text-sm ${weightsValid ? "border-[#ff7900]/20 bg-[#ff7900]/8 text-[#ffb36b]" : "border-[#ef7279]/25 bg-[#ef7279]/8 text-[#ff9ba0]"}`}><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Soma dos pesos</span><strong>{(weightTotal * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</strong></div>

      <fieldset className="mt-6"><legend className="text-sm font-semibold text-[#c4c4c4]">Como otimizar?</legend><div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-[#222222] p-1.5"><label className={`cursor-pointer rounded-xl px-3 py-3 text-center text-sm font-bold transition ${mode === "balance" ? "bg-[#3a2b20] text-[#ffad61] shadow-sm" : "text-[#9d9d9d]"}`}><input type="radio" name="mode" value="balance" checked={mode === "balance"} onChange={() => { setMode("balance"); setResult(null); }} className="sr-only" />Melhor equilíbrio</label><label className={`cursor-pointer rounded-xl px-3 py-3 text-center text-sm font-bold transition ${mode === "max-invest" ? "bg-[#3a2b20] text-[#ffad61] shadow-sm" : "text-[#9d9d9d]"}`}><input type="radio" name="mode" value="max-invest" checked={mode === "max-invest"} onChange={() => { setMode("max-invest"); setResult(null); }} className="sr-only" />Usar o máximo</label></div><p className="mt-2 text-xs leading-relaxed text-[#888888]">{mode === "balance" ? "Prioriza os pesos-alvo e evita sobras quando isso não piora demais o equilíbrio." : "Minimiza a sobra primeiro e usa o equilíbrio dos pesos como desempate."}</p></fieldset>

      {error && <p role="alert" className="mt-5 rounded-xl border border-[#ef7279]/25 bg-[#ef7279]/8 px-4 py-3 text-sm leading-relaxed text-[#ffabb0]">{error}</p>}
      <button type="button" onClick={() => validateAndCalculate()} className="mt-6 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff7900] px-5 text-base font-black tracking-wide text-[#1a0c00] shadow-[0_10px_30px_rgba(255,121,0,.18)] transition hover:bg-[#ff8d24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc080] active:translate-y-px"><Calculator className="h-5 w-5" />CALCULAR APORTE</button>

      {result && <Results result={result} onConfirm={() => document.getElementById("confirm-purchase")?.click()} />}

      <div className="mt-8 flex justify-center">
        <AlertDialog><AlertDialogTrigger asChild><button type="button" className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-[#8f99a5] transition hover:bg-white/5 hover:text-white"><RotateCcw className="h-4 w-4" />Resetar carteira</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Resetar a carteira?</AlertDialogTitle><AlertDialogDescription>As quantidades serão zeradas e os pesos voltarão para 40%, 30%, 20% e 10%. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={resetPortfolio}>Resetar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>

      <AlertDialog><AlertDialogTrigger asChild><button id="confirm-purchase" type="button" className="hidden">Confirmar compra</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar esta compra?</AlertDialogTitle><AlertDialogDescription>As quantidades sugeridas serão adicionadas à sua carteira e salvas neste dispositivo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmPurchase}>Confirmar e atualizar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <footer className="mt-10 border-t border-white/7 pt-6 text-center text-xs leading-relaxed text-[#68727d]">Ferramenta pessoal de cálculo e rebalanceamento.<br />Não constitui recomendação de investimento.</footer>
    </div>
  );
}

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: { name: string; title?: string; description: string; inputSchema: object; annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean }; execute: (input: unknown) => unknown }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}
