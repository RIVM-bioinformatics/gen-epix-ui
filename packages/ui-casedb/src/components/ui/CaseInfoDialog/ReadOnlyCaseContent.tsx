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
import type { CaseDbCase } from '@gen-epix/api-casedb';
import {
  GenericErrorMessage,
  ResponseHandler,
  useArray,
} from '@gen-epix/ui';

import { useDataCollectionsMapQuery } from '../../../dataHooks/useDataCollectionsQuery';

export type ReadOnlyCaseContentProps = {
  readonly caseDbCase: CaseDbCase;
} & BoxProps;

export const ReadOnlyCaseContent = ({ caseDbCase, ...boxProps }: ReadOnlyCaseContentProps) => {
  const { t } = useTranslation();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();

  const loadables = useArray([dataCollectionsMapQuery]);

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Read-only content`}
      </Typography>
      {!caseDbCase && (
        <GenericErrorMessage
          error={new Error('Case could not be found')}
        />
      )}
      <ResponseHandler
        inlineSpinner
        loadables={loadables}
        shouldHideActionButtons
      >
        {caseDbCase && (
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
                  {caseDbCase.id}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </ResponseHandler>
    </Box>
  );
};
