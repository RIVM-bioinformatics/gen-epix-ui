import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import {
  ConfigService,
  PageContainer,
} from '@gen-epix/ui';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { HomePageTrends } from '../../components/ui/HomePageTrends';


export const HomePage = () => {
  const { t } = useTranslation();
  const { HomePageIntroduction } = ConfigService.getInstance().config;

  return (
    <PageContainer
      testIdAttributes={TestIdUtil.createAttributes('HomePage')}
      title={t`Home`}
    >
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
          <HomePageIntroduction />
        </Box>
        <HomePageTrends />
      </Box>
    </PageContainer>
  );
};
