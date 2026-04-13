import { useMemo } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Table,
  TableBody,
  TableCell,
  TableHead,
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
                    <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                      {t`Column`}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                      {t`Read`}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                      {t`Write`}
                    </TableCell>
                    <TableCell sx={{ width: '40%' }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cols.map(col => {
                    return (
                      <TableRow key={col.id}>
                        <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                          {col.label}
                        </TableCell>
                        <TableCell
                          sx={{ verticalAlign: 'top', width: '20%' }}
                        >
                          { caseTypeAccessAbac.read_col_ids.includes(col.id) ? t`Yes` : t`No`}
                        </TableCell>
                        <TableCell
                          sx={{ verticalAlign: 'top', width: '20%' }}
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
