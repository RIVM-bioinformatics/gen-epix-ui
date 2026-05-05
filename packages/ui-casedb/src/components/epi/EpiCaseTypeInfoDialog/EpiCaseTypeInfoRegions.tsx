import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import uniq from 'lodash/uniq';
import type { CaseDbCompleteCaseType } from '@gen-epix/api-casedb';

import { EpiDataManager } from '../../../classes/managers/EpiDataManager';

export type EpiCaseTypeInfoRegionsProps = {
  readonly completeCaseType: CaseDbCompleteCaseType;
};

export const EpiCaseTypeInfoRegions = ({ completeCaseType }: EpiCaseTypeInfoRegionsProps) => {
  const { t } = useTranslation();

  const regionSetIds = uniq(Object.values(completeCaseType.ref_cols).map(refCol => refCol.region_set_id).filter(x => !!x));

  return (
    <>
      {regionSetIds.map(regionSetId => {
        // NOTE: this assumes a complete case type's regions have been loaded before
        const regions = EpiDataManager.getInstance().data.regionsByRegionSetId[regionSetId];
        const sortedRegions = regions.toSorted((a, b) => +a.code - +b.code);
        return (
          <Accordion
            key={regionSetId}
            slotProps={{ transition: { timeout: regions.length > 15 ? 0 : undefined, unmountOnExit: true } }}
          >
            <AccordionSummary
              aria-controls={`panel-${regionSetId}-content`}
              expandIcon={<ExpandMoreIcon />}
              id={`panel-${regionSetId}-header`}
              sx={{
                fontWeight: 'bold',
              }}
            >
              {EpiDataManager.getInstance().data.regionSets[regionSetId].name}
            </AccordionSummary>
            <AccordionDetails>
              <Stack
                sx={{
                  columnGap: 1,
                  direction: 'row',
                  flexWrap: 'wrap',
                  rowGap: 1,
                }}
              >
                <Table size={'small'}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                        {t`Code`}
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', width: '80%' }}>
                        {t`Name`}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRegions.map(region => (
                      <TableRow key={region.id}>
                        <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                          {region.code}
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top', width: '80%' }}>
                          {region.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};
