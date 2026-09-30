export type InfographicCategory = "value_chain" | "market_intelligence" | "live_fmc_intelligence";

export type VectorGraphicType =
  | "value_chain_pipeline"
  | "tam_sam_som_pyramid"
  | "competitive_matrix_2x2"
  | "market_share_ring"
  | "cost_waterfall"
  | "commodity_price_trends"
  | "retail_market_stats";

export interface ValueChainStage {
  id: string;
  name: string;
  subtext: string;
  metric: string;
  kpiLabel: string;
}

export interface TamSamSomTier {
  id: string;
  tier: "TAM" | "SAM" | "SOM";
  name: string;
  value: string;
  growth: string;
  description: string;
}

export interface CompetitorQuadrantItem {
  id: string;
  name: string;
  x: number; // 0 to 100
  y: number; // 0 to 100
  isUserBrand?: boolean;
  marketShare?: string;
  tier?: string;
}

export interface MarketShareSlice {
  id: string;
  name: string;
  percentage: number;
  value: string;
  color?: string;
}

export interface CostWaterfallBar {
  id: string;
  name: string;
  cost: number;
  percentage: string;
  isTotal?: boolean;
}

export interface FmcCommodityItem {
  id: string;
  name: string;
  symbol: string;
  exchange: string;
  spotPrice: string;
  unit: string;
  change24h: string;
  changePositive: boolean;
  volatility: "low" | "medium" | "high";
  impactCategory: string;
  alertNote?: string;
}

export interface FmcRetailMetric {
  id: string;
  label: string;
  value: string;
  period: string;
  benchmark: string;
  trend: "up" | "down" | "neutral";
  source: string;
}

export interface FmcCategoryVelocity {
  category: string;
  growthYoY: string;
  tamValue: string;
  penetration: string;
  hotSegment: string;
}

export interface FmcMarketSnapshot {
  timestamp: string;
  sourceProvider: string;
  status: "live_connected" | "cached_fallback";
  commodities: FmcCommodityItem[];
  retailMetrics: FmcRetailMetric[];
  categories: FmcCategoryVelocity[];
  headlineSummary: string;
}

export interface SlideVectorGraphic {
  type: VectorGraphicType;
  title: string;
  subtitle?: string;
  category: InfographicCategory;
  themeAccent?: string;
  // Specific data payloads
  stages?: ValueChainStage[];
  tiers?: TamSamSomTier[];
  competitors?: CompetitorQuadrantItem[];
  slices?: MarketShareSlice[];
  bars?: CostWaterfallBar[];
  commodities?: FmcCommodityItem[];
  retailMetrics?: FmcRetailMetric[];
  kbSourceReference?: string;
}

export interface InfographicTemplateDef {
  id: VectorGraphicType;
  title: string;
  subtitle: string;
  category: InfographicCategory;
  description: string;
  kbSourceDefault: string;
  hotkeyNum: number;
  defaultData: SlideVectorGraphic;
}
