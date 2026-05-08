import type { TooltipProps } from '@mui/material';
import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import { ConfigManager } from '@gen-epix/ui';
import { useStore } from 'zustand';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import type {
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import {
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import isArray from 'lodash/isArray';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import type { CaseDbConfig } from '../../../models/config';
import { EpiHighlightingManager } from '../../../classes/managers/EpiHighlightingManager';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import type { StratificationLegendaItem } from '../../../models/epi';
import {
  EPI_ZONE,
  STRATIFICATION_MODE,
} from '../../../models/epi';
import {
  EpiContextMenu,
  type EpiContextMenuConfigWithAnchor,
} from '../EpiContextMenu';

export type EpiLegendaItemProps = {
  readonly children?: ReactNode;
  readonly item: StratificationLegendaItem;
  readonly tooltip?: boolean;
  readonly tooltipProps?: Partial<TooltipProps>;
};

export const EpiLegendaItem = ({ children, item, tooltip, tooltipProps }: EpiLegendaItemProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const stratification = useStore(epiDashboardStore, (state) => state.stratification);
  const setFilterValue = useStore(epiDashboardStore, (state) => state.setFilterValue);
  const filters = useStoreWithEqualityFn(epiDashboardStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => filter.filterValue)) === JSON.stringify(b.map(filter => filter.filterValue)));
  const [focussedLegendaItem, setFocussedLegendaItem] = useState<StratificationLegendaItem>(null);
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithAnchor | null>(null);

  const highlightingManager = useMemo(() => EpiHighlightingManager.getInstance(), []);

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

  const onClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    setFocussedLegendaItem(item);
    setEpiContextMenuConfig({
      anchorElement: event.currentTarget,
      mouseEvent: event.nativeEvent,
      parseIdsFromAnchorElement,
    });
  }, [item, parseIdsFromAnchorElement]);

  const onMouseOver = useCallback(() => {
    highlightingManager.highlight({
      caseIds: Object.entries(stratification?.caseIdColors).filter(([_itemId, itemColor]) => itemColor === item.color).map(([itemId]) => itemId),
      origin: EPI_ZONE.LEGENDA,
    });
  }, [item.color, highlightingManager, stratification]);

  const onMouseLeave = useCallback(() => {
    highlightingManager.highlight({
      caseIds: [],
      origin: EPI_ZONE.LEGENDA,
    });
  }, [highlightingManager]);

  const onNodeMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
  }, []);

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

  const disabled = stratification.mode !== STRATIFICATION_MODE.FIELD || item.caseIds.length === 0;

  const innerContent = useMemo(() => {
    const value = item.rowValue.isMissing ? ConfigManager.getInstance<CaseDbConfig>().config.epi.DATA_MISSING_CHARACTER : item.rowValue.short;
    return (
      <Box
        sx={{
          alignItems: 'center',
          cursor: disabled ? 'initial' : 'pointer',
          display: 'flex',
          opacity: disabled ? 0.3 : 1,
        }}
      >
        <Box
          sx={{
            background: item.color,
            height: theme.spacing(2),
            marginRight: theme.spacing(1),
            minHeight: theme.spacing(2),
            minWidth: theme.spacing(2),
            width: theme.spacing(2),
          }}
        />
        <Box
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {children || value}
        </Box>
      </Box>
    );
  }, [children, disabled, item.color, item.rowValue.isMissing, item.rowValue.short, theme]);

  return (
    <>
      <Box
        component={'div'}
        data-color={item.color}
        onClick={disabled ? undefined : onClick}
        onMouseLeave={onMouseLeave}
        onMouseOver={onMouseOver}
      >
        {tooltip && (
          <Tooltip
            {...tooltipProps}
            title={item.rowValue.full}
          >
            {innerContent}
          </Tooltip>
        )}
        {!tooltip && innerContent}
      </Box>
      <EpiContextMenu
        config={epiContextMenuConfig}
        getExtraItems={getEpiContextMenuExtraItems}
        onMenuClose={onNodeMenuClose}
      />
    </>
  );
};
