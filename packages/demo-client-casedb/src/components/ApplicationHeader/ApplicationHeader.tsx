import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  ApplicationBar,
  TestIdUtil,
} from '@gen-epix/ui';
import type { ApplicationHeaderProps } from '@gen-epix/ui';

import LogoLarge from '../../assets/logo/gen-epix-logo-large.svg?react';

export const ApplicationHeader = ({
  fullHeight,
  fullWidth,
  singleAction,
}: ApplicationHeaderProps) => {
  const [t] = useTranslation();

  return (
    <Box
      {...TestIdUtil.createAttributes('ApplicationHeader')}
      sx={{
        position: 'relative',
        zIndex: 3,
      }}
    >
      {!fullHeight && (
        <Box
          sx={{
            '& svg': {
              height: '100%',
              maxHeight: '100%',
              width: 'auto',
            },
            display: 'flex',
            height: '100px',
            justifyContent: 'center',
            maxHeight: '100px',
          }}
        >
          <LogoLarge aria-label={t`Logo`} />
        </Box>
      )}
      <ApplicationBar
        fullHeight={fullHeight}
        fullWidth={fullWidth}
        singleAction={singleAction}
      />
    </Box>
  );
};
