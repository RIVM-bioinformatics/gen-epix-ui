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
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import isArray from 'lodash/isArray';
import { produce } from 'immer';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import type { CaseDbCol } from '@gen-epix/api-casedb';

import type { EpiContextMenuConfigWithAnchor } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiLegendaItem } from '../EpiLegendaItem';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { EpiHighlightingManager } from '../../../classes/managers/EpiHighlightingManager';
import type { StratificationLegendaItem } from '../../../models/epi';
import {
  EPI_ZONE,
  STRATIFICATION_MODE,
} from '../../../models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { NestedDropdown } from '../../ui/NestedMenu';

export const EpiStratification = () => {
  const { t } = useTranslation();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const highlightingManager = useMemo(() => EpiHighlightingManager.instance, []);

  const stratification = useStore(epiDashboardStore, (state) => state.stratification);
  const stratify = useStore(epiDashboardStore, (state) => state.stratify);
  const setFilterValue = useStore(epiDashboardStore, (state) => state.setFilterValue);
  const filters = useStoreWithEqualityFn(epiDashboardStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => filter.filterValue)) === JSON.stringify(b.map(filter => filter.filterValue)));
  const stratifyableColumns = useStore(epiDashboardStore, (state) => state.stratifyableColumns);
  const [focussedLegendaItem, setFocussedLegendaItem] = useState<StratificationLegendaItem>(null);

  const onStratifyMenuItemClick = useCallback((col: CaseDbCol) => {
    if (col.id === stratification?.col?.id) {
      stratify(null);
      return;
    }
    stratify(STRATIFICATION_MODE.FIELD, col);
  }, [stratification?.col?.id, stratify]);

  const stratificationMenu = useMemo<MenuItemData>(() => {
    let label = t`Grouping`;
    if (stratification) {
      if (stratification.mode === STRATIFICATION_MODE.SELECTION) {
        label = t`Grouped by Selected rows`;
      } else {
        label = t('Grouped by {{fieldName}}', { fieldName: stratification.col.label });
      }
    }


    return produce<MenuItemData>({
      disabled: stratifyableColumns.length === 0,
      items: [{
        active: !stratification,
        callback: () => {
          stratify(null);
        },
        divider: true,
        label: 'None',
      },
      {
        active: stratification?.mode === STRATIFICATION_MODE.SELECTION,
        callback: () => {
          stratify(stratification?.mode === STRATIFICATION_MODE.SELECTION ? null : STRATIFICATION_MODE.SELECTION);
        },
        divider: true,
        label: 'Selected rows',
      }],
      label,
      tooltip: t('Grouping allows you to group cases by a selected field. Grouping will be disabled when the maximum unique values of the selected field exceeds {{max_stratification_unique_values}}.', { max_stratification_unique_values: ConfigManager.instance.config.epi.STRATIFICATION_COLORS.length }),
    }, draft => {
      stratifyableColumns
        .forEach(stratifyableCol => {
          draft.items.push({
            active: stratification?.col?.id === stratifyableCol.col.id,
            callback: () => onStratifyMenuItemClick(stratifyableCol.col),
            disabled: !stratifyableCol.enabled,
            label: stratifyableCol.col.label,
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
      mouseEvent: event.nativeEvent,
      parseIdsFromAnchorElement,
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
    const filter = filters.find(f => f.id === stratification.col.id);
    if (!filter) {
      return;
    }
    const filterValue = isArray(filter.initialFilterValue) ? [focussedLegendaItem.rowValue.raw] : focussedLegendaItem.rowValue.raw;

    await setFilterValue(stratification.col.id, filterValue);
    onMenuClose();
  }, [focussedLegendaItem?.rowValue?.raw, setFilterValue, stratification?.col?.id, filters]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (!focussedLegendaItem || focussedLegendaItem?.rowValue?.isMissing || !stratification?.col?.id) {
      return null;
    }
    const filter = filters.find(f => f.id === stratification.col.id);
    if (!filter) {
      return null;
    }

    return (
      <MenuItem
        divider
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
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
  }, [filters, focussedLegendaItem, onShowOnlySelectedLegendaItemMenuItemClick, stratification?.col?.id, t]);

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
            color: 'inherit',
            size: 'small',
            sx: {
              '& span': {
                margin: 0,
              },
              background: 'none !important',
              margin: 0,
              padding: 0,
              textTransform: 'none',
            },
            variant: 'text',
          }}
          menuItemsData={stratificationMenu}
          showTopLevelTooltip
        />
      </Box>
      {stratification?.legendaItems.map(legendaItem => (
        <Box
          key={legendaItem.rowValue.raw ?? '-'}
          sx={{
            marginX: 1,
          }}
        >
          <EpiLegendaItem
            color={legendaItem.color}
            disabled={legendaItem.caseIds.length === 0}

            onItemClick={stratification.mode === STRATIFICATION_MODE.FIELD ? (event) => onLegendaItemClick(event, legendaItem) : undefined}
            onMouseLeave={onLegendaItemMouseLeave}
            onMouseOver={onLegendaItemMouseOver}
            rowValue={legendaItem.rowValue}
            tooltip
            tooltipProps={{
              arrow: true,
              placement: 'top',
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
