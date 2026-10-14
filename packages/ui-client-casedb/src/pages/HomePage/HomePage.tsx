import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { PageContainer } from '@gen-epix/ui-client-common/components/ui/PageContainer';
import { useConfig } from '@gen-epix/ui-client-common/hooks/useConfig';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { HomePageTrends } from '../../components/ui/HomePageTrends';


export const HomePage = () => {
  const { t } = useTranslation();
  const { HomePageIntroduction } = useConfig();

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
