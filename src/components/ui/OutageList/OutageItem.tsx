import type { AlertProps } from '@mui/material';
import {
  Alert,
  AlertTitle,
  Typography,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { Outage } from '../../../api';

type OutageItemProps = {
  readonly outage: Outage;
  readonly severity: AlertProps['severity'];
  readonly title: string;
};
export const OutageItem = ({ outage, severity, title }: OutageItemProps) => {
  const [t] = useTranslation();

  return (
    <Alert
      severity={severity}
    >
      <AlertTitle>
        {title}
      </AlertTitle>
      <Box>
        {outage.description}
      </Box>
      <Box>
        <Typography component={'p'}>
          {t`Expected start: `} {outage.active_from ? new Date(outage.active_from).toLocaleString() : t`Unknown`}
        </Typography>
      </Box>
      <Box>
        <Typography component={'p'}>
          {t`Expected end: `} {outage.active_to ? new Date(outage.active_from).toLocaleString() : t`Unknown`}
        </Typography>
      </Box>
    </Alert>
  );
};
