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
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import type { StratificationLegendaItem } from '../../../models/epi';
import {
  STRATIFICATION_MODE,
  STRATIFICATION_SELECTED,
} from '../../../models/epi';
import { EpiContextMenu } from '../EpiContextMenu';
import type { EpiContextMenuConfigWithAnchor } from '../EpiContextMenu';
import { EPI_WIDGET_NAME } from '../../../data/epi';
import { EpiDashboardContext } from '../EpiDashboard/context/EpiDashboardContext';

export type EpiLegendaItemProps = {
  readonly children?: ReactNode;
  readonly item: StratificationLegendaItem;
  readonly tooltip?: boolean;
  readonly tooltipProps?: Partial<TooltipProps>;
};

export const EpiLegendaItem = ({ children, item, tooltip, tooltipProps }: EpiLegendaItemProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const epiDashboardContext = use(EpiDashboardContext);
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const stratification = useStore(epiDashboardStore, (state) => state.stratification);
  const sortedData = useStore(epiDashboardStore, (state) => state.sortedData);
  const setFilterValue = useStore(epiDashboardStore, (state) => state.setFilterValue);
  const filters = useStoreWithEqualityFn(epiDashboardStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => filter.filterValue)) === JSON.stringify(b.map(filter => filter.filterValue)));
  const [focussedLegendaItem, setFocussedLegendaItem] = useState<StratificationLegendaItem>(null);
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithAnchor | null>(null);

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
    setEpiContextMenuConfig({
      anchorElement: event.currentTarget,
      mouseEvent: event.nativeEvent,
      parseIdsFromAnchorElement,
    });
  }, [item, parseIdsFromAnchorElement]);

  const onMouseOver = useCallback(() => {
    epiDashboardContext.highlight({
      caseIds: Object.entries(stratification?.caseIdColors).filter(([_itemId, itemColor]) => itemColor === item.color).map(([itemId]) => itemId),
      origin: EPI_WIDGET_NAME.LEGENDA,
    });
  }, [item.color, stratification, epiDashboardContext]);

  const onMouseLeave = useCallback(() => {
    epiDashboardContext.highlight({
      caseIds: [],
      origin: EPI_WIDGET_NAME.LEGENDA,
    });
  }, [epiDashboardContext]);

  const onNodeMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
  }, []);

  const onShowOnlySelectedLegendaItemMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    if (stratification?.mode === STRATIFICATION_MODE.SELECTION) {
      if (focussedLegendaItem.rowValue.raw === STRATIFICATION_SELECTED.SELECTED.toString()) {
        await setFilterValue('selected', focussedLegendaItem.caseIds);
      } else {
        await setFilterValue('selected', focussedLegendaItem.caseIds);
      }
    } else {
      const filter = filters.find(f => f.id === stratification.col.id);
      if (!filter) {
        return;
      }
      const filterValue = isArray(filter.initialFilterValue) ? [focussedLegendaItem.rowValue.raw] : focussedLegendaItem.rowValue.raw;

      await setFilterValue(stratification.col.id, filterValue);
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
    } else {
      if (!focussedLegendaItem || focussedLegendaItem?.rowValue?.isMissing || !stratification?.col?.id) {
        return null;
      }
      const filter = filters.find(f => f.id === stratification.col.id);
      if (!filter) {
        return null;
      }
      label = t('Filter (show only {{label}})', { label: focussedLegendaItem.rowValue.short });
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
      <EpiContextMenu
        config={epiContextMenuConfig}
        getExtraItems={getEpiContextMenuExtraItems}
        onMenuClose={onNodeMenuClose}
      />
    </>
  );
};
