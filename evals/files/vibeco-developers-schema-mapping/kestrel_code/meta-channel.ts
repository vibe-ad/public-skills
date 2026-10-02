// Kestrel Hub — Meta implementation (abridged). New channels should follow the same layout.
import axios, { AxiosInstance } from "axios";
import { AdChannel, ChannelConfig, MappingError } from "./ad-channel";
import { withRetry } from "../lib/retry";
import { loadSecret } from "../lib/vault";
import { logger } from "../lib/logger";
import type { KestrelCampaignBundle, PerformanceDaily } from "../model";

const META_API_VERSION = "v21.0";

export class MetaChannel implements AdChannel {
  readonly channelKey = "meta";
  private http: AxiosInstance;

  constructor(private readonly config: ChannelConfig) {
    this.http = axios.create({
      baseURL: `https://graph.facebook.com/${META_API_VERSION}`,
    });
  }

  private async authHeaders() {
    const token = await loadSecret(this.config.secretRef);
    return { Authorization: `Bearer ${token}` };
  }

  async pushCampaign(bundle: KestrelCampaignBundle) {
    const headers = await this.authHeaders();
    const campaign = await withRetry(() =>
      this.http.post(
        `/act_${bundle.client.metaAdAccountId}/campaigns`,
        {
          name: bundle.campaign.name,
          objective: mapObjective(bundle.campaign.objective),
          lifetime_budget:
            bundle.campaign.budget.type === "lifetime"
              ? toCents(bundle.campaign.budget.amount)
              : undefined,
          daily_budget:
            bundle.campaign.budget.type === "daily"
              ? toCents(bundle.campaign.budget.amount)
              : undefined,
          status: "PAUSED",
        },
        { headers },
      ),
    );
    logger.info(
      { channel: this.channelKey, id: campaign.data.id },
      "campaign pushed",
    );
    return { externalCampaignId: campaign.data.id };
  }

  async pullDailyPerformance(date: string): Promise<PerformanceDaily[]> {
    const headers = await this.authHeaders();
    const res = await withRetry(() =>
      this.http.get(`/act_${"<account>"}/insights`, {
        headers,
        params: {
          level: "ad",
          time_range: JSON.stringify({ since: date, until: date }),
          fields:
            "ad_id,spend,impressions,clicks,video_p25_watched_actions,video_p100_watched_actions,action_values",
        },
      }),
    );
    return res.data.data.map(
      (r: any): PerformanceDaily => ({
        date,
        ad_id: `meta:${r.ad_id}`,
        spend: Number(r.spend),
        impressions: Number(r.impressions),
        clicks: Number(r.clicks ?? 0),
        video_views_3s: 0,
        video_p25: 0,
        video_p50: 0,
        video_p75: 0,
        video_p100: 0,
        conversions: 0,
        revenue: 0,
        roas: 0,
        attribution_setting: "7d_click_1d_view",
      }),
    );
  }
}

function mapObjective(o: string): string {
  switch (o) {
    case "CONVERSIONS":
      return "OUTCOME_SALES";
    case "REACH":
      return "OUTCOME_AWARENESS";
    default:
      throw new MappingError(
        "campaign.objective",
        `unsupported objective ${o}`,
      );
  }
}
const toCents = (usd: number) => Math.round(usd * 100);
