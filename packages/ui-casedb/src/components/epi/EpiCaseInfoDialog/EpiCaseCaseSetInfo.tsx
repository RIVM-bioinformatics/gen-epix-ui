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
import type {
  CaseDbCase,
  CaseDbTypedUuidSetFilter,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import {
  QUERY_KEY,
  QueryManager,
  ResponseHandler,
  useArray,
  useQueryMemo,
} from '@gen-epix/ui';
import { NavLink } from 'react-router';

import { useCaseSetCategoryMapQuery } from '../../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatusMapQuery } from '../../../dataHooks/useCaseSetStatusesQuery';
import { CaseSetUtil } from '../../../utils/CaseSetUtil';

export type EpiCaseCaseSetInfoProps = {
  readonly epiCase: CaseDbCase;
} & BoxProps;

export const EpiCaseCaseSetInfo = ({ epiCase, ...boxProps }: EpiCaseCaseSetInfoProps) => {
  const caseSetCategoryMapQuery = useCaseSetCategoryMapQuery();
  const caseSetStatusMapQuery = useCaseSetStatusMapQuery();

  const { t } = useTranslation();
  const caseSetMembersFilter: CaseDbTypedUuidSetFilter = {
    invert: false,
    key: 'case_id',
    members: [epiCase.id],
    type: 'UUID_SET',
  };
  const { data: caseSetMembers, error: caseSetMembersError, isLoading: isCaseSetMembersLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseSetMembersPostQuery(caseSetMembersFilter, { signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.CASE_SET_MEMBERS, caseSetMembersFilter),
  });

  const caseSetsFilter: CaseDbTypedUuidSetFilter = {
    invert: false,
    key: 'id',
    members: caseSetMembers?.map((caseSetMember) => caseSetMember.case_set_id) ?? [],
    type: 'UUID_SET',
  };
  const { data: caseSets, error: caseSetsError, isLoading: isCaseSetsLoading } = useQueryMemo({
    enabled: caseSetsFilter.members.length > 0,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseSetsPostQuery(caseSetsFilter, { signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.CASE_SETS, caseSetsFilter),
  });

  const loadables = useArray([caseSetCategoryMapQuery, caseSetStatusMapQuery]);

  return (
    <Box {...boxProps}>
      <Typography variant={'h6'}>
        {t`Events`}
      </Typography>
      <ResponseHandler
        error={caseSetMembersError || caseSetsError}
        inlineSpinner
        isLoading={isCaseSetMembersLoading || isCaseSetsLoading}
        loadables={loadables}
        shouldHideActionButtons
      >
        {caseSets?.length > 0 && (
          <Table size={'small'}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: 'calc(100% * 1/3)',
                  }}
                >
                  {t`Name`}
                </TableCell>
                <TableCell
                  sx={{
                    width: 'calc(100% * 1/3)',
                  }}
                >
                  {t`Category`}
                </TableCell>
                <TableCell
                  sx={{
                    width: 'calc(100% * 1/3)',
                  }}
                >
                  {t`Status`}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {caseSets?.map((caseSet) => (
                <TableRow key={caseSet.id}>
                  <TableCell>
                    <NavLink
                      activeAsText
                      to={CaseSetUtil.createCaseSetLink(caseSet)}
                    >
                      {caseSet.name}
                    </NavLink>
                  </TableCell>
                  <TableCell>
                    {caseSetCategoryMapQuery.map.get(caseSet.case_set_category_id)?.name ?? t`Unknown`}
                  </TableCell>
                  <TableCell>
                    {caseSetStatusMapQuery.map.get(caseSet.case_set_status_id)?.name ?? t`Unknown`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {(!caseSets || caseSets?.length === 0) && (
          <Box sx={{ fontStyle: 'italic' }}>
            {t`None`}
          </Box>
        )}
      </ResponseHandler>
    </Box>
  );
};
