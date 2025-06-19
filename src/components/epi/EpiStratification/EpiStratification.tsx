import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from '@mui/material';
import type {
  MouseEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import isArray from 'lodash/isArray';
import { produce } from 'immer';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import type { EpiContextMenuConfigWithAnchor } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiLegendaItem } from '../EpiLegendaItem';
import type { CaseTypeCol } from '../../../api';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { HighlightingManager } from '../../../classes/managers/HighlightingManager';
import type { StratificationLegendaItem } from '../../../models/epi';
import {
  STRATIFICATION_MODE,
  EPI_ZONE,
} from '../../../models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import { EpiStoreContext } from '../../../stores/epiStore';
import { NestedDropdown } from '../../ui/NestedMenu';

export const EpiStratification = () => {
  const [t] = useTranslation();
  const epiStore = useContext(EpiStoreContext);
  const highlightingManager = useMemo(() => HighlightingManager.instance, []);

  const stratification = useStore(epiStore, (state) => state.stratification);
  const stratify = useStore(epiStore, (state) => state.stratify);
  const setFilterValue = useStore(epiStore, (state) => state.setFilterValue);
  const filters = useStoreWithEqualityFn(epiStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => filter.filterValue)) === JSON.stringify(b.map(filter => filter.filterValue)));
  const stratifyableColumns = useStore(epiStore, (state) => state.stratifyableColumns);
  const [focussedLegendaItem, setFocussedLegendaItem] = useState<StratificationLegendaItem>(null);

  const onStratifyMenuItemClick = useCallback((caseTypeColumn: CaseTypeCol) => {
    if (caseTypeColumn.id === stratification?.caseTypeColumn?.id) {
      stratify(null);
      return;
    }
    stratify(STRATIFICATION_MODE.FIELD, caseTypeColumn);
  }, [stratification?.caseTypeColumn?.id, stratify]);

  const stratificationMenu = useMemo<MenuItemData>(() => {
    let label = t`Grouping`;
    if (stratification) {
      if (stratification.mode === STRATIFICATION_MODE.SELECTION) {
        label = t`Grouped by Selected rows`;
      } else {
        label = t('Grouped by {{fieldName}}', { fieldName: stratification.caseTypeColumn.label });
      }
    }


    return produce<MenuItemData>({
      label,
      tooltip: t('Grouping allows you to group cases by a selected field. Grouping will be disabled when the maximum unique values of the selected field exceeds {{max_stratification_unique_values}}.', { max_stratification_unique_values: ConfigManager.instance.config.epi.MAX_STRATIFICATION_UNIQUE_VALUES }),
      disabled: stratifyableColumns.length === 0,
      items: [{
        label: 'None',
        callback: () => {
          stratify(null);
        },
        active: !stratification,
        divider: true,
      },
      {
        label: 'Selected rows',
        callback: () => {
          stratify(stratification?.mode === STRATIFICATION_MODE.SELECTION ? null : STRATIFICATION_MODE.SELECTION);
        },
        active: stratification?.mode === STRATIFICATION_MODE.SELECTION,
        divider: true,
      }],
    }, draft => {
      stratifyableColumns
        .forEach(stratifyableCaseTypeColumn => {
          draft.items.push({
            label: stratifyableCaseTypeColumn.caseTypeColumn.label,
            callback: () => onStratifyMenuItemClick(stratifyableCaseTypeColumn.caseTypeColumn),
            active: stratification?.caseTypeColumn?.id === stratifyableCaseTypeColumn.caseTypeColumn.id,
            disabled: !stratifyableCaseTypeColumn.enabled,
          });
        });
      return draft;
    });
  }, [stratification, t, stratifyableColumns, stratify, onStratifyMenuItemClick]);

  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithAnchor | null>(null);

  const onNodeMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
  }, []);

  const parseIdsFromAnchorElement = useCallback((element: Element): string[] => {
    if (!stratification?.caseIdColors) {
      return [];
    }

    const caseIds: string[] = [];
    const color = element.getAttribute('data-color');

    Object.entries(stratification.caseIdColors).forEach(([caseId, rowColor]) => {
      if (rowColor === color) {
        caseIds.push(caseId);
      }
    });

    return caseIds;
  }, [stratification?.caseIdColors]);

  const onLegendaItemClick = useCallback((event: MouseEvent<HTMLDivElement>, legendaItem: StratificationLegendaItem) => {
    setFocussedLegendaItem(legendaItem);
    setEpiContextMenuConfig({
      anchorElement: event.currentTarget,
      parseIdsFromAnchorElement,
      mouseEvent: event.nativeEvent,
    });
  }, [parseIdsFromAnchorElement]);

  const onLegendaItemMouseOver = useCallback((color: string) => {
    highlightingManager.highlight({
      caseIds: Object.entries(stratification?.caseIdColors).filter(([_itemId, itemColor]) => itemColor === color).map(([itemId]) => itemId),
      origin: EPI_ZONE.LEGENDA,
    });
  }, [highlightingManager, stratification?.caseIdColors]);

  const onLegendaItemMouseLeave = useCallback(() => {
    highlightingManager.highlight({
      caseIds: [],
      origin: EPI_ZONE.LEGENDA,
    });
  }, [highlightingManager]);

  const onShowOnlySelectedLegendaItemMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    const filter = filters.find(f => f.id === stratification.caseTypeColumn.id);
    if (!filter) {
      return;
    }
    const filterValue = isArray(filter.initialFilterValue) ? [focussedLegendaItem.rowValue.raw] : focussedLegendaItem.rowValue.raw;

    await setFilterValue(stratification.caseTypeColumn.id, filterValue);
    onMenuClose();
  }, [focussedLegendaItem?.rowValue?.raw, setFilterValue, stratification?.caseTypeColumn?.id, filters]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (!focussedLegendaItem || focussedLegendaItem?.rowValue?.isMissing || !stratification?.caseTypeColumn?.id) {
      return null;
    }
    const filter = filters.find(f => f.id === stratification.caseTypeColumn.id);
    if (!filter) {
      return null;
    }

    return (
      <MenuItem
        divider
        // eslint-disable-next-line react/jsx-no-bind
        onClick={async () => onShowOnlySelectedLegendaItemMenuItemClick(onMenuClose)}
      >
        <ListItemIcon>
          <FilterAltIcon fontSize={'small'} />
        </ListItemIcon>
        <ListItemText>
          {t('Filter (show only {{label}})', { label: focussedLegendaItem.rowValue.short })}
        </ListItemText>
      </MenuItem>
    );
  }, [filters, focussedLegendaItem, onShowOnlySelectedLegendaItemMenuItemClick, stratification?.caseTypeColumn?.id, t]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <NestedDropdown
          ButtonProps={{
            variant: 'text',
            size: 'small',
            color: 'inherit',
            sx: {
              margin: 0,
              padding: 0,
              background: 'none !important',
              '& span': {
                margin: 0,
              },
              textTransform: 'none',
            },
          }}
          menuItemsData={stratificationMenu}
          showTopLevelTooltip
        />
      </Box>
      {stratification?.legendaItems.map(legendaItem => (
        <Box
          key={legendaItem.rowValue.raw ?? '-'}
          marginX={1}
        >
          <EpiLegendaItem
            color={legendaItem.color}
            disabled={legendaItem.caseIds.length === 0}
            // eslint-disable-next-line react/jsx-no-bind
            onItemClick={stratification.mode === STRATIFICATION_MODE.FIELD ? (event) => onLegendaItemClick(event, legendaItem) : undefined}
            onMouseLeave={onLegendaItemMouseLeave}
            onMouseOver={onLegendaItemMouseOver}
            rowValue={legendaItem.rowValue}
            tooltip
            tooltipProps={{
              placement: 'top',
              arrow: true,
            }}
          />
        </Box>
      ))}
      <EpiContextMenu
        config={epiContextMenuConfig}
        getExtraItems={getEpiContextMenuExtraItems}
        onMenuClose={onNodeMenuClose}
      />
    </Box>
  );
};
