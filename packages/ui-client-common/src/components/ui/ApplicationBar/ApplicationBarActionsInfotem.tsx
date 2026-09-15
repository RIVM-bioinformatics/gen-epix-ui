import {
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import {
  useCallback,
  useState,
} from 'react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { InfoMenu } from './InfoMenu';

export const ApplicationBarActionsInfoItem = () => {
  const [infoMenuAnchorElement, setInfoMenuAnchorElement] = useState<HTMLElement | null>(null);
  const { t } = useTranslation();
  const theme = useTheme();

  const onInfoMenuIconClick = useCallback((event: MouseEvent<HTMLElement>): void => {
    setInfoMenuAnchorElement(event.currentTarget);
  }, []);

  const onInfoMenuClose = useCallback(() => {
    setInfoMenuAnchorElement(null);
  }, []);

  return (
    <>
      <IconButton
        color={'inherit'}
        onClick={onInfoMenuIconClick}
        title={'Code information'}
      >
        <CodeIcon color={'inherit'} />
        <Box
          sx={{
            fontSize: '1.3rem',
            marginLeft: theme.spacing(1),
            [theme.breakpoints.up('md')]: {
              position: 'absolute',
              visibility: 'hidden',
            },
          }}
        >
          {t`Code information`}
        </Box>
      </IconButton>
      {infoMenuAnchorElement && (
        <InfoMenu
          anchorElement={infoMenuAnchorElement}
          onClose={onInfoMenuClose}
        />
      )}

    </>
  );
};
