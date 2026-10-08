export type OptimizationMode = "balance" | "max-invest";
export interface PortfolioAsset { ticker: string; price: number; quantity: number; targetWeight: number; }
export interface PurchaseSuggestion extends PortfolioAsset { currentValue: number; buyQuantity: number; buyValue: number; finalQuantity: number; finalValue: number; finalWeight: number; difference: number; }
export interface OptimizationResult { suggestions: PurchaseSuggestion[]; invested: number; leftover: number; finalPortfolioValue: number; weightError: number; evaluatedCombinations: number; usedFallback: boolean; }
