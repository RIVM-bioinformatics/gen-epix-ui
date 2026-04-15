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
import type {
  CaseDbCase,
  CaseDbCaseSet,
  CaseDbTypedUuidSetFilter,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbLogLevel,
} from '@gen-epix/api-casedb';

import { EpiCaseSummary } from '../EpiCaseSummary';
import { LogManager } from '../../../classes/managers/LogManager';
import { QUERY_KEY } from '../../../models/query';
import { QueryUtil } from '../../../utils/QueryUtil';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useQueryMemo } from '../../../hooks/useQueryMemo';

import { EpiCasesAlreadyInCaseSetWarningCaseSetLink } from './EpiCasesAlreadyInCaseSetWarningCaseSetLink';

export type EpiCasesAlreadyInCaseSetWarningProps = {
  readonly cases: CaseDbCase[];
};

export const EpiCasesAlreadyInCaseSetWarning = ({ cases }: EpiCasesAlreadyInCaseSetWarningProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Load all case set members for the given cases
  const caseSetMembersFilter = useMemo<CaseDbTypedUuidSetFilter>(() => {
    return {
      invert: false,
      key: 'case_id',
      members: cases?.map(row => row.id) ?? [],
      type: 'UUID_SET',
    };
  }, [cases]);
  const { data: caseSetMembers, error: caseSetMembersError, isLoading: isCaseSetMembersLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.caseSetMembersPostQuery(caseSetMembersFilter, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_MEMBERS, caseSetMembersFilter),
  });

  // Load all case sets for the given case set members
  const existingCaseSetsFilter = useMemo<CaseDbTypedUuidSetFilter>(() => {
    return {
      invert: false,
      key: 'id',
      members: uniq((caseSetMembers ?? []).map(x => x.case_set_id)) ?? [],
      type: 'UUID_SET',
    };
  }, [caseSetMembers]);
  const { data: caseSets, error: caseSetsError, isLoading: isCaseSetsLoading } = useQueryMemo({
    enabled: existingCaseSetsFilter.members.length > 0,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.caseSetsPostQuery(existingCaseSetsFilter, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS, existingCaseSetsFilter),
  });

  const caseSetsByCase = useMemo(() => {
    const map = new Map<CaseDbCase, CaseDbCaseSet[]>();
    if (!caseSets || !caseSetMembers) {
      return map;
    }

    caseSetMembers?.forEach(member => {
      const caseItem = cases.find(x => x.id === member.case_id);
      const caseSetItem = caseSets.find(x => x.id === member.case_set_id);
      if (!caseItem || !caseSetItem) {
        LogManager.instance.log([
          {
            detail: member,
            level: CaseDbLogLevel.DEBUG,
            topic: 'MISSING_CASE_OR_CASE_SET',
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
      error={caseSetMembersError || caseSetsError}
      isLoading={isCaseSetMembersLoading || isCaseSetsLoading}
      shouldHideActionButtons
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
                        verticalAlign: 'top',
                        width: '50%',
                      }}
                    >
                      <EpiCaseSummary
                        epiCase={caseItem}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        '& :nth-of-type(2)': {
                          marginTop: theme.spacing(1),
                        },
                        verticalAlign: 'top',
                        width: '50%',
                      }}
                    >
                      {caseItemCaseSets.sort((a, b) => a.name.localeCompare(b.name)).map(caseItemCaseSet => (
                        <EpiCasesAlreadyInCaseSetWarningCaseSetLink
                          caseSet={caseItemCaseSet}
                          key={caseItemCaseSet.id}
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
