import {
  Typography,
  Button,
  Box,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import round from 'lodash/round';
import { useQuery } from '@tanstack/react-query';

import type {
  CaseTypeStat,
  EpiFilter,
  RetrieveCaseTypeStatsRequestBody,
  TypedDatetimeRangeFilter,
} from '../../../api';
import {
  CaseApi,
  CommandName,
  PermissionType,
} from '../../../api';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { useCaseSetsQuery } from '../../../dataHooks/useCaseSetsQuery';
import { useCaseTypeMapQuery } from '../../../dataHooks/useCaseTypesQuery';
import { useCaseTypeStatsQuery } from '../../../dataHooks/useCaseTypeStatsQuery';
import { QUERY_KEY } from '../../../models/query';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { ResponseHandler } from '../ResponseHandler';
import { useArray } from '../../../hooks/useArray';
import { AxiosUtil } from '../../../utils/AxiosUtil';
import { withPermissions } from '../../../hoc/withPermissions';

import { HomePageTrendCard } from './HomePageTrendCard';

type Statistic = {
  header: string;
  value: number;
  diffPercentage: number;
  callback?: () => void;
  callbackLabel?: string;
};

type CaseTypeStatWithDiff = CaseTypeStat & {
  diffPercentage: number;
};

export const HomePageTrends = withPermissions(() => {
  const theme = useTheme();
  const [t] = useTranslation();

  const dateTimeRangeFilter = useMemo<TypedDatetimeRangeFilter>(() => ({
    type: 'DATETIME_RANGE',
    upper_bound: ConfigManager.instance.config.trends.homePage.getSinceDate(),
    upper_bound_censor: '<=',
  } satisfies TypedDatetimeRangeFilter), []);
  const caseSetQueryFilter = useMemo<EpiFilter>(() => ({
    type: 'DATETIME_RANGE',
    upper_bound: ConfigManager.instance.config.trends.homePage.getSinceDate(),
    upper_bound_censor: '<=',
    key: 'created_at',
  } satisfies EpiFilter), []);

  const retrieveCaseTypeStatsCommand = useMemo<RetrieveCaseTypeStatsRequestBody>(() => ({
    datetime_range_filter: dateTimeRangeFilter,
  }), [dateTimeRangeFilter]);

  const caseTypeStatsQueryNow = useCaseTypeStatsQuery();
  const caseTypeStatsQueryPast = useCaseTypeStatsQuery(retrieveCaseTypeStatsCommand);
  const caseSetsNowQuery = useCaseSetsQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();

  const { data: caseSetsThenData, ...caseSetsThenQuery } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS, caseSetQueryFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetsPostQuery(caseSetQueryFilter, { signal });
      return response.data;
    },
  });

  const loadables = useArray([
    caseTypeStatsQueryNow,
    caseTypeStatsQueryPast,
    caseTypeMapQuery,
    caseSetsNowQuery,
    caseSetsThenQuery,
  ]);

  const statistics = useMemo<Statistic[]>(() => {
    const s: Statistic[] = [];

    if (loadables.some(loadable => loadable.isLoading) || loadables.some(loadable => loadable.error) || !caseTypeStatsQueryNow.data?.length || !caseTypeStatsQueryPast.data?.length) {
      return s;
    }

    const nowTotalCases = caseTypeStatsQueryNow.data?.reduce((acc, stat) => acc + stat.n_cases, 0) ?? 0;
    const thenTotalCases = caseTypeStatsQueryPast.data?.reduce((acc, stat) => acc + stat.n_cases, 0) ?? 0;

    s.push(
      {
        header: 'Cases',
        value: nowTotalCases,
        diffPercentage: round((nowTotalCases - thenTotalCases) / (thenTotalCases || 1) * 100, 2),
        callbackLabel: t`View all cases`,
        callback: async () => {
          await RouterManager.instance.router.navigate('/cases');
        },
      },
    );

    const numberOfCaseSetsNow = caseSetsNowQuery.data.length;
    const numberOfCaseSetsThen = caseSetsThenData.length;
    s.push(
      {
        header: 'Events',
        value: numberOfCaseSetsNow,
        diffPercentage: round((numberOfCaseSetsNow - numberOfCaseSetsThen) / (numberOfCaseSetsThen || 1) * 100, 2),
        callbackLabel: t`View all events`,
        callback: async () => {
          await RouterManager.instance.router.navigate('/events');
        },
      },
    );

    const caseTypeStatsThenByCaseTypeId = new Map<string, CaseTypeStat>(caseTypeStatsQueryPast.data?.map(stat => [stat.case_type_id, stat]));
    const sortedStats = caseTypeStatsQueryNow?.data?.map<CaseTypeStatWithDiff>(stat => {
      const thenStat = caseTypeStatsThenByCaseTypeId.get(stat.case_type_id);
      const diff = stat.n_cases - (thenStat?.n_cases ?? 0);
      const diffPercentage = round((diff / (thenStat?.n_cases ?? 1)) * 100, 2);
      return ({
        ...stat,
        diffPercentage,
      });
    }).sort((a, b) => b.diffPercentage - a.diffPercentage);

    for (let i = 0; i < 6; i += 1) {
      if (sortedStats?.[i]) {
        const caseType = caseTypeMapQuery.map?.get(sortedStats?.[i].case_type_id ?? '');
        const caseTypeName = caseType?.name;
        if (caseTypeName) {
          s.push(
            {
              header: t('{{caseTypeName}} cases', { number: i + 1, caseTypeName }),
              value: sortedStats[i].n_cases,
              diffPercentage: sortedStats[i].diffPercentage,
              callbackLabel: t`View cases`,
              callback: async () => {
                await RouterManager.instance.router.navigate(EpiCaseTypeUtil.createCaseTypeLink(caseType));
              },
            },
          );
        }
      }
    }

    return s;
  }, [caseSetsNowQuery.data?.length, caseSetsThenData?.length, caseTypeMapQuery.map, caseTypeStatsQueryNow.data, caseTypeStatsQueryPast.data, loadables, t]);

  const onViewMoreTrendsButtonClick = useCallback(async () => {
    await RouterManager.instance.router.navigate('/trends');
  }, []);

  if (loadables.some(loadable => loadable.error && AxiosUtil.isAxiosForbiddenError(loadable.error))) {
    return null;
  }

  return (
    <Box>
      <Box marginBottom={1}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              variant={'h2'}
            >
              {t`Trends summary`}
            </Typography>
          </Box>
          <Box>
            <Button
              disabled
              color={'primary'}
              variant={'outlined'}
              onClick={onViewMoreTrendsButtonClick}
            >
              {t`View more trends`}
            </Button>
          </Box>
        </Box>
      </Box>
      <ResponseHandler
        inlineSpinner
        shouldHideActionButtons
        loadables={loadables}
        loadingContent={(
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, 1fr)',
              [theme.breakpoints.up('sm')]: {
                gridTemplateColumns: 'repeat(2, 1fr)',
              },
              [theme.breakpoints.up('md')]: {
                gridTemplateColumns: 'repeat(4, 1fr)',
              },
              gap: 2,
              marginBottom: 2,
            }}
          >
            {[...Array<string>(8)].map((_, index) => (
              <Box
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 165.75,
                }}
              >
                <Skeleton
                  animation={'pulse'}
                  height={'100%'}
                  variant={'rounded'}
                  width={'100%'}
                />
              </Box>
            ))}
          </Box>
        )}
      >
        {statistics.length === 0 && (
          <Box marginY={2}>
            <Typography>
              {t`No trends available.`}
            </Typography>
          </Box>
        )}
        {statistics.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, 1fr)',
              [theme.breakpoints.up('sm')]: {
                gridTemplateColumns: 'repeat(2, 1fr)',
              },
              [theme.breakpoints.up('md')]: {
                gridTemplateColumns: 'repeat(4, 1fr)',
              },
              gap: 2,
              marginBottom: 2,
            }}
          >
            {statistics.map(statistic => (
              <HomePageTrendCard
                key={statistic.header}
                callback={statistic.callback}
                callbackLabel={statistic.callbackLabel}
                diffPercentage={statistic.diffPercentage}
                header={statistic.header}
                sinceLabel={ConfigManager.instance.config.trends.homePage.getSinceLabel(t)}
                value={statistic.value}
              />
            ))}
          </Box>
        )}
      </ResponseHandler>
    </Box>
  );
}, {
  requiredPermissions: [
    { command_name: CommandName.RetrieveCaseTypeStatsCommand, permission_type: PermissionType.EXECUTE },
    { command_name: CommandName.CaseSetCrudCommand, permission_type: PermissionType.READ },
    { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.READ },
  ] });
