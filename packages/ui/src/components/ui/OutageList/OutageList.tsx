import {
  Box,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { CaseDbOutage } from '@gen-epix/api-casedb';

import { OutageSection } from './OutageSection';

export type OutageListProps = {
  readonly activeOutages: CaseDbOutage[];
  readonly soonActiveOutages: CaseDbOutage[];
  readonly visibleOutages: CaseDbOutage[];
};
export const OutageList = ({ activeOutages, soonActiveOutages, visibleOutages }: OutageListProps) => {
  const { t } = useTranslation();

  return (
    <Box>
      {visibleOutages.length === 0 && activeOutages.length === 0 && soonActiveOutages.length === 0 && (
        <Box>
          <Typography component={'p'}>
            {t`There no current or scheduled outages.`}
          </Typography>
        </Box>
      )}
      {activeOutages.length > 0 && (
        <OutageSection
          itemTitle={t`Active outage`}
          outages={activeOutages}
          severity={'error'}
          title={t`Our platform is experiencing an active outing.`}
        />
      )}
      {soonActiveOutages.length > 0 && (
        <OutageSection
          itemTitle={t`Upcoming outage`}
          outages={soonActiveOutages}
          severity={'warning'}
          title={t`Our platform will soon go down for a planned outage.`}
        />
      )}
      {visibleOutages.length > 0 && (
        <OutageSection
          itemTitle={t`Planned outage`}
          outages={visibleOutages}
          severity={'info'}
          title={t`There are scheduled outages. Our platform will be disrupted during these times.`}
        />
      )}
    </Box>
  );
};
