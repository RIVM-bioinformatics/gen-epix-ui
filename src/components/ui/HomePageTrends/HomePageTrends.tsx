import {
  Typography,
  Button,
  Box,
  Skeleton,
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
  TypedDatetimeRangeFilter,
  RetrieveCaseTypeStatsCommand,
} from '../../../api';
import {
  TypedDatetimeRangeFilterType,
  CaseApi,
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

export const HomePageTrends = () => {
  const [t] = useTranslation();

  const dateTimeRangeFilter = useMemo<TypedDatetimeRangeFilter>(() => ({
    type: TypedDatetimeRangeFilterType.DATETIME_RANGE,
    upper_bound: ConfigManager.instance.config.trends.homePage.getSinceDate(),
    lower_bound_censor: '>=',
    upper_bound_censor: '<=',
  }), []);
  const caseSetQueryFilter = useMemo<TypedDatetimeRangeFilter>(() => ({
    ...dateTimeRangeFilter,
    key: 'created_at',
  }), [dateTimeRangeFilter]);

  const retrieveCaseTypeStatsCommand = useMemo<RetrieveCaseTypeStatsCommand>(() => ({
    datetime_range_filter: dateTimeRangeFilter,
  }), [dateTimeRangeFilter]);

  const caseTypeStatsQueryNow = useCaseTypeStatsQuery();
  const caseTypeStatsQueryPast = useCaseTypeStatsQuery(retrieveCaseTypeStatsCommand);
  const caseSetsNowQuery = useCaseSetsQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();

  const { data: caseSetsThenData, ...caseSetsThenQuery } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS, caseSetQueryFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().caseSetsPostQuery(caseSetQueryFilter, { signal });
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

    if (loadables.some(loadable => loadable.isLoading) || !caseTypeStatsQueryNow.data?.length || !caseTypeStatsQueryPast.data?.length) {
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

  return (

    <Box>
      <Box marginBottom={1}>
        <Box sx={{
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
              color={'primary'}
              disabled
              onClick={onViewMoreTrendsButtonClick}
              variant={'outlined'}
            >
              {t`View more trends`}
            </Button>
          </Box>
        </Box>
      </Box>
      <ResponseHandler
        inlineSpinner
        loadables={loadables}
        loadingContent={(
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
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
                  animation="pulse"
                  height={'100%'}
                  variant="rounded"
                  width={'100%'}
                />
              </Box>
            ))}
          </Box>
        )}
        shouldHideActionButtons
      >
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2,
          marginBottom: 2,
        }}
        >
          {statistics.map(statistic => (
            <HomePageTrendCard
              callback={statistic.callback}
              callbackLabel={statistic.callbackLabel}
              diffPercentage={statistic.diffPercentage}
              header={statistic.header}
              key={statistic.header}
              sinceLabel={ConfigManager.instance.config.trends.homePage.getSinceLabel(t)}
              value={statistic.value}
            />
          ))}
        </Box>
      </ResponseHandler>
    </Box>
  );
};
