import type { CaseDbOutage } from '@gen-epix/api-casedb';

export type CategorizedOutages = {
  activeOutages: CaseDbOutage[];
  soonActiveOutages: CaseDbOutage[];
  visibleOutages: CaseDbOutage[];
};
