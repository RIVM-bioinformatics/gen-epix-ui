import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

import {
  TestIdUtil,
  ApplicationBar,
} from '@gen-epix/ui';
import type { ApplicationHeaderProps } from '@gen-epix/ui';

import LogoLarge from '../../assets/logo/gen-epix-logo-large.svg?react';

export const ApplicationHeader = ({
  fullWidth,
  fullHeight,
  singleAction,
}: ApplicationHeaderProps) => {
  const [t] = useTranslation();

  return (
    <Box
      {...TestIdUtil.createAttributes('ApplicationHeader')}
      sx={{
        zIndex: 3,
        position: 'relative',
      }}
    >
      {!fullHeight && (
        <Box
          sx={{
            maxHeight: '100px',
            height: '100px',
            display: 'flex',
            justifyContent: 'center',
            '& svg': {
              height: '100%',
              maxHeight: '100%',
              width: 'auto',
            },
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
