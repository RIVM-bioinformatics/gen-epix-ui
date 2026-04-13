import type { Outage } from '@gen-epix/api-casedb';

export type CategorizedOutages = {
  activeOutages: Outage[];
  soonActiveOutages: Outage[];
  visibleOutages: Outage[];
};
