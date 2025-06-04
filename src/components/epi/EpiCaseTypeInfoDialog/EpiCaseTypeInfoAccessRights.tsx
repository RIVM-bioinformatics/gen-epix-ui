import { useMemo } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableHead,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import { t } from 'i18next';

import type { CompleteCaseType } from '../../../api';
import { useEpiCaseTypeAbacContext } from '../../../context/epiCaseTypeAbac';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';

export type EpiCaseTypeInfoAccessRightsProps = {
  readonly completeCaseType: CompleteCaseType;
};

export const EpiCaseTypeInfoAccessRights = ({ completeCaseType }: EpiCaseTypeInfoAccessRightsProps) => {
  const caseTypeColumns = useMemo(() => EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType), [completeCaseType]);
  const caseTypeAbacContext = useEpiCaseTypeAbacContext();

  return (
    <>
      {(caseTypeAbacContext.caseTypeAccessAbacs ?? []).map(caseTypeAccessAbac => {
        const dataCollection = caseTypeAbacContext.userDataCollectionsMap.get(caseTypeAccessAbac.data_collection_id);
        return (
          <Accordion
            key={`${dataCollection.id}`}
            slotProps={{ transition: { unmountOnExit: true } }}
          >
            <AccordionSummary
              aria-controls={`panel-${dataCollection.id}`}
              expandIcon={<ExpandMoreIcon />}
              id={`panel-${dataCollection.id}-header`}
              sx={{
                fontWeight: 'bold',
              }}
            >
              {dataCollection.name}
            </AccordionSummary>
            <AccordionDetails>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                      {t`Case type column`}
                    </TableCell>
                    <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                      {t`Read`}
                    </TableCell>
                    <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                      {t`Write`}
                    </TableCell>
                    <TableCell sx={{ width: '40%' }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {caseTypeColumns.map(caseTypeColumn => {
                    return (
                      <TableRow key={caseTypeColumn.id}>
                        <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                          {caseTypeColumn.label}
                        </TableCell>
                        <TableCell
                          sx={{ width: '20%', verticalAlign: 'top' }}
                        >
                          { caseTypeAccessAbac.read_case_type_col_ids.includes(caseTypeColumn.id) ? t`Yes` : t`No`}
                        </TableCell>
                        <TableCell
                          sx={{ width: '20%', verticalAlign: 'top' }}
                        >
                          { caseTypeAccessAbac.write_case_type_col_ids.includes(caseTypeColumn.id) ? t`Yes` : t`No`}
                        </TableCell>
                        <TableCell sx={{ width: '40%' }} />
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};
