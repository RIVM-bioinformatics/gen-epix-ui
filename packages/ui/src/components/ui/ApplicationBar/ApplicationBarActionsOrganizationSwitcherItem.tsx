import {
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useRef,
} from 'react';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import { useTranslation } from 'react-i18next';

import { OrganizationSwitcherDialog } from '../OrganizationSwitcherDialog';
import type { OrganizationSwitcherDialogRefMethods } from '../OrganizationSwitcherDialog';
import { FeatureFlagsManager } from '../../../classes/managers/FeatureFlagsManager';


export const ApplicationBarActionsOrganizationSwitcherItem = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const organizationSwitcherDialogRef = useRef<OrganizationSwitcherDialogRefMethods>(null);


  const onMenuIconClick = useCallback(() => {
    organizationSwitcherDialogRef.current.open();
  }, []);

  if (!FeatureFlagsManager.getInstance().featureFlags.update_own_organization) {
    return null;
  }

  return (
    <>
      <IconButton
        aria-label={t`Change organization`}
        color={'inherit'}
        onClick={onMenuIconClick}
        title={t`Change organization`}
      >
        <ChangeCircleIcon color={'inherit'} />
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
          {t`Change organization`}
        </Box>
      </IconButton>
      <OrganizationSwitcherDialog ref={organizationSwitcherDialogRef} />
    </>
  );
};
