import type { AlertProps } from '@mui/material';
import {
  Typography,
  Box,
} from '@mui/material';

import type { Outage } from '../../../api';

import { OutageItem } from './OutageItem';

type OutageSectionProps = {
  readonly outages: Outage[];
  readonly severity: AlertProps['severity'];
  readonly title: string;
  readonly itemTitle: string;
};
export const OutageSection = ({ outages, severity, title, itemTitle }: OutageSectionProps) => {
  return (
    <Box marginBottom={2}>
      <Box marginBottom={1}>
        <Typography component={'p'}>
          {title}
        </Typography>
      </Box>
      {outages.map((outage) => (
        <Box
          key={outage.id}
          marginBottom={1}
        >
          <OutageItem
            outage={outage}
            severity={severity}
            title={itemTitle}
          />
        </Box>
      ))}
    </Box>
  );
};
