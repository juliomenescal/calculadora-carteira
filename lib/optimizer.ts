import type { OptimizationMode, OptimizationResult, PortfolioAsset } from "@/types/portfolio";

export const LEFTOVER_LAMBDA = 0.08;
export const MAX_COMBINATIONS = 600_000;
type Candidate = { buys: number[]; cost: number; error: number; score: number };

function weightError(assets: PortfolioAsset[], buys: number[]) {
  const values = assets.map((asset, index) => asset.quantity * asset.price + buys[index] * asset.price);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return assets.reduce((sum, asset) => sum + asset.targetWeight ** 2, 0);
  return values.reduce((sum, value, index) => sum + (value / total - assets[index].targetWeight) ** 2, 0);
}

function isBetter(candidate: Candidate, best: Candidate | null, mode: OptimizationMode) {
  if (!best) return true;
  if (mode === "max-invest") {
    if (Math.abs(candidate.cost - best.cost) > 0.005) return candidate.cost > best.cost;
    return candidate.error < best.error;
  }
  if (Math.abs(candidate.score - best.score) > 1e-12) return candidate.score < best.score;
  return candidate.cost > best.cost;
}

function evaluate(assets: PortfolioAsset[], buys: number[], cost: number, budget: number, mode: OptimizationMode) {
  const error = weightError(assets, buys);
  const leftoverRatio = (budget - cost) / budget;
  return { buys: [...buys], cost, error, score: mode === "balance" ? error + LEFTOVER_LAMBDA * leftoverRatio ** 2 : -cost };
}

export function optimizePortfolio(assets: PortfolioAsset[], budget: number, mode: OptimizationMode): OptimizationResult | null {
  if (!Number.isFinite(budget) || budget <= 0 || assets.length === 0) return null;
  if (assets.some((asset) => !Number.isFinite(asset.price) || asset.price <= 0)) return null;
  const limits = assets.map((asset) => Math.floor(budget / asset.price));
  const theoreticalCount = limits.reduce((count, limit) => count * (limit + 1), 1);
  let best: Candidate | null = null;
  let evaluated = 0;
  let usedFallback = false;

  const consider = (buys: number[], cost: number) => {
    const candidate = evaluate(assets, buys, cost, budget, mode);
    evaluated += 1;
    if (isBetter(candidate, best, mode)) best = candidate;
  };

  if (theoreticalCount <= MAX_COMBINATIONS) {
    const buys = Array(assets.length).fill(0);
    const search = (index: number, cost: number) => {
      if (index === assets.length) { consider(buys, cost); return; }
      const max = Math.floor((budget - cost + 1e-9) / assets[index].price);
      for (let quantity = 0; quantity <= max; quantity += 1) {
        buys[index] = quantity;
        search(index + 1, cost + quantity * assets[index].price);
      }
    };
    search(0, 0);
  } else {
    usedFallback = true;
    const currentValue = assets.reduce((sum, asset) => sum + asset.quantity * asset.price, 0);
    const targetTotal = currentValue + budget;
    const starts: number[][] = [
      Array(assets.length).fill(0),
      assets.map((asset) => Math.max(0, Math.floor((targetTotal * asset.targetWeight - asset.quantity * asset.price) / asset.price))),
    ];
    for (let seed = 0; seed < assets.length; seed += 1) {
      const greedy = Array(assets.length).fill(0);
      let remaining = budget;
      for (let step = 0; step < 100_000; step += 1) {
        let chosen = -1;
        let chosenError = Number.POSITIVE_INFINITY;
        assets.forEach((asset, index) => {
          if (asset.price <= remaining + 1e-9) {
            greedy[index] += 1;
            const error = weightError(assets, greedy);
            greedy[index] -= 1;
            if (error < chosenError || (error === chosenError && index === seed)) { chosen = index; chosenError = error; }
          }
        });
        if (chosen < 0) break;
        greedy[chosen] += 1;
        remaining -= assets[chosen].price;
      }
      starts.push(greedy);
    }

    for (const start of starts) {
      let buys = start.map((quantity, index) => Math.min(quantity, limits[index]));
      let cost = buys.reduce((sum, quantity, index) => sum + quantity * assets[index].price, 0);
      while (cost > budget) {
        const index = buys.findIndex((quantity) => quantity > 0);
        if (index < 0) break;
        buys[index] -= 1;
        cost -= assets[index].price;
      }
      consider(buys, cost);
      let improved = true;
      while (improved && evaluated < 20_000) {
        improved = false;
        for (let from = -1; from < assets.length; from += 1) {
          for (let to = 0; to < assets.length; to += 1) {
            const next = [...buys];
            let nextCost = cost;
            if (from >= 0) {
              if (next[from] === 0) continue;
              next[from] -= 1;
              nextCost -= assets[from].price;
            }
            next[to] += 1;
            nextCost += assets[to].price;
            if (nextCost > budget + 1e-9) continue;
            const candidate = evaluate(assets, next, nextCost, budget, mode);
            evaluated += 1;
            if (isBetter(candidate, best, mode)) { best = candidate; buys = next; cost = nextCost; improved = true; }
          }
        }
      }
    }
  }

  if (!best) return null;
  const winner: Candidate = best;
  const finalValues = assets.map((asset, index) => asset.quantity * asset.price + winner.buys[index] * asset.price);
  const finalPortfolioValue = finalValues.reduce((sum, value) => sum + value, 0);
  return {
    suggestions: assets.map((asset, index) => {
      const buyQuantity = winner.buys[index];
      const finalWeight = finalPortfolioValue > 0 ? finalValues[index] / finalPortfolioValue : 0;
      return { ...asset, currentValue: asset.quantity * asset.price, buyQuantity, buyValue: buyQuantity * asset.price, finalQuantity: asset.quantity + buyQuantity, finalValue: finalValues[index], finalWeight, difference: finalWeight - asset.targetWeight };
    }),
    invested: winner.cost,
    leftover: Math.max(0, budget - winner.cost),
    finalPortfolioValue,
    weightError: winner.error,
    evaluatedCombinations: evaluated,
    usedFallback,
  };
}
