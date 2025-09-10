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

import type { CaseSet } from '../../../api';
import { useCaseSetCategoryMapQuery } from '../../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatusMapQuery } from '../../../dataHooks/useCaseSetStatusesQuery';
import { useCaseTypeMapQuery } from '../../../dataHooks/useCaseTypesQuery';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { DATE_FORMAT } from '../../../data/date';
import { useArray } from '../../../hooks/useArray';

export type EpiCaseSetContentProps = {
  readonly caseSet: CaseSet;
} & BoxProps;

export const EpiCaseSetContent = ({ caseSet, ...boxProps }: EpiCaseSetContentProps) => {
  const caseSetCategoryMapQuery = useCaseSetCategoryMapQuery();
  const caseSetStatusMapQuery = useCaseSetStatusMapQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();
  const [t] = useTranslation();

  const loadables = useArray([caseSetCategoryMapQuery, caseSetStatusMapQuery, caseTypeMapQuery]);
  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Content`}
      </Typography>
      <ResponseHandler
        inlineSpinner
        shouldHideActionButtons
        loadables={loadables}
      >
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
                {t`Name`}
              </TableCell>
              <TableCell>
                {caseSet.name}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t`Status`}
              </TableCell>
              <TableCell>
                {caseSetStatusMapQuery.map.get(caseSet.case_set_status_id)?.name}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t`Category`}
              </TableCell>
              <TableCell>
                {caseSetCategoryMapQuery.map.get(caseSet.case_set_category_id)?.name}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t`Type`}
              </TableCell>
              <TableCell>
                {caseTypeMapQuery.map.get(caseSet.case_type_id)?.name}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t`Created at`}
              </TableCell>
              <TableCell>
                {caseSet.created_at ? format(caseSet.created_at, DATE_FORMAT.DATE_TIME) : t`Unknown`}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ResponseHandler>
    </Box>
  );
};
