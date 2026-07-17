import {
  Box,
  ClickAwayListener,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import type {
  KeyboardEvent,
  MouseEvent,
} from 'react';
import { useCallback } from 'react';
import { TestIdUtil } from '@gen-epix/ui';

export type DashboardSearchMode = 'exact-match' | 'fuzzy-match' | 'include-match' | 'prefix-exact-match' | 'suffix-exact-match';

export type DashboardSearchSettingsProps = {
  readonly anchorEl: HTMLElement | null;
  readonly onChange: (searchMode: DashboardSearchMode) => void;
  readonly onClose: () => void;
  readonly onEscapeKeyDown: () => void;
  readonly open: boolean;
  readonly searchMode: DashboardSearchMode;
};

type DashboardSearchModeOption = {
  readonly label: string;
  readonly searchMode: DashboardSearchMode;
};

export const DashboardSearchSettings = ({ anchorEl, onChange, onClose, onEscapeKeyDown, open, searchMode }: DashboardSearchSettingsProps) => {
  const { t } = useTranslation();

  const searchModeOptions: DashboardSearchModeOption[] = [
    {
      label: t`Include match`,
      searchMode: 'include-match',
    },
    {
      label: t`Fuzzy match`,
      searchMode: 'fuzzy-match',
    },
    {
      label: t`Exact match`,
      searchMode: 'exact-match',
    },
    {
      label: t`Starts with`,
      searchMode: 'prefix-exact-match',
    },
    {
      label: t`Ends with`,
      searchMode: 'suffix-exact-match',
    },
  ];

  const onMenuItemClick = useCallback((event: MouseEvent<HTMLLIElement>) => {
    const nextSearchMode = event.currentTarget.dataset['searchMode'] as DashboardSearchMode | undefined;
    if (!nextSearchMode) {
      return;
    }
    onChange(nextSearchMode);
    onClose();
  }, [onChange, onClose]);

  const onMenuListKeyDown = useCallback((event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onEscapeKeyDown();
  }, [onEscapeKeyDown]);

  return (
    <Popper
      anchorEl={anchorEl}
      open={open}
      placement={'bottom-end'}
      sx={{
        zIndex: theme => theme.zIndex.modal + 1,
      }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={8}
          sx={{ width: 280 }}
          {...TestIdUtil.createAttributes('DashboardSearchSettings')}
        >
          <MenuList
            autoFocusItem={open}
            onKeyDown={onMenuListKeyDown}
          >
            {searchModeOptions.map(option => (
              <MenuItem
                data-search-mode={option.searchMode}
                key={option.searchMode}
                onClick={onMenuItemClick}
                selected={option.searchMode === searchMode}
              >
                <ListItemIcon>
                  {option.searchMode === searchMode && <CheckIcon fontSize={'small'} />}
                </ListItemIcon>
                <ListItemText>
                  {option.label}
                </ListItemText>
              </MenuItem>
            ))}
          </MenuList>
          <Divider />
          <Box sx={{ p: 1.5 }}>
            <Typography variant={'subtitle2'}>
              {t`Operators`}
            </Typography>
            <Typography variant={'body2'}>
              {t`Spaces combine terms with AND.`}
            </Typography>
            <Typography variant={'body2'}>
              {t`Use | between groups for OR.`}
            </Typography>
            <Typography variant={'body2'}>
              {t`Use double quotes for phrases with spaces.`}
            </Typography>
          </Box>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
};
