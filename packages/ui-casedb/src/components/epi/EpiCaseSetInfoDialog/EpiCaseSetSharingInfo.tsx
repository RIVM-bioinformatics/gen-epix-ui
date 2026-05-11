import { useTranslation } from 'react-i18next';
import {
  Box,
  type BoxProps,
  Typography,
} from '@mui/material';

import { EpiDataCollectionAccessInfo } from '../EpiDataCollectionAccessInfo';

export type EpiCaseSetSharingInfoProps = BoxProps;

export const EpiCaseSetSharingInfo = ({ ...boxProps }: EpiCaseSetSharingInfoProps) => {
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
