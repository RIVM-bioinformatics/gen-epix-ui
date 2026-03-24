import type { BoxProps } from '@mui/material';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import type { Case } from '../../../api';
import { useDataCollectionsMapQuery } from '../../../dataHooks/useDataCollectionsQuery';
import { GenericErrorMessage } from '../../ui/GenericErrorMessage';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { DATE_FORMAT } from '../../../data/date';
import { useArray } from '../../../hooks/useArray';

export type EpiReadOnlyCaseContentProps = {
  readonly epiCase: Case;
} & BoxProps;

export const EpiReadOnlyCaseContent = ({ epiCase, ...boxProps }: EpiReadOnlyCaseContentProps) => {
  const { t } = useTranslation();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();

  const loadables = useArray([dataCollectionsMapQuery]);

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Read-only content`}
      </Typography>
      {!epiCase && (
        <GenericErrorMessage
          error={new Error('Case could not be found')}
        />
      )}
      <ResponseHandler
        inlineSpinner
        shouldHideActionButtons
        loadables={loadables}
      >
        {epiCase && (
          <Table size={'small'}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: 'calc(100% * 1/3)',
                  }}
                >
                  {t`Column`}
                </TableCell>
                <TableCell
                  sx={{
                    width: 'calc(100% * 2/3)',
                  }}
                >
                  {t`Value`}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  {t`Case id`}
                </TableCell>
                <TableCell>
                  {epiCase.id}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  {t`Case date`}
                </TableCell>
                <TableCell>
                  {format(epiCase.case_date, DATE_FORMAT.DATE)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </ResponseHandler>
    </Box>
  );
};
