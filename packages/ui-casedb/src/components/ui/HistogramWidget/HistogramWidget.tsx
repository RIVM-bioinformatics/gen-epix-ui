import { Box } from '@mui/system';
import { t } from 'i18next';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type {
  CaseDbCol,
  CaseDbRefColValidationRulesResponseBody,
} from '@gen-epix/api-casedb';
import type { MenuItemData } from '@gen-epix/ui';
import { useStore } from 'zustand';

import { DASHBOARD_WIDGET_NAME } from '../../../data/dashboard';
import type { ContextMenuConfigWithPosition } from '../ContextMenu';
import { ContextMenu } from '../ContextMenu';
import { DashboardWidget } from '../Dashboard';
import { WidgetUnavailable } from '../WidgetUnavailable';
import { DashboardStoreContext } from '../../../stores/dashboardStore';

export const HistogramWidget = () => {
  const dashboardStore = use(DashboardStoreContext);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);

  const allowedColTypes = useMemo<CaseDbColType[]>(() => {
    return [CaseDbColType.INTERVAL, CaseDbColType.NOMINAL, CaseDbColType.ORDINAL] as CaseDbColType[];
  }, []);

  const allowedCols = useMemo(() => {
    if (!completeCaseType) {
      return [];
    }
    return completeCaseType.ordered_col_ids.reduce<CaseDbCol[]>((acc, colId) => {
      const col = completeCaseType.cols[colId];
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      if (allowedColTypes.includes(refCol.col_type)) {
        acc.push(col);
      }
      return acc;
    }, []);

  }, [allowedColTypes, completeCaseType]);

  // const xAxisCol = useState<CaseDbCol | null>(null);
  // const otherCol = useState<CaseDbCol | null>(null);

  console.log(allowedCols);

  useEffect(() => {
    completeCaseType.ordered_col_ids.forEach(colId => {
      const col = completeCaseType.cols[colId];
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      console.log(col.label, refCol.col_type);
    });
  }, [completeCaseType.cols, completeCaseType.ordered_col_ids, completeCaseType.ref_cols]);

  const [contextMenuConfig, setContextMenuConfig] = useState<ContextMenuConfigWithPosition | null>(null);

  const onEpiContextMenuClose = useCallback(() => {
    setContextMenuConfig(null);
  }, []);

  const shouldShowWidget = true;
  const isDataLoading = false;
  const col1: CaseDbCol = null;
  const col2: CaseDbRefColValidationRulesResponseBody = null;
  const histogramCaseCount = 0;
  const missingCasesCount = 0;
  const missingCasesPercentage = 0;

  const titleMenu = useMemo<MenuItemData>(() => {
    let label: string;
    if (col1 && col2) {
      label = t('Histogram: {{label}}', { label: col1.label });
    } else {
      label = t`Histogram`;
    }

    const menu: MenuItemData = {
      // disabled: !timeDims.length,
      items: [],
      label,
      // tooltip: col ? completeCaseType.ref_cols[col.ref_col_id].description : undefined,
    };

    // allowedCols.forEach(col => {
    //   menu.push();
    // });


    return menu;
  }, [col1, col2]);

  return (
    <DashboardWidget
      expandDisabled={!shouldShowWidget}
      isLoading={isDataLoading}
      title={titleMenu}
      warningMessage={shouldShowWidget && histogramCaseCount > 0 && missingCasesCount > 0 ? t('Missing cases: {{missingCasesCount}} ({{missingCasesPercentage}}%)', { missingCasesCount, missingCasesPercentage }) : undefined}
      widgetName={DASHBOARD_WIDGET_NAME.EPI_CURVE}
    >
      {!shouldShowWidget && (
        <WidgetUnavailable
          widgetLabel={t`Epi Curve`}
        />
      )}
      {shouldShowWidget && (
        <Box
          sx={{
            height: '100%',
            position: 'relative',
          }}
        >
          { 'HISTOGRAM' }
          <ContextMenu
            config={contextMenuConfig}
            // getExtraItems={getEpiContextMenuExtraItems}
            onMenuClose={onEpiContextMenuClose}
          />
        </Box>
      )}
    </DashboardWidget>
  );
};
