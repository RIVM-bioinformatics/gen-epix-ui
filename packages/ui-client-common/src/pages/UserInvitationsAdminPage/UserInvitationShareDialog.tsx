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
import { container } from 'tsyringe';
import type { CommonDbUserInvitation } from '@gen-epix/api-commondb';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';
import { CopyToClipboardButton } from '@gen-epix/ui-core-components/components/CopyToClipboardButton';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui-core-components/hoc/withDialog';
import { withDialog } from '@gen-epix/ui-core-components/hoc/withDialog';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { useConfig } from '../../hooks/useConfig';

export interface UserInvitationShareDialogOpenProps {
  item: CommonDbUserInvitation;
}

export interface UserInvitationShareDialogProps extends WithDialogRenderProps<UserInvitationShareDialogOpenProps> {
}

export type UserInvitationShareDialogRefMethods = WithDialogRefMethods<UserInvitationShareDialogProps, UserInvitationShareDialogOpenProps>;

export const UserInvitationShareDialog = withDialog<UserInvitationShareDialogProps, UserInvitationShareDialogOpenProps>((
  {
    onActionsChange,
    onTitleChange,
    openProps,
  }: UserInvitationShareDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const config = useConfig();

  useEffect(() => {
    onTitleChange(t('Invitation details for {{email}}', { email: openProps.item.key }));
  }, [onTitleChange, openProps.item.key, t]);

  const expiryDate = useMemo(() => {
    return format(openProps.item.expires_at, DATE_FORMAT.DATE);
  }, [openProps.item.expires_at]);

  const invitationLink = useMemo(() => {
    const url = new URL(container.resolve(WindowService).window.location.href);
    url.search = '';
    url.hash = '';
    url.pathname = `/accept-invitation/${openProps.item.token}`;
    return url.toString();
  }, [openProps.item.token]);

  const shareInvitationHref = useMemo(() => {
    return `mailto:?subject=${t('Invitation to join {{applicationName}}', { applicationName: config.applicationName })}&body=${t('Use the following link to accept the invitation: {{invitationLink}}. This link will expire: {{expiryDate}}.', { expiryDate, invitationLink })}&to=${openProps.item.key}`;
  }, [config.applicationName, expiryDate, invitationLink, openProps.item.key, t]);


  useEffect(() => {
    onActionsChange([
      {
        ...TestIdUtil.createAttributes('UserInvitationShareDialog-agree'),
        color: 'primary',
        href: shareInvitationHref,
        label: t('Email invitation link'),
        startIcon: <EmailIcon />,
        variant: 'contained',
      },
      <CopyToClipboardButton
        buttonText={t('Copy invitation link to clipboard')}
        clipboardValue={invitationLink}
        key={'copyToClipboard'}
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
      <Box
        sx={{
          marginY: 1,
        }}
      >
        {t('Invitation link: {{invitationLink}}', { email: openProps.item.key, invitationLink })}
      </Box>
    </Box>
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'md',
  testId: 'UserInvitationShareDialog',
});
