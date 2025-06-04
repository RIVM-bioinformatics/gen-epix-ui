import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import type { CompleteCaseType } from '../../../api';
import { DimType } from '../../../api';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';

import { EpiCaseTypeInfoVariableDetails } from './EpiCaseTypeInfoVariableDetails';

export type EpiCaseTypeInfoValuesProps = {
  readonly completeCaseType: CompleteCaseType;
};

export const EpiCaseTypeInfoValues = ({ completeCaseType }: EpiCaseTypeInfoValuesProps) => {
  return (
    <>
      {completeCaseType.case_type_dims.filter(caseTypeDim => {
        // Filter out dimensions that only include genetic distance columns
        const dim = completeCaseType.dims[caseTypeDim.dim_id];
        if (dim.dim_type !== DimType.OTHER) {
          return true;
        }
        const caseTypeColumns = EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType, caseTypeDim.dim_id);
        const colTypes = caseTypeColumns.map(caseTypeColumn => {
          const col = completeCaseType.cols[caseTypeColumn.col_id];
          return col.col_type;
        });
        return !colTypes.every(colType => colType === 'GENETIC_DISTANCE');
      }).map(caseTypeDim => {
        const dimension = completeCaseType.dims[caseTypeDim.dim_id];
        const dimensionCaseTypeColumns = caseTypeDim.case_type_col_order.map(caseTypeColId => completeCaseType.case_type_cols[caseTypeColId]);
        const occurrence = dimensionCaseTypeColumns.find(c => c.occurrence)?.occurrence;

        return (
          <Accordion
            key={`${dimension.id}-${occurrence ?? 0}`}
            slotProps={{ transition: { unmountOnExit: true } }}
          >
            <AccordionSummary
              aria-controls={`panel-${dimension.code}-${occurrence ?? 0}-content`}
              expandIcon={<ExpandMoreIcon />}
              id={`panel-${dimension.code}-${occurrence ?? 0}-header`}
              sx={{
                fontWeight: 'bold',
              }}
            >
              {EpiCaseTypeUtil.getDimensionLabel(dimension, occurrence)}
            </AccordionSummary>
            <AccordionDetails>
              <EpiCaseTypeInfoVariableDetails
                caseTypeDim={caseTypeDim}
                completeCaseType={completeCaseType}
                dimension={dimension}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};
