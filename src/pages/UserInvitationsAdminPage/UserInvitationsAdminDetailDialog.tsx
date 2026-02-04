import { useTranslation } from 'react-i18next';
import EmailIcon from '@mui/icons-material/Email';
import {
  Box,
  Typography,
} from '@mui/material';
import type { ReactElement } from 'react';
import {
  useEffect,
  useMemo,
} from 'react';
import { format } from 'date-fns';

import type { UserInvitation } from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { WindowManager } from '../../classes/managers/WindowManager';
import { CopyToClipboardButton } from '../../components/ui/CopyToClipboardButton';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../hoc/withDialog';
import { withDialog } from '../../hoc/withDialog';
import { TestIdUtil } from '../../utils/TestIdUtil';
import { DATE_FORMAT } from '../../data/date';

export interface UserInvitationsAdminDetailDialogOpenProps {
  item: UserInvitation;
}

export interface UserInvitationsAdminDetailDialogProps extends WithDialogRenderProps<UserInvitationsAdminDetailDialogOpenProps> {
}

export type UserInvitationsAdminDetailDialogRefMethods = WithDialogRefMethods<UserInvitationsAdminDetailDialogProps, UserInvitationsAdminDetailDialogOpenProps>;

export const UserInvitationsAdminDetailDialog = withDialog<UserInvitationsAdminDetailDialogProps, UserInvitationsAdminDetailDialogOpenProps>((
  {
    onTitleChange,
    openProps,
    onActionsChange,
  }: UserInvitationsAdminDetailDialogProps,
): ReactElement => {
  const { t } = useTranslation();

  useEffect(() => {
    onTitleChange(t('Invitation details for {{email}}', { email: openProps.item.key }));
  }, [onTitleChange, openProps.item.key, t]);

  const expiryDate = useMemo(() => {
    return format(openProps.item.expires_at, DATE_FORMAT.DATE);
  }, [openProps.item.expires_at]);

  const invitationLink = useMemo(() => {
    const url = new URL(WindowManager.instance.window.location.href);
    url.search = '';
    url.hash = '';
    url.pathname = `/accept-invitation/${openProps.item.token}`;
    return url.toString();
  }, [openProps.item.token]);

  const shareInvitationHref = useMemo(() => {
    return `mailto:?subject=${t('Invitation to join {{applicationName}}', { applicationName: ConfigManager.instance.config.applicationName })}&body=${t('Use the following link to accept the invitation: {{invitationLink}}. This link will expire: {{expiryDate}}.', { invitationLink, expiryDate })}&to=${openProps.item.key}`;
  }, [expiryDate, invitationLink, openProps.item.key, t]);


  useEffect(() => {
    onActionsChange([
      {
        ...TestIdUtil.createAttributes('UserInvitationsAdminDetailDialog-agree'),
        href: shareInvitationHref,
        color: 'primary',
        variant: 'contained',
        startIcon: <EmailIcon />,
        label: t('Email invitation link'),
      },
      <CopyToClipboardButton
        key={'copyToClipboard'}
        buttonText={t('Copy invitation link to clipboard')}
        clipboardValue={invitationLink}
      />,
    ]);
  }, [onActionsChange, shareInvitationHref, t, invitationLink]);

  return (
    <Box>
      <Box>
        <Typography>
          {t('The invitation for {{email}} will expire on {{expiryDate}}.', { email: openProps.item.key, expiryDate })}
        </Typography>
      </Box>
      <Box marginY={1}>
        {t('Invitation link: {{invitationLink}}', { email: openProps.item.key, invitationLink })}
      </Box>
    </Box>
  );
}, {
  testId: 'UserInvitationsAdminDetailDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
});
