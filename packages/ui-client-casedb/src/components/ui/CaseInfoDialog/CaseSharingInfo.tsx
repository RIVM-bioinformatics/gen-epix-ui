import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
} from '@mui/material';
import type { BoxProps } from '@mui/material';

import { DataCollectionAccessInfo } from '../DataCollectionAccessInfo';

export type CaseSharingInfoProps = BoxProps;

export const CaseSharingInfo = ({ ...boxProps }: CaseSharingInfoProps) => {
  const { t } = useTranslation();

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Shared in`}
      </Typography>
      <DataCollectionAccessInfo />
    </Box>
  );
};
