import { describe, expect, it } from "vitest";
import { optimizePortfolio } from "./optimizer";
import type { PortfolioAsset } from "@/types/portfolio";

const makeAssets = (prices: number[], quantities = [0, 0, 0, 0], weights = [0.4, 0.3, 0.2, 0.1]): PortfolioAsset[] =>
  ["ITUB4", "BPAC11", "BBDC4", "BBAS3"].map((ticker, index) => ({ ticker, price: prices[index], quantity: quantities[index], targetWeight: weights[index] }));

describe("optimizePortfolio", () => {
  it("distribui uma carteira vazia respeitando orçamento e inteiros", () => {
    const result = optimizePortfolio(makeAssets([10, 10, 10, 10]), 100, "balance");
    expect(result).not.toBeNull();
    expect(result!.invested).toBeLessThanOrEqual(100);
    expect(result!.suggestions.map((item) => item.buyQuantity)).toEqual([4, 3, 2, 1]);
  });

  it("mantém o erro baixo quando a carteira já está nos pesos", () => {
    const result = optimizePortfolio(makeAssets([40, 30, 20, 10], [1, 1, 1, 1]), 40, "balance");
    expect(result).not.toBeNull();
    expect(result!.weightError).toBeLessThan(0.03);
  });

  it("evita comprar o ativo que já está muito acima da meta", () => {
    const assets = makeAssets([10, 10, 10, 10], [1, 1, 1, 10], [0.25, 0.25, 0.25, 0.25]);
    const result = optimizePortfolio(assets, 30, "balance");
    expect(result!.suggestions[3].buyQuantity).toBe(0);
    expect(result!.suggestions.slice(0, 3).some((item) => item.buyQuantity > 0)).toBe(true);
  });

  it("retorna compra zero quando o aporte não compra nenhuma ação", () => {
    const result = optimizePortfolio(makeAssets([50, 60, 70, 80]), 20, "balance");
    expect(result!.invested).toBe(0);
    expect(result!.suggestions.every((item) => item.buyQuantity === 0)).toBe(true);
  });

  it("o modo usar o máximo nunca deixa mais sobra que o melhor equilíbrio", () => {
    const assets = makeAssets([37, 61, 29, 53], [8, 0, 2, 1]);
    const balanced = optimizePortfolio(assets, 200, "balance")!;
    const maxInvest = optimizePortfolio(assets, 200, "max-invest")!;
    expect(maxInvest.leftover).toBeLessThanOrEqual(balanced.leftover + 0.001);
    expect(maxInvest.invested).toBeGreaterThanOrEqual(balanced.invested - 0.001);
  });
});
