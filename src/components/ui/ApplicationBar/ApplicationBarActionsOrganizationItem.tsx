import { IconButton } from '@mui/material';
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
  const [t] = useTranslation();
  const organizationSwitcherDialogRef = useRef<OrganizationSwitcherDialogRefMethods>(null);


  const onMenuIconClick = useCallback(() => {
    organizationSwitcherDialogRef.current.open();
  }, []);


  return (
    <Fragment>
      <IconButton
        aria-label={t`Change organization`}
        color={'inherit'}
        onClick={onMenuIconClick}
        title={t`Change organization`}
      >
        <ChangeCircleIcon color={'inherit'} />

      </IconButton>
      <OrganizationSwitcherDialog ref={organizationSwitcherDialogRef} />
    </Fragment>
  );
};
