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
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import type { CaseSet } from '../../../api';
import { useCaseSetCategoryMap } from '../../../dataHooks/useCaseSetCategories';
import { useCaseSetStatusMap } from '../../../dataHooks/useCaseSetStatuses';
import { useCaseTypeMap } from '../../../dataHooks/useCaseTypes';
import { ResponseHandler } from '../../ui/ResponseHandler';

export type EpiCaseSetContentProps = {
  readonly caseSet: CaseSet;
} & BoxProps;

export const EpiCaseSetContent = ({ caseSet, ...boxProps }: EpiCaseSetContentProps) => {
  const caseSetCategoryMap = useCaseSetCategoryMap();
  const caseSetStatusMap = useCaseSetStatusMap();
  const caseTypeMap = useCaseTypeMap();
  const [t] = useTranslation();

  const loadables = useMemo(() => [caseSetCategoryMap, caseSetStatusMap, caseTypeMap], [caseSetCategoryMap, caseSetStatusMap, caseTypeMap]);
  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Content`}
      </Typography>
      <ResponseHandler
        inlineSpinner
        loadables={loadables}
        shouldHideActionButtons
      >
        <Table size={'small'}>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                width: 'calc(100% * 1/3)',
              }}
              >
                {t`Column`}
              </TableCell>
              <TableCell sx={{
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
                {caseSetStatusMap.map.get(caseSet.case_set_status_id)?.name}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t`Category`}
              </TableCell>
              <TableCell>
                {caseSetCategoryMap.map.get(caseSet.case_set_category_id)?.name}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t`Type`}
              </TableCell>
              <TableCell>
                {caseTypeMap.map.get(caseSet.case_type_id)?.name}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {t`Created at`}
              </TableCell>
              <TableCell>
                {caseSet.created_at ? format(caseSet.created_at, 'yyyy-MM-dd HH:mm:ss') : t`Unknown`}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ResponseHandler>
    </Box>
  );
};
