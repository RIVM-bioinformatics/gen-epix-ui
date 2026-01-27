import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import type { CompleteCaseType } from '../../../api';
import { DimType } from '../../../api';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

import { EpiCaseTypeInfoVariableDetails } from './EpiCaseTypeInfoVariableDetails';

export type EpiCaseTypeInfoValuesProps = {
  readonly completeCaseType: CompleteCaseType;
};

export const EpiCaseTypeInfoValues = ({ completeCaseType }: EpiCaseTypeInfoValuesProps) => {
  return (
    <>
      {completeCaseType.ordered_case_type_dim_ids.map(x => completeCaseType.case_type_dims[x]).filter(caseTypeDim => {
        // Filter out dimensions that only include genetic distance columns
        const dim = completeCaseType.dims[caseTypeDim.dim_id];
        if (dim.dim_type !== DimType.OTHER) {
          return true;
        }
        const caseTypeCols = CaseTypeUtil.getCaseTypeCols(completeCaseType, caseTypeDim.id);
        const colTypes = caseTypeCols.map(caseTypeCol => {
          const col = completeCaseType.cols[caseTypeCol.col_id];
          return col.col_type;
        });
        return !colTypes.every(colType => colType === 'GENETIC_DISTANCE');
      }).map(caseTypeDim => {

        return (
          <Accordion
            key={`${caseTypeDim.id}-${caseTypeDim.occurrence ?? 0}`}
            slotProps={{ transition: { unmountOnExit: true } }}
          >
            <AccordionSummary
              aria-controls={`panel-${caseTypeDim.code}-${caseTypeDim.occurrence ?? 0}-content`}
              expandIcon={<ExpandMoreIcon />}
              id={`panel-${caseTypeDim.code}-${caseTypeDim.occurrence ?? 0}-header`}
              sx={{
                fontWeight: 'bold',
              }}
            >
              {CaseTypeUtil.getDimensionLabel(completeCaseType, caseTypeDim.id)}
            </AccordionSummary>
            <AccordionDetails>
              <EpiCaseTypeInfoVariableDetails
                caseTypeDimension={caseTypeDim}
                completeCaseType={completeCaseType}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};
