import {
  Box,
  Typography,
} from '@mui/material';
import { t } from 'i18next';

export type CaseTypeInfoDataProps = {
  readonly name: string;
  readonly title: string;
};

export const CaseTypeInfoData = ({ name, title }: CaseTypeInfoDataProps) => {
  return (
    <Box
      sx={{
        marginY: 2,
      }}
    >
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
