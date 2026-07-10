import type { TooltipProps } from '@mui/material';
import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import { ConfigService } from '@gen-epix/ui';
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
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import type { StratificationLegendaItem } from '../../../models/stratification';
import {
  STRATIFICATION_MODE,
  STRATIFICATION_SELECTED,
} from '../../../models/stratification';
import { ContextMenu } from '../ContextMenu';
import type { ContextMenuConfigWithAnchor } from '../ContextMenu';
import { DASHBOARD_WIDGET_NAME } from '../../../data/dashboard';
import { DashboardContext } from '../Dashboard/context/DashboardContext';

export type LegendaItemProps = {
  readonly children?: ReactNode;
  readonly item: StratificationLegendaItem;
  readonly tooltip?: boolean;
  readonly tooltipProps?: Partial<TooltipProps>;
};

export const LegendaItem = ({ children, item, tooltip, tooltipProps }: LegendaItemProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const dashboardContext = use(DashboardContext);
  const dashboardStore = use(DashboardStoreContext);
  const stratification = useStore(dashboardStore, (state) => state.stratification);
  const sortedData = useStore(dashboardStore, (state) => state.sortedData);
  const setFilterValue = useStore(dashboardStore, (state) => state.setFilterValue);
  const filters = useStoreWithEqualityFn(dashboardStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => filter.filterValue)) === JSON.stringify(b.map(filter => filter.filterValue)));
  const [focussedLegendaItem, setFocussedLegendaItem] = useState<StratificationLegendaItem>(null);
  const [contextMenuConfig, setContextMenuConfig] = useState<ContextMenuConfigWithAnchor | null>(null);

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
  }, [stratification]);

  const onClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    setFocussedLegendaItem(item);
    setContextMenuConfig({
      anchorElement: event.currentTarget,
      mouseEvent: event.nativeEvent,
      parseIdsFromAnchorElement,
    });
  }, [item, parseIdsFromAnchorElement]);

  const onMouseOver = useCallback(() => {
    dashboardContext.highlight({
      caseIds: Object.entries(stratification?.caseIdColors).filter(([_itemId, itemColor]) => itemColor === item.color).map(([itemId]) => itemId),
      origin: DASHBOARD_WIDGET_NAME.LEGENDA,
    });
  }, [item.color, stratification, dashboardContext]);

  const onMouseLeave = useCallback(() => {
    dashboardContext.highlight({
      caseIds: [],
      origin: DASHBOARD_WIDGET_NAME.LEGENDA,
    });
  }, [dashboardContext]);

  const onNodeMenuClose = useCallback(() => {
    setContextMenuConfig(null);
  }, []);

  const onShowOnlySelectedLegendaItemMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    if (stratification?.mode === STRATIFICATION_MODE.SELECTION) {
      if (focussedLegendaItem.rowValue.raw === STRATIFICATION_SELECTED.SELECTED.toString()) {
        await setFilterValue('selected', focussedLegendaItem.caseIds);
      } else {
        await setFilterValue('selected', focussedLegendaItem.caseIds);
      }
    } else if (stratification?.mode === STRATIFICATION_MODE.FIELD) {
      const filter = filters.find(f => f.id === stratification.col.id);
      if (filter) {
        const filterValue = isArray(filter.initialFilterValue) ? [focussedLegendaItem.rowValue.raw] : focussedLegendaItem.rowValue.raw;
        await setFilterValue(stratification.col.id, filterValue);
      }
    } else {
      // not implemented
    }

    onMenuClose();
  }, [filters, focussedLegendaItem, setFilterValue, stratification]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (!focussedLegendaItem) {
      return null;
    }
    let label: string;

    if (stratification?.mode === STRATIFICATION_MODE.SELECTION) {
      if (!focussedLegendaItem.caseIds?.length || focussedLegendaItem.caseIds?.length === sortedData.length) {
        return null;
      }
      label = t('Filter (show only {{label}})', { label: focussedLegendaItem?.rowValue?.raw === STRATIFICATION_SELECTED.SELECTED.toString() ? t('selected rows') : t('unselected rows') });
    } else if (stratification?.mode === STRATIFICATION_MODE.FIELD) {
      if (!focussedLegendaItem || focussedLegendaItem?.rowValue?.isMissing || !stratification?.col?.id) {
        return null;
      }
      const filter = filters.find(f => f.id === stratification.col.id);
      if (!filter) {
        return null;
      }
      label = t('Filter (show only {{label}})', { label: focussedLegendaItem.rowValue.short });
    } else {
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
          {label}
        </ListItemText>
      </MenuItem>
    );
  }, [filters, focussedLegendaItem, onShowOnlySelectedLegendaItemMenuItemClick, stratification, t, sortedData]);

  const disabled = stratification?.mode === STRATIFICATION_MODE.FIELD && item.caseIds.length === 0;

  const innerContent = useMemo(() => {
    const value = item.rowValue.isMissing ? ConfigService.getInstance<CaseDbConfig>().config.epi.DATA_MISSING_CHARACTER : item.rowValue.short;
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
            outline: `1px solid ${theme.palette.background.paper}`,
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
      <ContextMenu
        config={contextMenuConfig}
        getExtraItems={getEpiContextMenuExtraItems}
        onMenuClose={onNodeMenuClose}
      />
    </>
  );
};
