import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
} from '@mui/material';
import type { BoxProps } from '@mui/material';

import { DataCollectionAccessInfo } from '../DataCollectionAccessInfo';

export type CaseSetSharingInfoProps = BoxProps;

export const CaseSetSharingInfo = ({ ...boxProps }: CaseSetSharingInfoProps) => {
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
