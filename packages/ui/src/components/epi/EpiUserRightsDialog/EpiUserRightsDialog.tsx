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

import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import type { User } from '../../../api';
import { EpiCustomTabPanel } from '../EpiCustomTabPanel/EpiCustomTabPanel';

import { EpiUserRightsDialogCaseAccessPolicy } from './EpiUserRightsDialogCaseAccessPolicy';

export interface EpiUserRightsDialogOpenProps {
  user: User;
}

export interface EpiUserRightsDialogProps extends WithDialogRenderProps<EpiUserRightsDialogOpenProps> {
  //
}

export type EpiUserRightsDialogRefMethods = WithDialogRefMethods<EpiUserRightsDialogProps, EpiUserRightsDialogOpenProps>;


export const EpiUserRightsDialog = withDialog<EpiUserRightsDialogProps, EpiUserRightsDialogOpenProps>((
  {
    onTitleChange,
    openProps,
  }: EpiUserRightsDialogProps,
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
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          aria-label={'basic tabs example'}
          value={activeTab}
          onChange={onTabsChange}
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
      <EpiCustomTabPanel
        index={0}
        value={activeTab}
      >
        <EpiUserRightsDialogCaseAccessPolicy user={openProps.user} />
      </EpiCustomTabPanel>
      <EpiCustomTabPanel
        index={1}
        value={activeTab}
      >
        {t`Case type access`}
      </EpiCustomTabPanel>
    </Box>
  );
}, {
  testId: 'EpiUserRightsDialog',
  maxWidth: 'xl',
  fullWidth: true,
  defaultTitle: '',
});
