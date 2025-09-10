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

import type { CompleteCaseType } from '../../../api';
import { EpiDataUtil } from '../../../utils/EpiDataUtil';

export type EpiCaseTypeInfoRegionsProps = {
  readonly completeCaseType: CompleteCaseType;
};

export const EpiCaseTypeInfoRegions = ({ completeCaseType }: EpiCaseTypeInfoRegionsProps) => {
  const [t] = useTranslation();

  const regionSetIds = uniq(Object.values(completeCaseType.cols).map(col => col.region_set_id).filter(x => !!x));

  return (
    <>
      {regionSetIds.map(regionSetId => {
        // NOTE: this assumes a complete case type's regions have been loaded before
        const regions = EpiDataUtil.data.regionsByRegionSetId[regionSetId];
        const sortedRegions = regions.toSorted((a, b) => +a.code - +b.code);
        return (
          <Accordion
            key={regionSetId}
            slotProps={{ transition: { unmountOnExit: true, timeout: regions.length > 15 ? 0 : undefined } }}
          >
            <AccordionSummary
              aria-controls={`panel-${regionSetId}-content`}
              expandIcon={<ExpandMoreIcon />}
              id={`panel-${regionSetId}-header`}
              sx={{
                fontWeight: 'bold',
              }}
            >
              {EpiDataUtil.data.regionSets[regionSetId].name}
            </AccordionSummary>
            <AccordionDetails>
              <Stack
                columnGap={1}
                direction={'row'}
                flexWrap={'wrap'}
                rowGap={1}
              >
                <Table size={'small'}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                        {t`Code`}
                      </TableCell>
                      <TableCell sx={{ width: '80%', verticalAlign: 'top' }}>
                        {t`Name`}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRegions.map(region => (
                      <TableRow key={region.id}>
                        <TableCell sx={{ width: '20%', verticalAlign: 'top' }}>
                          {region.code}
                        </TableCell>
                        <TableCell sx={{ width: '80%', verticalAlign: 'top' }}>
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
