import { useTranslation } from 'react-i18next';
import type {
  ReactElement,
  ReactNode,
} from 'react';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Avatar,
  Box,
  Button,
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
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { ResponseHandler } from '../ResponseHandler';
import {
  SystemApi,
  type PackageMetadata,
} from '../../../api';
import { QUERY_KEY } from '../../../models/query';
import { QueryUtil } from '../../../utils/QueryUtil';


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
    dialogContentRef,
  }: LicensesDialogProps,
): ReactElement => {
  const [t] = useTranslation();
  const [item, setItem] = useState<PackageMetadata>(null);

  const { LicenseInformation } = ConfigManager.instance.config;

  const { isLoading: isFrontendLicensesLoading, error: frontendLicensesError, data: frontendLicenses } = useQuery({
    queryKey: ['LICENSES.JSON'],
    queryFn: async ({ signal }) => {
      return (await axios.get('/licenses.json', {
        signal,
      })).data as PackageMetadata[];
    },
  });

  const { isLoading: isBackendLicensesLoading, error: backendLicensesError, data: backendLicenses } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.LICENSES),
    queryFn: async ({ signal }) => {
      const response = await SystemApi.instance.retrieveLicenses({ signal });
      return response.data;
    },
  });

  const isLoading = isFrontendLicensesLoading || isBackendLicensesLoading;

  const mergedLicenses = useMemo(() => {
    if (!frontendLicenses || !backendLicenses) {
      return [];
    }
    return [...frontendLicenses, ...backendLicenses].sort((a, b) => a.name.localeCompare(b.name));
  }, [frontendLicenses, backendLicenses]);

  useEffect(() => {
    if (isLoading) {
      onTitleChange(t`Licenses - Loading`);
      return;
    }
    if (item) {
      onTitleChange(t('Full license for {{name}}', { name: item.name }));
    } else {
      onTitleChange(t`Licenses`);
    }
  }, [isLoading, item, onTitleChange, t]);

  useEffect(() => {
    if (item) {
      onActionsChange([
        {
          ...TestIdUtil.createAttributes('LicensesDialog-close'),
          color: 'primary',
          autoFocus: true,
          onClick: () => setItem(null),
          variant: 'contained',
          label: t`Go back`,
        },
      ]);
    } else {
      onActionsChange([]);
    }
  }, [item, onActionsChange, onClose, t]);

  const onItemURLClick = useCallback((url: string) => {
    WindowManager.instance.window.open(url, '_blank');
  }, []);

  const onItemLicenseClick = useCallback((entry: PackageMetadata) => {
    dialogContentRef?.current?.scrollTo(0, 0);
    setItem(entry);
  }, [dialogContentRef]);

  return (
    <ResponseHandler
      error={frontendLicensesError || backendLicensesError}
      inlineSpinner
      isLoading={isLoading}
    >
      {item && (
        <Box marginY={2}>
          {item.license}
        </Box>
      )}
      {!item && (
        <>

          <LicenseInformation />
          <Box marginY={2}>
            <Box marginY={2}>
              <Divider />
            </Box>
            <Typography>
              {'This application uses the following open source libraries:'}
            </Typography>
            <List dense>
              {mergedLicenses?.map(entry => {
                let license: string | ReactNode;

                if (!entry.license) {
                  license = t`license: Unknown license`;
                } else if (entry.license.length > 100) {
                  license = (
                    <Button
                      color="secondary"
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={() => onItemLicenseClick(entry)}
                      size="small"
                      variant="text"
                    >
                      {t('Show license')}
                    </Button>
                  );
                } else {
                  license = t('license: {{license}}', { license: entry.license });
                }

                return (
                  <Fragment key={entry.name}>
                    <ListItem secondaryAction={entry.homepage && (
                      <IconButton
                        aria-label="delete"
                        edge="end"
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={() => onItemURLClick(entry.homepage)}
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
                        secondary={license}
                      />
                    </ListItem>
                    <Divider
                      component="li"
                      variant="inset"
                    />
                  </Fragment>
                );
              })}
            </List>
          </Box>
        </>
      )}
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
