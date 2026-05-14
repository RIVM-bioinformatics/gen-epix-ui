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
import axios from 'axios';
import type { CommonDbPackageMetadata } from '@gen-epix/api-commondb';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { ResponseHandler } from '../ResponseHandler';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { QueryClientManager } from '../../../classes/managers/QueryClientManager';
import { COMMON_QUERY_KEY } from '../../../data/query';
import { ApiManager } from '../../../classes/managers/ApiManager';


export interface LicensesDialogOpenProps {
  //
}

export interface LicensesDialogProps extends WithDialogRenderProps<LicensesDialogOpenProps> {
  //
}

export type LicensesDialogRefMethods = WithDialogRefMethods<LicensesDialogProps, LicensesDialogOpenProps>;


export const LicensesDialog = withDialog<LicensesDialogProps, LicensesDialogOpenProps>((
  {
    dialogContentRef,
    onActionsChange,
    onClose,
    onTitleChange,
  }: LicensesDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const [item, setItem] = useState<CommonDbPackageMetadata>(null);

  const { LicenseInformation } = ConfigManager.getInstance().config;

  const { data: frontendLicenses, error: frontendLicensesError, isLoading: isFrontendLicensesLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      return (await axios.get('/licenses.json', {
        signal,
      })).data as CommonDbPackageMetadata[];
    },
    queryKey: ['LICENSES.JSON'],
  });

  const { data: backendLicenses, error: backendLicensesError, isLoading: isBackendLicensesLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await ApiManager.getInstance().systemApi.retrieveLicenses({ signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(COMMON_QUERY_KEY.LICENSES),
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
          autoFocus: true,
          color: 'primary',
          label: t`Go back`,
          onClick: () => setItem(null),
          variant: 'contained',
        },
      ]);
    } else {
      onActionsChange([]);
    }
  }, [item, onActionsChange, onClose, t]);

  const onItemURLClick = useCallback((url: string) => {
    WindowManager.getInstance().window.open(url, '_blank');
  }, []);

  const onItemLicenseClick = useCallback((entry: CommonDbPackageMetadata) => {
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
        <Box
          sx={{
            marginY: 2,
          }}
        >
          {item.license}
        </Box>
      )}
      {!item && (
        <>

          <Box
            sx={{
              marginY: 2,
            }}
          >
            <LicenseInformation />
          </Box>
          <Divider />
          <Box
            sx={{
              marginY: 2,
            }}
          >
            <Typography>
              {t`This application uses the following open source libraries:`}
            </Typography>
            <List dense>
              {mergedLicenses?.map(entry => {
                let license: ReactNode | string;

                if (!entry.license) {
                  license = t`license: Unknown license`;
                } else if (entry.license.length > 100) {
                  license = (
                    <Button
                      color={'secondary'}
                      // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                      onClick={() => onItemLicenseClick(entry)}
                      size={'small'}
                      variant={'text'}
                    >
                      {t('Show license')}
                    </Button>
                  );
                } else {
                  license = t('license: {{license}}', { license: entry.license });
                }

                return (
                  <Fragment key={entry.name}>
                    <ListItem
                      secondaryAction={entry.homepage && (
                        <IconButton
                          aria-label={t`Open project homepage in new tab`}
                          edge={'end'}
                          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
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
                      component={'li'}
                      variant={'inset'}
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
  defaultTitle: '',
  disableBackdropClick: false,
  fullWidth: true,
  maxWidth: 'md',
  noCloseButton: false,
  testId: 'LicensesDialog',
});
