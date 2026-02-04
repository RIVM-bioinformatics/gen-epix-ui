import {
  Fragment,
  useCallback,
  useContext,
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

import type { Case } from '../../../api';
import type { TableColumnCaseType } from '../../../models/table';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { useTableStoreContext } from '../../../stores/tableStore';
import { CaseUtil } from '../../../utils/CaseUtil';

export type EpiCaseSummaryProps = {
  readonly epiCase: Case;
};

export const EpiCaseSummary = ({ epiCase }: EpiCaseSummaryProps) => {
  const { t } = useTranslation();
  const epiStore = useContext(EpiDashboardStoreContext);
  const tableStore = useTableStoreContext<Case>();
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);
  const numVisibleAttributesInSummary = useStore(epiStore, (state) => state.numVisibleAttributesInSummary);
  const setNumVisibleAttributesInSummary = useStore(epiStore, (state) => state.setNumVisibleAttributesInSummary);
  const tableColumns = useStore(tableStore, useShallow((state) => state.columns));
  const columnSettings = useStore(tableStore, useShallow((state) => state.columnSettings));
  const visibleColumnIds = useStore(tableStore, useShallow((state) => state.columnSettings.filter(c => c.isVisible).map(c => c.id)));

  const visibleCaseTypeTableColumns = useMemo(() => columnSettings.map(x => tableColumns.find(c => c.id === x.id)).filter(c => c.type === 'caseType' && visibleColumnIds.includes(c.id)) as TableColumnCaseType<Case>[], [columnSettings, tableColumns, visibleColumnIds]);

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
          clear: 'both',
          margin: 0,
          '& dt': {
            fontWeight: 'bold',
            display: 'inline-block',
            float: 'left',
            clear: 'left',
            margin: 0,
            '&:after': {
              content: '":"',
            },
          },
          '& dd': {
            display: 'inline-block',
            float: 'left',
            margin: 0,
            marginLeft: 0.5,
          },
        }}
      >
        {visibleAttributes.map(tableColumn => {
          try {
            const value = CaseUtil.getRowValue(epiCase.content, tableColumn.caseTypeCol, completeCaseType);
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
            size={'small'}
            onClick={onRemoveAttributeClick}
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
            size={'small'}
            onClick={onAddAttributeClick}
          >
            <AddIcon fontSize={'inherit'} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
