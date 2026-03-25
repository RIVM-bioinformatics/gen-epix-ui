import type { Outage } from '../api';

export type CategorizedOutages = {
  visibleOutages: Outage[];
  activeOutages: Outage[];
  soonActiveOutages: Outage[];
};
