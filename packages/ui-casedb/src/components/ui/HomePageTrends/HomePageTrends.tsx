import {
  Box,
  Button,
  Skeleton,
  Typography,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import round from 'lodash/round';
import type {
  CaseDbApiPermission,
  CaseDbCaseStats,
  CaseDbEpiFilter,
  CaseDbRetrieveCaseTypeStatsRequestBody,
  CaseDbTypedDatetimeRangeFilter,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import {
  AxiosUtil,
  ConfigManager,
  LoadableUtil,
  QUERY_KEY,
  QueryUtil,
  ResponseHandler,
  RouterManager,
  useArray,
  useQueryMemo,
  withPermissions,
} from '@gen-epix/ui';

import { useCaseSetsQuery } from '../../../dataHooks/useCaseSetsQuery';
import { useCaseTypeMapQuery } from '../../../dataHooks/useCaseTypesQuery';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';
import type { CaseDbConfig } from '../../../models/config';

import { HomePageTrendCard } from './HomePageTrendCard';

type CaseStatsWithDiff = {
  diffPercentage: number;
} & CaseDbCaseStats;

type Statistic = {
  callback?: () => void;
  callbackLabel?: string;
  diffPercentage: number;
  header: string;
  value: number;
};

export const HomePageTrends = withPermissions<CaseDbApiPermission>(() => {
  const theme = useTheme();
  const { t } = useTranslation();

  const dateTimeRangeFilter = useMemo<CaseDbTypedDatetimeRangeFilter>(() => ({
    type: 'DATETIME_RANGE',
    upper_bound: ConfigManager.getInstance<CaseDbConfig>().config.trends.homePage.getSinceDate(),
    upper_bound_censor: '<=',
  } satisfies CaseDbTypedDatetimeRangeFilter), []);

  const caseSetQueryFilter = useMemo<CaseDbEpiFilter>(() => ({
    key: 'case_set_date',
    type: 'DATETIME_RANGE',
    upper_bound: ConfigManager.getInstance<CaseDbConfig>().config.trends.homePage.getSinceDate(),
    upper_bound_censor: '<=',
  } satisfies CaseDbEpiFilter), []);

  const caseTypeStatsQueryNow = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.retrieveCaseTypeStats({}, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_STATS),
  });

  const retrieveTypeCaseStatsRequestBody = useMemo<CaseDbRetrieveCaseTypeStatsRequestBody>(() => {
    if (!caseTypeStatsQueryNow.data) {
      return undefined;
    }
    return {
      case_type_ids: caseTypeStatsQueryNow.data?.filter(stat => stat.n_cases > 0).map(stat => stat.case_type_id),
      datetime_range_filter: dateTimeRangeFilter,
    };
  }, [dateTimeRangeFilter, caseTypeStatsQueryNow.data]);

  const caseTypeStatsQueryPast = useQueryMemo({
    enabled: !!retrieveTypeCaseStatsRequestBody,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.retrieveCaseTypeStats(retrieveTypeCaseStatsRequestBody ?? {}, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_TYPE_STATS, retrieveTypeCaseStatsRequestBody ?? {}),
  });
  const caseSetsNowQuery = useCaseSetsQuery();
  const caseTypeMapQuery = useCaseTypeMapQuery();

  const { data: caseSetsThenData, ...caseSetsThenQuery } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.instance.caseSetsPostQuery(caseSetQueryFilter, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SETS, caseSetQueryFilter),
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

    if (LoadableUtil.isSomeLoading(loadables) || LoadableUtil.hasSomeError(loadables) || !caseTypeStatsQueryNow.data?.length || !caseTypeStatsQueryPast.data?.length) {
      return s;
    }

    const nowTotalCases = caseTypeStatsQueryNow.data?.reduce((acc, stat) => acc + stat.n_cases, 0) ?? 0;
    const thenTotalCases = caseTypeStatsQueryPast.data?.reduce((acc, stat) => acc + stat.n_cases, 0) ?? 0;

    s.push(
      {
        callback: async () => {
          await RouterManager.instance.router.navigate('/cases');
        },
        callbackLabel: t`View all cases`,
        diffPercentage: round((nowTotalCases - thenTotalCases) / (thenTotalCases || 1) * 100, 2),
        header: 'Cases',
        value: nowTotalCases,
      },
    );

    const numberOfCaseSetsNow = caseSetsNowQuery.data.length;
    const numberOfCaseSetsThen = caseSetsThenData.length;
    s.push(
      {
        callback: async () => {
          await RouterManager.instance.router.navigate('/events');
        },
        callbackLabel: t`View all events`,
        diffPercentage: round((numberOfCaseSetsNow - numberOfCaseSetsThen) / (numberOfCaseSetsThen || 1) * 100, 2),
        header: 'Events',
        value: numberOfCaseSetsNow,
      },
    );

    const caseStatsThenByCaseTypeId = new Map<string, CaseDbCaseStats>(caseTypeStatsQueryPast.data?.map(stat => [stat.case_type_id, stat]));
    const sortedStats = caseTypeStatsQueryNow?.data?.map<CaseStatsWithDiff>(stat => {
      const nowNCases = stat.n_cases;
      const thenNCases = caseStatsThenByCaseTypeId.get(stat.case_type_id)?.n_cases ?? 0;
      const diff = nowNCases - thenNCases;
      let diffPercentage: number;
      if (thenNCases > 0) {
        diffPercentage = round((diff / thenNCases) * 100, 2);
      } else {
        diffPercentage = 0;
      }
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
              callback: async () => {
                await RouterManager.instance.router.navigate(CaseTypeUtil.createCaseTypeLink(caseType));
              },
              callbackLabel: t`View cases`,
              diffPercentage: sortedStats[i].diffPercentage,
              header: t('{{caseTypeName}} cases', { caseTypeName, number: i + 1 }),
              value: sortedStats[i].n_cases,
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

  if (AxiosUtil.isAxiosForbiddenError(LoadableUtil.findFirstError(loadables))) {
    return null;
  }

  return (
    <Box>
      <Box
        sx={{
          marginBottom: 1,
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
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
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(1, 1fr)',
              marginBottom: 2,
              [theme.breakpoints.up('md')]: {
                gridTemplateColumns: 'repeat(4, 1fr)',
              },
              [theme.breakpoints.up('sm')]: {
                gridTemplateColumns: 'repeat(2, 1fr)',
              },
            }}
          >
            {[...Array<string>(8)].map((_, index) => (
              <Box
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={index}
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  height: 165.75,
                  justifyContent: 'center',
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
        shouldHideActionButtons
      >
        {statistics.length === 0 && (
          <Box
            sx={{
              marginY: 2,
            }}
          >
            <Typography>
              {t`No trends available.`}
            </Typography>
          </Box>
        )}
        {statistics.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(1, 1fr)',
              marginBottom: 2,
              [theme.breakpoints.up('md')]: {
                gridTemplateColumns: 'repeat(4, 1fr)',
              },
              [theme.breakpoints.up('sm')]: {
                gridTemplateColumns: 'repeat(2, 1fr)',
              },
            }}
          >
            {statistics.map(statistic => (
              <HomePageTrendCard
                callback={statistic.callback}
                callbackLabel={statistic.callbackLabel}
                diffPercentage={statistic.diffPercentage}
                header={statistic.header}
                key={statistic.header}
                sinceLabel={ConfigManager.getInstance<CaseDbConfig>().config.trends.homePage.getSinceLabel(t)}
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
    { command_name: CaseDbCommandName.RetrieveCaseStatsCommand, permission_type: CaseDbPermissionType.EXECUTE },
    { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
    { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
  ] });
