import {
  Fragment,
  use,
  useCallback,
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import {
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useTranslation } from 'react-i18next';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import type { TableColumnCaseType } from '@gen-epix/ui';
import { useTableStoreContext } from '@gen-epix/ui';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseUtil } from '../../../utils/CaseUtil';

export type EpiCaseSummaryProps = {
  readonly epiCase: CaseDbCase;
};

export const EpiCaseSummary = ({ epiCase }: EpiCaseSummaryProps) => {
  const { t } = useTranslation();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const tableStore = useTableStoreContext<CaseDbCase>();
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const numVisibleAttributesInSummary = useStore(epiDashboardStore, (state) => state.numVisibleAttributesInSummary);
  const setNumVisibleAttributesInSummary = useStore(epiDashboardStore, (state) => state.setNumVisibleAttributesInSummary);
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));
  const columnVisualSettings = useStore(tableStore, useShallow((state) => state.columnVisualSettings));
  const columnVisualSettingsVisibleColumnIds = useStore(tableStore, useShallow((state) => state.columnVisualSettings.filter(c => c.isVisible).map(c => c.id)));

  const visibleCaseTypeTableColumns = useMemo(() => columnVisualSettings.map(x => tableColumns.find(c => c.id === x.id)).filter(c => c.type === 'caseType' && columnVisualSettingsVisibleColumnIds.includes(c.id)) as TableColumnCaseType<CaseDbCase>[], [columnVisualSettings, tableColumns, columnVisualSettingsVisibleColumnIds]);

  const visibleAttributes = useMemo(() => {
    return visibleCaseTypeTableColumns.slice(0, numVisibleAttributesInSummary);
  }, [visibleCaseTypeTableColumns, numVisibleAttributesInSummary]);

  const onRemoveAttributeClick = useCallback(() => {
    if (numVisibleAttributesInSummary <= 1) {
      return;
    }
    if (numVisibleAttributesInSummary > visibleCaseTypeTableColumns.length) {
      setNumVisibleAttributesInSummary(visibleCaseTypeTableColumns.length);
    }
    if (numVisibleAttributesInSummary > 1) {
      setNumVisibleAttributesInSummary(numVisibleAttributesInSummary - 1);
    }
  }, [numVisibleAttributesInSummary, setNumVisibleAttributesInSummary, visibleCaseTypeTableColumns.length]);

  const onAddAttributeClick = useCallback(() => {
    setNumVisibleAttributesInSummary(Math.min(visibleCaseTypeTableColumns.length, numVisibleAttributesInSummary + 1));
  }, [numVisibleAttributesInSummary, setNumVisibleAttributesInSummary, visibleCaseTypeTableColumns.length]);

  return (
    <Box>
      <Box
        component={'dl'}
        sx={{
          '& dd': {
            display: 'inline-block',
            float: 'left',
            margin: 0,
            marginLeft: 0.5,
          },
          '& dt': {
            '&:after': {
              content: '":"',
            },
            clear: 'left',
            display: 'inline-block',
            float: 'left',
            fontWeight: 'bold',
            margin: 0,
          },
          clear: 'both',
          margin: 0,
        }}
      >
        {visibleAttributes.map(tableColumn => {
          try {
            const value = CaseUtil.getRowValue(epiCase.content, tableColumn.col, completeCaseType);
            return (
              <Fragment key={tableColumn.id}>
                <dt>
                  {tableColumn.headerName}
                </dt>
                <dd>
                  {value.short}
                </dd>
              </Fragment>
            );
          } catch {
            return null;
          }
        })}
      </Box>
      <Box
        sx={{
          clear: 'both',
          float: 'right',
        }}
      >
        <Tooltip
          arrow
          title={t`Show one less attribute`}
        >
          <IconButton
            aria-label={t`Show one less attribute`}
            color={'primary'}
            disabled={numVisibleAttributesInSummary <= 1}
            onClick={onRemoveAttributeClick}
            size={'small'}
          >
            <RemoveIcon fontSize={'inherit'} />
          </IconButton>
        </Tooltip>
        <Tooltip
          arrow
          title={t`Show one more attribute`}
        >
          <IconButton
            aria-label={t`Show one more attribute`}
            color={'primary'}
            disabled={numVisibleAttributesInSummary >= visibleCaseTypeTableColumns.length - 1}
            onClick={onAddAttributeClick}
            size={'small'}
          >
            <AddIcon fontSize={'inherit'} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
