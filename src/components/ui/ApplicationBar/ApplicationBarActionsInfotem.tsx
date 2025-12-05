import {
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import { Fragment } from 'react/jsx-runtime';
import CodeIcon from '@mui/icons-material/Code';
import {
  useCallback,
  useState,
} from 'react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { InfoMenu } from './InfoMenu';

export const ApplicationBarActionsInfoItem = () => {
  const [infoMenuAnchorElement, setInfoMenuAnchorElement] = useState<null | HTMLElement>(null);
  const [t] = useTranslation();
  const theme = useTheme();

  const onInfoMenuIconClick = useCallback((event: MouseEvent<HTMLElement>): void => {
    setInfoMenuAnchorElement(event.currentTarget);
  }, []);

  const onInfoMenuClose = useCallback(() => {
    setInfoMenuAnchorElement(null);
  }, []);

  return (
    <Fragment>
      <IconButton
        color={'inherit'}
        title={'Code information'}
        onClick={onInfoMenuIconClick}
      >
        <CodeIcon color={'inherit'} />
        <Box
          sx={{
            fontSize: '1.3rem',
            marginLeft: theme.spacing(1),
            [theme.breakpoints.up('md')]: {
              visibility: 'hidden',
              position: 'absolute',
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

    </Fragment>
  );
};
