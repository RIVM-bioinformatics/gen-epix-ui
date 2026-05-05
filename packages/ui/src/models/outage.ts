import type { CommonDbOutage } from '@gen-epix/api-commondb';

export type CategorizedOutages = {
  activeOutages: CommonDbOutage[];
  soonActiveOutages: CommonDbOutage[];
  visibleOutages: CommonDbOutage[];
};
