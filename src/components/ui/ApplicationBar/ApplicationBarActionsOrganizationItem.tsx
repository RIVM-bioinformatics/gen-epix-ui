import {
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useRef,
} from 'react';
import { Fragment } from 'react/jsx-runtime';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import { useTranslation } from 'react-i18next';

import { OrganizationSwitcherDialog } from '../OrganizationSwitcherDialog';
import type { OrganizationSwitcherDialogRefMethods } from '../OrganizationSwitcherDialog';


export const ApplicationBarActionsOrganizationSwitcherItem = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const organizationSwitcherDialogRef = useRef<OrganizationSwitcherDialogRefMethods>(null);


  const onMenuIconClick = useCallback(() => {
    organizationSwitcherDialogRef.current.open();
  }, []);


  return (
    <Fragment>
      <IconButton
        aria-label={t`Change organization`}
        color={'inherit'}
        title={t`Change organization`}
        onClick={onMenuIconClick}
      >
        <ChangeCircleIcon color={'inherit'} />
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
          {t`Change organization`}
        </Box>
      </IconButton>
      <OrganizationSwitcherDialog ref={organizationSwitcherDialogRef} />
    </Fragment>
  );
};
