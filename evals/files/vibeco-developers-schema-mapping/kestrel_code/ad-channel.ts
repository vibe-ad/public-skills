import type { KestrelCampaignBundle, PerformanceDaily } from "../model";

export interface ChannelConfig {
  secretRef: string;
  timezone: string;
}

export interface AdChannel {
  readonly channelKey: string;
  pushCampaign(
    bundle: KestrelCampaignBundle,
  ): Promise<{ externalCampaignId: string }>;
  pullDailyPerformance(date: string): Promise<PerformanceDaily[]>;
}

export class MappingError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(`[${field}] ${message}`);
  }
}
