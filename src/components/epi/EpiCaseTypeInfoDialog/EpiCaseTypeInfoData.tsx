import {
  Typography,
  Box,
} from '@mui/material';
import { t } from 'i18next';

export type EpiCaseTypeInfoDataProps = {
  readonly name: string;
  readonly title: string;
};

export const EpiCaseTypeInfoData = ({ name, title }: EpiCaseTypeInfoDataProps) => {
  return (
    <Box marginY={2}>
      <Typography
        component={'h4'}
        variant={'h4'}
      >
        {title}
      </Typography>
      <Typography
        component={'p'}
        variant={'body1'}
      >
        {name && (
          <>
            {name}
          </>
        )}
        {!name && (
          <>
            {t`Not applicable`}
          </>
        )}
      </Typography>
    </Box>
  );
};
