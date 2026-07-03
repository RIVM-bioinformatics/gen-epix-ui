import { useTranslation } from 'react-i18next';
import {
  Box,
  Tab,
  Tabs,
} from '@mui/material';
import type {
  ReactElement,
  SyntheticEvent,
} from 'react';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { CaseDbUser } from '@gen-epix/api-casedb';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import { withDialog } from '@gen-epix/ui';

import { CustomTabPanel } from '../CustomTabPanel/CustomTabPanel';

import { UserRightsDialogCaseAccessPolicy } from './UserRightsDialogCaseAccessPolicy';

export interface UserRightsDialogOpenProps {
  user: CaseDbUser;
}

export interface UserRightsDialogProps extends WithDialogRenderProps<UserRightsDialogOpenProps> {
  //
}

export type UserRightsDialogRefMethods = WithDialogRefMethods<UserRightsDialogProps, UserRightsDialogOpenProps>;


export const UserRightsDialog = withDialog<UserRightsDialogProps, UserRightsDialogOpenProps>((
  {
    onTitleChange,
    openProps,
  }: UserRightsDialogProps,
): ReactElement => {
  const { t } = useTranslation();


  useEffect(() => {
    onTitleChange(t('Effective rights for {{userName}}', { userName: openProps.user.name }));
  }, [onTitleChange, openProps.user.name, t]);

  const [activeTab, setActiveTab] = useState(0);

  const onTabsChange = useCallback((_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const a11yProps = useCallback((index: number) => {
    return {
      'aria-controls': `simple-tabpanel-${index}`,
      id: `simple-tab-${index}`,
    };
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          aria-label={'basic tabs example'}
          onChange={onTabsChange}
          value={activeTab}
        >
          <Tab
            label={t`Case access`}
            {...a11yProps(0)}
          />
          <Tab
            label={t`Case type access`}
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>
      <CustomTabPanel
        index={0}
        value={activeTab}
      >
        <UserRightsDialogCaseAccessPolicy user={openProps.user} />
      </CustomTabPanel>
      <CustomTabPanel
        index={1}
        value={activeTab}
      >
        {t`Case type access`}
      </CustomTabPanel>
    </Box>
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'xl',
  testId: 'UserRightsDialog',
});
