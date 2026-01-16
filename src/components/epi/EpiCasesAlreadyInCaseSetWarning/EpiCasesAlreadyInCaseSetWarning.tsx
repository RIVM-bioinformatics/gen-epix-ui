import {
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import uniq from 'lodash/uniq';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { EpiCaseSummary } from '../EpiCaseSummary';
import type {
  Case,
  TypedUuidSetFilter,
  CaseSet,
} from '../../../api';
import {
  CaseApi,
  LogLevel,
} from '../../../api';
import { LogManager } from '../../../classes/managers/LogManager';
import { QUERY_KEY } from '../../../models/query';
import { QueryUtil } from '../../../utils/QueryUtil';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useQueryMemo } from '../../../hooks/useQueryMemo';

import { EpiCasesAlreadyInCaseSetWarningCaseSetLink } from './EpiCasesAlreadyInCaseSetWarningCaseSetLink';

export type EpiCasesAlreadyInCaseSetWarningProps = {
  readonly cases: Case[];
};

export const EpiCasesAlreadyInCaseSetWarning = ({ cases }: EpiCasesAlreadyInCaseSetWarningProps) => {
  const [t] = useTranslation();
  const theme = useTheme();

  // Load all case set members for the given cases
  const caseSetMembersFilter = useMemo<TypedUuidSetFilter>(() => {
    return {
      invert: false,
      key: 'case_id',
      type: 'UUID_SET',
      members: cases?.map(row => row.id) ?? [],
    };
  }, [cases]);
  const { isLoading: isCaseSetMembersLoading, error: caseSetMembersError, data: caseSetMembers } = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_MEMBERS, caseSetMembersFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetMembersPostQuery(caseSetMembersFilter, { signal });
      return response.data;
    },
  });

  // Load all case sets for the given case set members
  const existingCaseSetsFilter = useMemo<TypedUuidSetFilter>(() => {
    return {
      invert: false,
      key: 'id',
      type: 'UUID_SET',
      members: uniq((caseSetMembers ?? []).map(x => x.case_set_id)) ?? [],
    };
  }, [caseSetMembers]);
  const { isLoading: isCaseSetsLoading, error: caseSetsError, data: caseSets } = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS, existingCaseSetsFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetsPostQuery(existingCaseSetsFilter, { signal });
      return response.data;
    },
    enabled: existingCaseSetsFilter.members.length > 0,
  });

  const caseSetsByCase = useMemo(() => {
    const map = new Map<Case, CaseSet[]>();
    if (!caseSets || !caseSetMembers) {
      return map;
    }

    caseSetMembers?.forEach(member => {
      const caseItem = cases.find(x => x.id === member.case_id);
      const caseSetItem = caseSets.find(x => x.id === member.case_set_id);
      if (!caseItem || !caseSetItem) {
        LogManager.instance.log([
          {
            level: LogLevel.DEBUG,
            topic: 'MISSING_CASE_OR_CASE_SET',
            detail: member,
          },
        ]);
        return;
      }
      if (!map.has(caseItem)) {
        map.set(caseItem, []);
      }
      map.get(caseItem).push(caseSetItem);
    });
    return map;
  }, [caseSets, caseSetMembers, cases]);

  return (
    <ResponseHandler
      shouldHideActionButtons
      error={caseSetMembersError || caseSetsError}
      isLoading={isCaseSetMembersLoading || isCaseSetsLoading}
    >
      {caseSetsByCase.size > 0 && (
        <Alert
          severity={'warning'}
          slotProps={{
            message: {
              sx: {
                flexGrow: 1,
              },
            },
          }}
        >
          <AlertTitle
            sx={{
              width: '100%',
            }}
          >
            {t('{{numCases}} selected case(s) are already part of other event(s):', { numCases: caseSetsByCase.size })}
          </AlertTitle>
          <Table
            size={'small'}
            sx={{
              width: '100%',
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: '50%',
                  }}
                >
                  {t`Case`}
                </TableCell>
                <TableCell
                  sx={{
                    width: '50%',
                  }}
                >
                  {t`Events`}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(Array.from(caseSetsByCase) ?? []).map(([caseItem, caseItemCaseSets]) => {
                return (
                  <TableRow key={caseItem.id}>
                    <TableCell
                      sx={{
                        width: '50%',
                        verticalAlign: 'top',
                      }}
                    >
                      <EpiCaseSummary
                        epiCase={caseItem}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        width: '50%',
                        verticalAlign: 'top',
                        '& :nth-of-type(2)': {
                          marginTop: theme.spacing(1),
                        },
                      }}
                    >
                      {caseItemCaseSets.sort((a, b) => a.name.localeCompare(b.name)).map(caseItemCaseSet => (
                        <EpiCasesAlreadyInCaseSetWarningCaseSetLink
                          key={caseItemCaseSet.id}
                          caseSet={caseItemCaseSet}
                        />
                      ))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Alert>
      )}
    </ResponseHandler>
  );
};
