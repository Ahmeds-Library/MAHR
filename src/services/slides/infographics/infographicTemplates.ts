import { InfographicTemplateDef, SlideVectorGraphic } from "./infographicTypes";

export const INFOGRAPHIC_TEMPLATES: InfographicTemplateDef[] = [
  {
    id: "value_chain_pipeline",
    title: "End-to-End Value Chain Pipeline",
    subtitle: "Upstream sourcing through downstream shelf fulfillment & consumer pantry",
    category: "value_chain",
    description: "Multi-node operational flow with lead times, automation rates, and OTIF checkpoints.",
    kbSourceDefault: "McKinsey Global Supply Chain Operations & FMC Benchmarks",
    hotkeyNum: 1,
    defaultData: {
      type: "value_chain_pipeline",
      title: "Synchronized FMCG Value Chain Pipeline",
      subtitle: "Integrated velocity model reducing inventory holding cycle by 16 days",
      category: "value_chain",
      kbSourceReference: "McKinsey & Gartner Supply Chain Top 25 (2026)",
      stages: [
        {
          id: "stage_1",
          name: "Smart Sourcing",
          subtext: "Hedged raw ingredients & packaging polymers",
          metric: "99.4%",
          kpiLabel: "Assurance SLA"
        },
        {
          id: "stage_2",
          name: "Agile Production",
          subtext: "High-speed modular batching & automated vision QA",
          metric: "<0.02%",
          kpiLabel: "Defect Rate"
        },
        {
          id: "stage_3",
          name: "Cold-Chain Fleet",
          subtext: "Decarbonized refrigerated micro-hubs",
          metric: "98.6%",
          kpiLabel: "OTIF Compliance"
        },
        {
          id: "stage_4",
          name: "Digital Shelf / Retail",
          subtext: "Algorithmic dynamic pricing & buy-box lock",
          metric: "4.2x",
          kpiLabel: "Retail Media ROAS"
        },
        {
          id: "stage_5",
          name: "Consumer Retention",
          subtext: "QR ingredient transparency & loyalty re-orders",
          metric: "+28%",
          kpiLabel: "Repeat Purchase"
        }
      ]
    }
  },
  {
    id: "tam_sam_som_pyramid",
    title: "TAM / SAM / SOM Market Sizing Pyramid",
    subtitle: "Hierarchical valuation layers: Total, Serviceable & Obtainable market",
    category: "market_intelligence",
    description: "Structured addressable market pyramid with quantitative sizing and growth trajectory.",
    kbSourceDefault: "NielsenIQ Global Retail Index & Statista Consumer Markets",
    hotkeyNum: 2,
    defaultData: {
      type: "tam_sam_som_pyramid",
      title: "Addressable Market Sizing Trajectory",
      subtitle: "Quantified market reach across target urban consumer corridors",
      category: "market_intelligence",
      kbSourceReference: "NielsenIQ & Euromonitor Market Intelligence 2026",
      tiers: [
        {
          id: "tier_tam",
          tier: "TAM",
          name: "Total Addressable Market",
          value: "$15.3 Trillion",
          growth: "+5.4% CAGR",
          description: "Global Consumer Packaged Goods & pantry consumables sector"
        },
        {
          id: "tier_sam",
          tier: "SAM",
          name: "Serviceable Addressable Market",
          value: "$3.82 Trillion",
          growth: "+9.1% CAGR",
          description: "Urban omnichannel grocery, modern trade & quick-commerce"
        },
        {
          id: "tier_som",
          tier: "SOM",
          name: "Serviceable Obtainable Market",
          value: "$485 Billion",
          growth: "+18.4% CAGR",
          description: "Premium sustainable wellness & high-velocity direct-to-shelf SKUs"
        }
      ]
    }
  },
  {
    id: "competitive_matrix_2x2",
    title: "Competitive Landscape 2x2 Matrix",
    subtitle: "Strategic positioning: Market Velocity vs. Direct-to-Consumer Agility",
    category: "market_intelligence",
    description: "Quadrant mapping incumbent conglomerates vs. agile D2C challenger brands.",
    kbSourceDefault: "Bain & Company Consumer Products Benchmark",
    hotkeyNum: 3,
    defaultData: {
      type: "competitive_matrix_2x2",
      title: "Omnichannel Competitive Positioning Matrix",
      subtitle: "Positioning our hybrid enterprise model against incumbents and niche entrants",
      category: "market_intelligence",
      kbSourceReference: "Bain & Company Strategic Analysis 2026",
      competitors: [
        { id: "c_1", name: "Legacy Conglomerates (Nestle/P&G)", x: 28, y: 78, marketShare: "38%", tier: "Incumbent Leaders" },
        { id: "c_2", name: "Private-Label Retailers", x: 22, y: 35, marketShare: "24%", tier: "Value Plays" },
        { id: "c_3", name: "Boutique D2C Challengers", x: 74, y: 25, marketShare: "6%", tier: "Niche Disrupters" },
        { id: "c_4", name: "MAHR Enterprise Brand", x: 82, y: 84, isUserBrand: true, marketShare: "14%", tier: "Category Leader" }
      ]
    }
  },
  {
    id: "market_share_ring",
    title: "Market Share Distribution Donut",
    subtitle: "Category market share breakdown with high-velocity segments",
    category: "market_intelligence",
    description: "Proportional radial vector chart showing competitor concentration and segment penetration.",
    kbSourceDefault: "Kantar Worldpanel Consumer Demand",
    hotkeyNum: 4,
    defaultData: {
      type: "market_share_ring",
      title: "Category Market Share Distribution",
      subtitle: "Empirical market capture across Tier-1 retail grocery corridors",
      category: "market_intelligence",
      kbSourceReference: "Kantar Worldpanel Brand Footprint Survey",
      slices: [
        { id: "s_1", name: "MAHR Brand Portfolio", percentage: 32, value: "$1.55B", color: "#f59e0b" },
        { id: "s_2", name: "Legacy Conglomerate A", percentage: 26, value: "$1.26B", color: "#6366f1" },
        { id: "s_3", name: "Retailer Private Labels", percentage: 22, value: "$1.06B", color: "#10b981" },
        { id: "s_4", name: "Emerging Challengers", percentage: 12, value: "$580M", color: "#06b6d4" },
        { id: "s_5", name: "Other Regional Brands", percentage: 8, value: "$390M", color: "#64748b" }
      ]
    }
  },
  {
    id: "cost_waterfall",
    title: "Value Chain Margin Waterfall",
    subtitle: "COGS breakdown from raw materials to gross margin & operating EBIT",
    category: "value_chain",
    description: "Financial bridge diagram quantifying cost takeout and EBITDA expansion.",
    kbSourceDefault: "PwC Consumer Industrial Cost Benchmarking",
    hotkeyNum: 5,
    defaultData: {
      type: "cost_waterfall",
      title: "Unit Economics & Margin Expansion Waterfall",
      subtitle: "Demonstrating +14.2% margin expansion via direct routing and SKU rationalization",
      category: "value_chain",
      kbSourceReference: "PwC Corporate Finance & Industrial Cost Benchmarks",
      bars: [
        { id: "b_1", name: "Gross Retail Price", cost: 100, percentage: "100%", isTotal: true },
        { id: "b_2", name: "Raw Material COGS", cost: -26, percentage: "26%" },
        { id: "b_3", name: "Manufacturing & Packaging", cost: -18, percentage: "18%" },
        { id: "b_4", name: "Freight & Cold-Chain", cost: -9, percentage: "9%" },
        { id: "b_5", name: "Trade Spend & Retail Media", cost: -12, percentage: "12%" },
        { id: "b_6", name: "Net Operating EBIT", cost: 35, percentage: "35%", isTotal: true }
      ]
    }
  },
  {
    id: "commodity_price_trends",
    title: "Live Commodity Price Ticker & Volatility",
    subtitle: "Real-time spot price telemetry from CME, ICE & Platts exchanges",
    category: "live_fmc_intelligence",
    description: "Multi-commodity spot price vectors with 24h delta, volatility badges, and procurement alerts.",
    kbSourceDefault: "CME Group, ICE Futures & Platts Commodity Telemetry",
    hotkeyNum: 6,
    defaultData: {
      type: "commodity_price_trends",
      title: "Live FMC Commodity Price Trends & Volatility",
      subtitle: "Real-time spot price telemetry from CME, ICE & Platts exchanges",
      category: "live_fmc_intelligence",
      kbSourceReference: "CME Group, ICE Futures & Platts Commodity Telemetry (2026)",
      commodities: [
        {
          id: "c_coffee",
          name: "Arabica Coffee",
          symbol: "KC",
          exchange: "ICE",
          spotPrice: "$2.48",
          unit: "lb",
          change24h: "+3.8%",
          changePositive: true,
          volatility: "high",
          impactCategory: "Beverages & Consumables"
        },
        {
          id: "c_wheat",
          name: "Milling Wheat",
          symbol: "ZW",
          exchange: "CBOT",
          spotPrice: "$5.82",
          unit: "bushel",
          change24h: "-1.4%",
          changePositive: false,
          volatility: "low",
          impactCategory: "Bakery & Packaged Grain"
        },
        {
          id: "c_sugar",
          name: "Refined Sugar #11",
          symbol: "SB",
          exchange: "ICE",
          spotPrice: "$0.218",
          unit: "lb",
          change24h: "+2.1%",
          changePositive: true,
          volatility: "medium",
          impactCategory: "Confectionery & RTD Beverages"
        },
        {
          id: "c_palmoil",
          name: "Crude Palm Oil",
          symbol: "FCPO",
          exchange: "MDEX",
          spotPrice: "$1,040",
          unit: "MT",
          change24h: "+4.6%",
          changePositive: true,
          volatility: "high",
          impactCategory: "Edible Oils & Personal Care"
        },
        {
          id: "c_petresin",
          name: "PET Packaging Resin",
          symbol: "PET",
          exchange: "Platts",
          spotPrice: "$1,180",
          unit: "MT",
          change24h: "-0.8%",
          changePositive: false,
          volatility: "low",
          impactCategory: "Bottles & Rigid Packaging"
        },
        {
          id: "c_freight",
          name: "Container Freight",
          symbol: "WCI",
          exchange: "Drewry",
          spotPrice: "$3,210",
          unit: "FEU",
          change24h: "-3.2%",
          changePositive: false,
          volatility: "medium",
          impactCategory: "Global Maritime Logistics"
        }
      ]
    }
  },
  {
    id: "retail_market_stats",
    title: "Omnichannel Retail Market Statistics",
    subtitle: "Grocery inflation, private-label share, and quick-commerce velocity",
    category: "live_fmc_intelligence",
    description: "Executive KPI matrix showing omnichannel consumer shifts and retail distribution compliance.",
    kbSourceDefault: "NielsenIQ Consumer Index & Kantar Worldpanel",
    hotkeyNum: 7,
    defaultData: {
      type: "retail_market_stats",
      title: "Omnichannel Retail Market Statistics & Benchmarks",
      subtitle: "Inflation, private-label penetration, and quick-commerce velocity",
      category: "live_fmc_intelligence",
      kbSourceReference: "NielsenIQ Consumer Index & Kantar Worldpanel (2026)",
      retailMetrics: [
        {
          id: "m_inflation",
          label: "Grocery Basket Inflation",
          value: "+2.8%",
          period: "YoY 2026",
          benchmark: "Target < 3.0%",
          trend: "down",
          source: "NielsenIQ Index"
        },
        {
          id: "m_privatelabel",
          label: "Private-Label Value Share",
          value: "23.4%",
          period: "Q3 2026",
          benchmark: "+1.8% expansion",
          trend: "up",
          source: "PLMA Market Study"
        },
        {
          id: "m_qcommerce",
          label: "Q-Commerce Basket Size",
          value: "$24.80",
          period: "Avg 18-min delivery",
          benchmark: "+14.2% YoY",
          trend: "up",
          source: "Kantar Monitor"
        },
        {
          id: "m_outofstock",
          label: "Shelf Out-of-Stock (OOS)",
          value: "6.8%",
          period: "Tier-1 Supermarkets",
          benchmark: "Industry < 4.0%",
          trend: "down",
          source: "Gartner Retail Execution"
        },
        {
          id: "m_promotions",
          label: "Promotional Trade Volume",
          value: "31.2%",
          period: "Volume on Deal",
          benchmark: "Historical 28.5%",
          trend: "up",
          source: "McKinsey Trade Optimization"
        },
        {
          id: "m_csat",
          label: "Shopper Loyalty Index",
          value: "88.4 / 100",
          period: "Digital Shelf CSAT",
          benchmark: "+3.2 pts",
          trend: "up",
          source: "Qualtrics Benchmark"
        }
      ]
    }
  }
];
