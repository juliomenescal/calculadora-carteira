import type { PortfolioAsset } from "@/types/portfolio";
const STORAGE_KEY = "carteira-bancos:v1";
type StoredPortfolio = Pick<PortfolioAsset, "ticker" | "quantity" | "targetWeight">[];

export function loadPortfolio(defaults: PortfolioAsset[]): PortfolioAsset[] {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as StoredPortfolio | null;
    if (!Array.isArray(stored)) return defaults;
    return defaults.map((asset) => {
      const match = stored.find((item) => item.ticker === asset.ticker);
      return match && Number.isFinite(match.quantity) && Number.isFinite(match.targetWeight)
        ? { ...asset, quantity: Math.max(0, Math.floor(match.quantity)), targetWeight: Math.max(0, match.targetWeight) }
        : asset;
    });
  } catch { return defaults; }
}

export function savePortfolio(assets: PortfolioAsset[]) {
  if (typeof window === "undefined") return;
  const data: StoredPortfolio = assets.map(({ ticker, quantity, targetWeight }) => ({ ticker, quantity, targetWeight }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
