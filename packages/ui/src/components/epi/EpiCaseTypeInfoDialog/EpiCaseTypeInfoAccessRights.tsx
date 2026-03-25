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
import { useCaseTypeAbacContext } from '../../../context/caseTypeAbac';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

export type EpiCaseTypeInfoAccessRightsProps = {
  readonly completeCaseType: CompleteCaseType;
};

export const EpiCaseTypeInfoAccessRights = ({ completeCaseType }: EpiCaseTypeInfoAccessRightsProps) => {
  const cols = useMemo(() => CaseTypeUtil.getCols(completeCaseType), [completeCaseType]);
  const caseTypeAbacContext = useCaseTypeAbacContext();

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
              <Table size={'small'}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                      {t`Column`}
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
                  {cols.map(col => {
                    return (
                      <TableRow key={col.id}>
                        <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                          {col.label}
                        </TableCell>
                        <TableCell
                          sx={{ width: '20%', verticalAlign: 'top' }}
                        >
                          { caseTypeAccessAbac.read_col_ids.includes(col.id) ? t`Yes` : t`No`}
                        </TableCell>
                        <TableCell
                          sx={{ width: '20%', verticalAlign: 'top' }}
                        >
                          { caseTypeAccessAbac.write_col_ids.includes(col.id) ? t`Yes` : t`No`}
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
