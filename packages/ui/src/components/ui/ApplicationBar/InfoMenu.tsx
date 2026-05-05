import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
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
  readonly anchorElement: HTMLElement;
  readonly onClose: () => void;
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
        horizontal: 'right',
        vertical: 'bottom',
      }}
      id={isInfoMenuOpen ? popoverId : undefined}
      onClose={onClose}
      open={isInfoMenuOpen}
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
    >
      <List
        sx={{
          maxWidth: 300,
          minWidth: 200,
          width: '100%',
        }}
      >
        <ListItem
          divider
        >
          <ListItemText
            primary={t('Frontend version')}
            secondary={ConfigManager.getInstance().config.getSoftwareVersion()}
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
