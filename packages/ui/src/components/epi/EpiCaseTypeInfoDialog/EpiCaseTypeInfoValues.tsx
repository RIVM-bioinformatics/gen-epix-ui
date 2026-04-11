import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
      {completeCaseType.ordered_dim_ids.map(x => completeCaseType.dims[x]).filter(dim => {
        // Filter out dimensions that only include genetic distance columns
        const refDim = completeCaseType.ref_dims[dim.ref_dim_id];
        if (refDim.dim_type !== DimType.OTHER) {
          return true;
        }
        const cols = CaseTypeUtil.getCols(completeCaseType, dim.id);
        const colTypes = cols.map(col => {
          const refCol = completeCaseType.ref_cols[col.ref_col_id];
          return refCol.col_type;
        });
        return !colTypes.every(colType => colType === 'GENETIC_DISTANCE');
      }).map(dim => {

        return (
          <Accordion
            key={`${dim.id}-${dim.occurrence ?? 0}`}
            slotProps={{ transition: { unmountOnExit: true } }}
          >
            <AccordionSummary
              aria-controls={`panel-${dim.code}-${dim.occurrence ?? 0}-content`}
              expandIcon={<ExpandMoreIcon />}
              id={`panel-${dim.code}-${dim.occurrence ?? 0}-header`}
              sx={{
                fontWeight: 'bold',
              }}
            >
              {CaseTypeUtil.getDimLabel(completeCaseType, dim.id)}
            </AccordionSummary>
            <AccordionDetails>
              <EpiCaseTypeInfoVariableDetails
                completeCaseType={completeCaseType}
                dim={dim}
              />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};
