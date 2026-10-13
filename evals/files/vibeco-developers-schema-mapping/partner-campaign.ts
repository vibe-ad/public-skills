export type Objective =
  | "brand_awareness"
  | "app_installs"
  | "website_visits"
  | "online_sales"
  | "lead_generation"
  | "store_visits";

export type KpiMetric = "cpa" | "cpi" | "cpm" | "roas";

export type AttributionWindow = "1d" | "7d" | "28d";

export type CampaignStatus = "draft" | "live" | "paused";

export interface PartnerCampaign {
  id: string;
  clientId: string;
  title: string;
  objective: Objective;
  kpi: {
    metric: KpiMetric;
    target: number;
  };
  totalBudget: number;
  dailyCap?: number;
  flightStart: string;
  flightEnd?: string;
  countries: string[];
  dmaCodes?: string[];
  attribution: AttributionWindow;
  status: CampaignStatus;
  notes?: string | null;
}
