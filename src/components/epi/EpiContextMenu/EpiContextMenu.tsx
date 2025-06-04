import type { PopoverPosition } from '@mui/material';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import { EpiStoreContext } from '../../../stores/epiStore';
import { EpiCaseSelectionUtil } from '../../../utils/EpiCaseSelectionUtil';

export type EpiContextMenuConfigWithAnchor = {
  anchorElement?: Element;
  parseIdsFromAnchorElement?: (element: Element) => string[];
  mouseEvent?: MouseEvent;
};

export type EpiContextMenuConfigWithPosition = {
  position?: PopoverPosition;
  caseIds?: string[];
  mouseEvent?: MouseEvent;
};

type EpiContextMenuConfig = EpiContextMenuConfigWithAnchor & EpiContextMenuConfigWithPosition;

export type EpiContextMenuProps = {
  readonly onMenuClose: () => void;
  readonly config: EpiContextMenuConfig;
  readonly getExtraItems?: (onMenuClose?: () => void) => ReactElement;
};

export const EpiContextMenu = ({ config, onMenuClose, getExtraItems }: EpiContextMenuProps) => {
  const [t] = useTranslation();
  const epiStore = useContext(EpiStoreContext);
  const selectedIds = useStore(epiStore, (state) => state.selectedIds);
  const setSelectedIds = useStore(epiStore, (state) => state.setSelectedIds);

  const componentCaseIds = useMemo(() => {
    if (config?.parseIdsFromAnchorElement) {
      return config.parseIdsFromAnchorElement(config.anchorElement);
    }
    if (config?.caseIds) {
      return config.caseIds;
    }
    return [];
  }, [config]);

  useEffect(() => {
    const mouseEvent = config?.mouseEvent;
    if (!mouseEvent || (!mouseEvent.metaKey && !mouseEvent.ctrlKey)) {
      return;
    }
    if (EpiCaseSelectionUtil.canAddToSelection(componentCaseIds, selectedIds)) {
      setSelectedIds(EpiCaseSelectionUtil.addComponentCaseIdsToSelection(componentCaseIds, selectedIds));
      onMenuClose();
      return;
    }
    if (EpiCaseSelectionUtil.canRemoveFromSelection(componentCaseIds, selectedIds)) {
      setSelectedIds(EpiCaseSelectionUtil.removeComponentCaseIdsFromSelection(componentCaseIds, selectedIds));
      onMenuClose();
      return;
    }
  }, [componentCaseIds, config?.mouseEvent, selectedIds, setSelectedIds, onMenuClose]);


  const onMenuSelectClick = useCallback(() => {
    setSelectedIds(componentCaseIds);
    onMenuClose();
  }, [componentCaseIds, onMenuClose, setSelectedIds]);

  const onAddToSelectionMenuItemClick = useCallback(() => {
    setSelectedIds(EpiCaseSelectionUtil.addComponentCaseIdsToSelection(componentCaseIds, selectedIds));
    onMenuClose();
  }, [componentCaseIds, onMenuClose, setSelectedIds, selectedIds]);

  const onRemoveFromSelectionMenuItemClick = useCallback(() => {
    setSelectedIds(EpiCaseSelectionUtil.removeComponentCaseIdsFromSelection(componentCaseIds, selectedIds));
    onMenuClose();
  }, [componentCaseIds, onMenuClose, setSelectedIds, selectedIds]);

  const onRefineSelectionMenuItemClick = useCallback(() => {
    setSelectedIds(EpiCaseSelectionUtil.refineSelectionWithComponentCaseIds(componentCaseIds, selectedIds));
    onMenuClose();
  }, [componentCaseIds, onMenuClose, setSelectedIds, selectedIds]);

  const extraItems = getExtraItems ? getExtraItems(onMenuClose) : null;

  return (
    <Menu
      anchorEl={config?.anchorElement}
      anchorPosition={config?.position}
      anchorReference={config?.anchorElement ? 'anchorEl' : 'anchorPosition'}
      onClose={onMenuClose}
      open={!!config}
    >
      {extraItems}

      <MenuItem
        onClick={onMenuSelectClick}
      >
        <ListItemIcon>
          <PlaylistAddCheckIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t`Select rows`}
        </ListItemText>
      </MenuItem>

      <MenuItem
        disabled={!EpiCaseSelectionUtil.canAddToSelection(componentCaseIds, selectedIds)}
        onClick={onAddToSelectionMenuItemClick}
      >
        <ListItemIcon>
          <PlaylistAddIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t`Add to selected rows`}
        </ListItemText>
      </MenuItem>

      <MenuItem
        disabled={!EpiCaseSelectionUtil.canRemoveFromSelection(componentCaseIds, selectedIds)}
        onClick={onRemoveFromSelectionMenuItemClick}
      >
        <ListItemIcon>
          <PlaylistRemoveIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t`Remove from selected rows`}
        </ListItemText>
      </MenuItem>

      <MenuItem
        disabled={!EpiCaseSelectionUtil.canRefineSelection(componentCaseIds, selectedIds)}
        onClick={onRefineSelectionMenuItemClick}
      >
        <ListItemIcon>
          <PlaylistPlayIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t`Refine selected rows (intersect)`}
        </ListItemText>
      </MenuItem>
    </Menu>
  );
};
