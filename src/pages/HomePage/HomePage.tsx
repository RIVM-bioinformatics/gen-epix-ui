import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import {
  subMonths,
  type Locale,
} from 'date-fns';
import {
  enUS,
  sv,
} from 'date-fns/locale';
import { useMemo } from 'react';
import {
  DatePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { HomePageTrends } from '../../components/ui/HomePageTrends';
import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';


const HomeContent = () => {
  const [t] = useTranslation();
  const customLocale = useMemo<Locale>(() => {
    /**
     * Use everything from enUS, but format dates the Swedish way (ISO 8601)
     */
    return {
      ...enUS,
      formatLong: sv.formatLong,
    };
  }, []);

  const defaultValue = useMemo(() => {
    return subMonths(new Date(), 3);
  }, []);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateRows: 'auto max-content',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <LocalizationProvider
          adapterLocale={customLocale}
          dateAdapter={AdapterDateFns}
        >
          <DatePicker
            defaultValue={defaultValue}
            label={t`From`}
          />
        </LocalizationProvider>
      </Box>
      <HomePageTrends />
    </Box>
  );
};

export const HomePage = () => {
  const [t] = useTranslation();

  return (
    <PageContainer
      testIdAttributes={TestIdUtil.createAttributes('HomePage')}
      title={t`Home`}
    >
      <HomeContent />
    </PageContainer>
  );
};
