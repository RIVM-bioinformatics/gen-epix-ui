import type { BoxProps } from '@mui/material';
import {
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  use,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';

import type { EpiContactDetailsDialogRefMethods } from '../EpiContactDetailsDialog';
import { EpiContactDetailsDialog } from '../EpiContactDetailsDialog';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { CaseUtil } from '../../../utils/CaseUtil';
import { GenericErrorMessage } from '../../ui/GenericErrorMessage';

export type EpiCaseContentProps = {
  readonly epiCase: CaseDbCase;
} & BoxProps;

export const EpiCaseContent = ({ epiCase, ...boxProps }: EpiCaseContentProps) => {
  const { t } = useTranslation();
  const epiContactDetailsDialogRef = useRef<EpiContactDetailsDialogRefMethods>(null);
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);

  const cols = useMemo(() => CaseTypeUtil.getCols(completeCaseType), [completeCaseType]);

  const onOrganizationLinkClick = useCallback((organizationId: string, organizationName: string) => {
    epiContactDetailsDialogRef.current.open({
      organizationId,
      organizationName,
    });
  }, []);

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Content`}
      </Typography>
      {!epiCase && (
        <GenericErrorMessage
          error={new Error('Case could not be found')}
        />
      )}
      {epiCase && (
        <Table size={'small'}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  width: 'calc(100% / 3)',
                }}
              >
                {t`Column`}
              </TableCell>
              <TableCell
                sx={{
                  width: 'calc(100% / 3 * 2)',
                }}
              >
                {t`Value`}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cols.map(col => {
              const refCol = completeCaseType.ref_cols[col.ref_col_id];
              const columnValue = CaseUtil.getRowValue(epiCase.content, col, completeCaseType);
              return (
                <TableRow key={col.id}>
                  <TableCell
                    sx={{
                      width: 'calc(100% / 3)',
                    }}
                  >
                    {col.label}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 'calc(100% / 3 * 2)',
                    }}
                  >
                    {refCol.col_type === CaseDbColType.ORGANIZATION && !columnValue.isMissing && (
                      <Link
                        color={'primary'}
                        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                        onClick={() => {
                          onOrganizationLinkClick(epiCase.content[col.id], columnValue.long);
                        }}
                        sx={{
                          cursor: 'pointer',
                        }}
                      >
                        {columnValue.long}
                      </Link>
                    )}
                    {refCol.col_type !== CaseDbColType.ORGANIZATION && (
                      <>
                        {columnValue.long}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      <EpiContactDetailsDialog ref={epiContactDetailsDialogRef} />
    </Box>
  );
};
