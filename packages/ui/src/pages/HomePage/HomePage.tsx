import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

import { ConfigManager } from '../../classes/managers/ConfigManager';
import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { HomePageTrends } from '../../components/ui/HomePageTrends';


export const HomePage = () => {
  const { t } = useTranslation();
  const { HomePageIntroduction } = ConfigManager.instance.config;

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
