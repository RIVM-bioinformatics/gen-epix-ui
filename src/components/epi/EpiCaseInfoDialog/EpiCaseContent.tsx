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
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import type { EpiContactDetailsDialogRefMethods } from '../EpiContactDetailsDialog';
import { EpiContactDetailsDialog } from '../EpiContactDetailsDialog';
import type { Case } from '../../../api';
import { ColType } from '../../../api';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import { CaseUtil } from '../../../utils/CaseUtil';
import { GenericErrorMessage } from '../../ui/GenericErrorMessage';

export type EpiCaseContentProps = {
  readonly epiCase: Case;
} & BoxProps;

export const EpiCaseContent = ({ epiCase, ...boxProps }: EpiCaseContentProps) => {
  const [t] = useTranslation();
  const epiContactDetailsDialogRef = useRef<EpiContactDetailsDialogRefMethods>(null);
  const epiStore = useContext(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);

  const caseTypeCols = useMemo(() => CaseTypeUtil.getCaseTypeCols(completeCaseType), [completeCaseType]);

  const onOrganizationLinkClick = useCallback((contactId: string) => {
    epiContactDetailsDialogRef.current.open({
      contactId,
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
            {caseTypeCols.map(caseTypeCol => {
              const column = completeCaseType.cols[caseTypeCol.col_id];
              const columnValue = CaseUtil.getRowValue(epiCase.content, caseTypeCol, completeCaseType);
              return (
                <TableRow key={caseTypeCol.id}>
                  <TableCell
                    sx={{
                      width: 'calc(100% / 3)',
                    }}
                  >
                    {caseTypeCol.label}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 'calc(100% / 3 * 2)',
                    }}
                  >
                    {column.col_type === ColType.ORGANIZATION && !columnValue.isMissing && (
                      <Link
                        sx={{
                          cursor: 'pointer',
                        }}
                        color={'primary'}
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={() => {
                          onOrganizationLinkClick(epiCase.content[caseTypeCol.id]);
                        }}
                      >
                        {columnValue.long}
                      </Link>
                    )}
                    {column.col_type !== ColType.ORGANIZATION && (
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
