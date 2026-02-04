import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
} from '@mui/material';
import CopyrightIcon from '@mui/icons-material/Copyright';
import { useTranslation } from 'react-i18next';

import type { LicensesDialogRefMethods } from '../LicensesDialog';
import { LicensesDialog } from '../LicensesDialog';
import { BackendVersionManager } from '../../../classes/managers/BackendVersionManager';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { StringUtil } from '../../../utils/StringUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';

type InfoMenuProps = {
  readonly onClose: () => void;
  readonly anchorElement: HTMLElement;
};

export const InfoMenu = ({ anchorElement, onClose }: InfoMenuProps): ReactElement => {
  const popoverId = useMemo(() => StringUtil.createUuid(), []);
  const licensesDialogRef = useRef<LicensesDialogRefMethods>(null);
  const isInfoMenuOpen = !!anchorElement;
  const { t } = useTranslation();
  const onShowLicenseInformationButtonClick = useCallback(() => {
    licensesDialogRef.current.open();
  }, []);

  return (
    <Popover
      {...TestIdUtil.createAttributes('InfoMenu')}
      anchorEl={anchorElement}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={isInfoMenuOpen ? popoverId : undefined}
      open={isInfoMenuOpen}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      onClose={onClose}
    >
      <List
        sx={{
          width: '100%',
          minWidth: 200,
          maxWidth: 300,
        }}
      >
        <ListItem
          divider
        >
          <ListItemText
            primary={t('Frontend version')}
            secondary={ConfigManager.instance.config.getSoftwareVersion()}
            slotProps={{
              primary: {
                sx: {
                  color: 'primary.main',
                  fontWeight: 'bold',
                },
              },
            }}
          />
        </ListItem>
        <ListItem
          divider
        >
          <ListItemText
            primary={t('Backend version')}
            secondary={BackendVersionManager.instance.version}
            slotProps={{
              primary: {
                sx: {
                  color: 'primary.main',
                  fontWeight: 'bold',
                },
              },
            }}
          />
        </ListItem>
        <ListItem>
          <ListItemButton
            onClick={onShowLicenseInformationButtonClick}
          >
            <ListItemIcon>
              <CopyrightIcon color={'secondary'} />
            </ListItemIcon>
            <ListItemText
              primary={t`Show license information`}
              slotProps={{
                primary: {
                  sx: {
                    color: 'secondary.main',
                    fontWeight: 'bold',
                  },
                },
              }}
            />
          </ListItemButton>
          <LicensesDialog
            ref={licensesDialogRef}
          />
        </ListItem>
      </List>
    </Popover>
  );
};
