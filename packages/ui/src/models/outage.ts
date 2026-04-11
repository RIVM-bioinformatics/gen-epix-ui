import type { Outage } from '../api';

export type CategorizedOutages = {
  activeOutages: Outage[];
  soonActiveOutages: Outage[];
  visibleOutages: Outage[];
};
