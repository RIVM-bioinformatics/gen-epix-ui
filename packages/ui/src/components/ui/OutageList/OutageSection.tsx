import type { AlertProps } from '@mui/material';
import {
  Box,
  Typography,
} from '@mui/material';
import type { Outage } from '@gen-epix/api-casedb';

import { OutageItem } from './OutageItem';

type OutageSectionProps = {
  readonly itemTitle: string;
  readonly outages: Outage[];
  readonly severity: AlertProps['severity'];
  readonly title: string;
};
export const OutageSection = ({ itemTitle, outages, severity, title }: OutageSectionProps) => {
  return (
    <Box
      sx={{
        marginBottom: 2,
      }}
    >
      <Box
        sx={{
          marginBottom: 1,
        }}
      >
        <Typography component={'p'}>
          {title}
        </Typography>
      </Box>
      {outages.map((outage) => (
        <Box
          key={outage.id}
          sx={{
            marginBottom: 1,
          }}
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
