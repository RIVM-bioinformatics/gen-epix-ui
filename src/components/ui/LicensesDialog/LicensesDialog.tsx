import { useTranslation } from 'react-i18next';
import type { ReactElement } from 'react';
import {
  Fragment,
  useCallback,
  useEffect,
} from 'react';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import type { Licenses } from '../../../models/manifest';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { ResponseHandler } from '../ResponseHandler';


export interface LicensesDialogOpenProps {
  //
}

export interface LicensesDialogProps extends WithDialogRenderProps<LicensesDialogOpenProps> {
  //
}

export type LicensesDialogRefMethods = WithDialogRefMethods<LicensesDialogProps, LicensesDialogOpenProps>;


export const LicensesDialog = withDialog<LicensesDialogProps, LicensesDialogOpenProps>((
  {
    onTitleChange,
    onActionsChange,
    onClose,
  }: LicensesDialogProps,
): ReactElement => {
  const [t] = useTranslation();

  const { LicenseInformation } = ConfigManager.instance.config;

  const { isPending: isManifestLoading, error: manifestError, data: manifest } = useQuery({
    queryKey: ['LICENSES.JSON'],
    queryFn: async ({ signal }) => {
      return (await axios.get('/licenses.json', {
        signal,
      })).data as Licenses;
    },
  });

  useEffect(() => {
    if (isManifestLoading) {
      onTitleChange(t`Licenses - Loading`);
      return;
    }
    onTitleChange(t`Licenses`);
  }, [isManifestLoading, onTitleChange, t]);

  useEffect(() => {
    onActionsChange(
      [
        {
          ...TestIdUtil.createAttributes('LicensesDialog-close'),
          color: 'primary',
          autoFocus: true,
          onClick: onClose,
          variant: 'outlined',
          label: t`Close`,
        },
      ],
    );
  }, [onActionsChange, onClose, t]);

  const onItemClick = useCallback((url: string) => {
    WindowManager.instance.window.open(url, '_blank');
  }, []);

  return (
    <ResponseHandler
      error={manifestError}
      inlineSpinner
      isPending={isManifestLoading}
    >
      <LicenseInformation />
      <Box marginY={2}>
        <Box marginY={2}>
          <Divider />
        </Box>
        <Typography>
          {'This application uses the following open source libraries:'}
        </Typography>
        <List dense>
          {manifest?.map(entry => (
            <Fragment key={entry.name}>
              <ListItem secondaryAction={entry.homepage && (
                <IconButton
                  aria-label="delete"
                  edge="end"
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={() => onItemClick(entry.homepage)}
                >
                  <OpenInNewIcon />
                </IconButton>
              )}
              >
                <ListItemAvatar>
                  <Avatar>
                    <FolderIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={(
                    <>
                      <strong>
                        {entry.name}
                      </strong>
                      {' '}
                      {entry.version}
                    </>
                  )}
                  secondary={t('license: {{license}}', { license: entry.license })}
                />
              </ListItem>
              <Divider
                component="li"
                variant="inset"
              />
            </Fragment>
          ))}
        </List>
      </Box>
    </ResponseHandler>
  );
}, {
  testId: 'LicensesDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
