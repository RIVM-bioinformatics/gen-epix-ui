import { Box } from '@mui/material';
import {
  use,
  useCallback,
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { produce } from 'immer';
import type { CaseDbCol } from '@gen-epix/api-casedb';
import type { MenuItemData } from '@gen-epix/ui';
import {
  ConfigService,
  NestedDropdown,
} from '@gen-epix/ui';

import { LegendaItem } from '../LegendaItem';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { STRATIFICATION_MODE } from '../../../models/caseDb';
import type { CaseDbConfig } from '../../../models/config';

export const Grouping = () => {
  const { t } = useTranslation();

  const dashboardStore = use(DashboardStoreContext);
  const stratification = useStore(dashboardStore, (state) => state.stratification);
  const stratify = useStore(dashboardStore, (state) => state.stratify);
  const stratifyableColumns = useStore(dashboardStore, (state) => state.stratifyableColumns);

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
      tooltip: t('Grouping allows you to group cases by a selected field. Grouping will be disabled when the maximum unique values of the selected field exceeds {{max_stratification_unique_values}}.', {
        max_stratification_unique_values: ConfigService.getInstance<CaseDbConfig>().config.epi.STRATIFICATION.MAX_ALLOWED_UNIQUE_VALUES,
      }),
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
          <LegendaItem
            item={legendaItem}
            tooltip
            tooltipProps={{
              arrow: true,
              placement: 'top',
            }}
          />
        </Box>
      ))}
    </Box>
  );
};
