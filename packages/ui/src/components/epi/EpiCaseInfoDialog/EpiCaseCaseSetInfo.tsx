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
  Case,
  TypedUuidSetFilter,
} from '@gen-epix/api-casedb';
import { CaseApi } from '@gen-epix/api-casedb';

import { useCaseSetCategoryMapQuery } from '../../../dataHooks/useCaseSetCategoriesQuery';
import { useCaseSetStatusMapQuery } from '../../../dataHooks/useCaseSetStatusesQuery';
import { QUERY_KEY } from '../../../models/query';
import { CaseSetUtil } from '../../../utils/CaseSetUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { NavLink } from '../../ui/NavLink';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useArray } from '../../../hooks/useArray';
import { useQueryMemo } from '../../../hooks/useQueryMemo';

export type EpiCaseCaseSetInfoProps = {
  readonly epiCase: Case;
} & BoxProps;

export const EpiCaseCaseSetInfo = ({ epiCase, ...boxProps }: EpiCaseCaseSetInfoProps) => {
  const caseSetCategoryMapQuery = useCaseSetCategoryMapQuery();
  const caseSetStatusMapQuery = useCaseSetStatusMapQuery();

  const { t } = useTranslation();
  const caseSetMembersFilter: TypedUuidSetFilter = {
    invert: false,
    key: 'case_id',
    members: [epiCase.id],
    type: 'UUID_SET',
  };
  const { data: caseSetMembers, error: caseSetMembersError, isLoading: isCaseSetMembersLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetMembersPostQuery(caseSetMembersFilter, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_MEMBERS, caseSetMembersFilter),
  });

  const caseSetsFilter: TypedUuidSetFilter = {
    invert: false,
    key: 'id',
    members: caseSetMembers?.map((caseSetMember) => caseSetMember.case_set_id) ?? [],
    type: 'UUID_SET',
  };
  const { data: caseSets, error: caseSetsError, isLoading: isCaseSetsLoading } = useQueryMemo({
    enabled: caseSetsFilter.members.length > 0,
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetsPostQuery(caseSetsFilter, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS, caseSetsFilter),
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
