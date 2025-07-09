import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

import { ConfigManager } from '../../classes/managers/ConfigManager';
import { HomePageTrends } from '../../components/ui/HomePageTrends';
import { PageContainer } from '../../components/ui/PageContainer';
import { TestIdUtil } from '../../utils/TestIdUtil';


const HomeContent = () => {
  const { HomePageIntroduction } = ConfigManager.instance.config;

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
        <HomePageIntroduction />
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
