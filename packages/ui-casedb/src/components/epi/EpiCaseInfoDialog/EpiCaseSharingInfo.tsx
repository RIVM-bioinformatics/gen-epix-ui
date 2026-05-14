import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
} from '@mui/material';
import type { BoxProps } from '@mui/material';

import { EpiDataCollectionAccessInfo } from '../EpiDataCollectionAccessInfo';

export type EpiCaseSharingInfoProps = BoxProps;

export const EpiCaseSharingInfo = ({ ...boxProps }: EpiCaseSharingInfoProps) => {
  const { t } = useTranslation();

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Shared in`}
      </Typography>
      <EpiDataCollectionAccessInfo />
    </Box>
  );
};
