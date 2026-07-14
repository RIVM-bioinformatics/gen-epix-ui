import {
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  mixed,
  object,
  string,
} from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Resolver } from 'react-hook-form';
import {
  useForm,
  useWatch,
} from 'react-hook-form';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Divider,
  Typography,
} from '@mui/material';
import { useStore } from 'zustand';
import { produce } from 'immer';
import {
  format,
  parseISO,
} from 'date-fns';
import type {
  CaseDbCase,
  CaseDbCaseIdAndDate,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  AutoCompleteOption,
  DialogAction,
  FormFieldDefinition,
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import {
  ConfigService,
  DATE_FORMAT,
  FORM_FIELD_DEFINITION_TYPE,
  GenericForm,
  QueryClientService,
  ResponseHandler,
  SchemaUtil,
  TestIdUtil,
  useQueryMemo,
  withDialog,
} from '@gen-epix/ui';

import { CASEDB_QUERY_KEY } from '../../../data/query';
import type { CaseDbConfig } from '../../../models/config';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { TreeUtil } from '../../../utils/TreeUtil';
import type { FindSimilarCasesChartDataPoint } from '../../../models/caseDb';
import type { TreeWidgetDataPersistable } from '../../../models/dashboard';
import { DASHBOARD_COMPONENT_NAME } from '../../../data/dashboard';

import { FindSimilarCasesDialogDateRangeChart } from './FindSimilarCasesDialogDateRangeChart';


export interface FindSimilarCasesDialogOpenProps {
  allRows: CaseDbCase[];
  completeCaseType: CaseDbCompleteCaseType;
  selectedRows: CaseDbCase[];
}

export interface FindSimilarCasesDialogProps extends WithDialogRenderProps<FindSimilarCasesDialogOpenProps> {
  //
}

export type FindSimilarCasesDialogRefMethods = WithDialogRefMethods<FindSimilarCasesDialogProps, FindSimilarCasesDialogOpenProps>;


type FormFields = {
  dateRange: [string, string] | null;
  maxDistance: number;
  treeColId: string;
};

export const FindSimilarCasesDialog = withDialog<FindSimilarCasesDialogProps, FindSimilarCasesDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: FindSimilarCasesDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const formId = useId();
  const dashboardStore = use(DashboardStoreContext);
  const treeConfiguration = dashboardStore.getState().getWidgetDataPersistable<TreeWidgetDataPersistable>(DASHBOARD_COMPONENT_NAME.TREE).treeConfiguration;
  const setFindSimilarCasesResults = useStore(dashboardStore, (state) => state.setFindSimilarCasesResults);
  const findSimilarCasesResults = useStore(dashboardStore, (state) => state.findSimilarCasesResults);
  const treeConfigurations = useMemo(() => TreeUtil.getTreeConfigurations(openProps.completeCaseType), [openProps.completeCaseType]);
  const [formData, setFormData] = useState<FormFields>(null);

  const schema = useMemo(() => object<FormFields>().shape({
    dateRange: mixed<[string, string] | null>().nullable().default(null),
    maxDistance: SchemaUtil.number.required().positive().when('treeColId', ([treeColId], s) => {
      const currentTreeConfiguration = treeConfigurations.find(x => x.col.id === treeColId);
      if (!currentTreeConfiguration) {
        return s;
      }
      const sWithIntegerCheck = s.integer(t`Max distance must be an integer`);
      return sWithIntegerCheck.max(currentTreeConfiguration.geneticDistanceProtocol.seqdb_max_stored_distance || ConfigService.getInstance<CaseDbConfig>().config.epi.SEQDB_MAX_STORED_DISTANCE_FALLBACK);
    }),
    treeColId: string().required(),
  }), [t, treeConfigurations]);

  const treeOptions = useMemo<AutoCompleteOption<string>[]>(() => {
    const cols = new Set<CaseDbCol>();
    treeConfigurations.forEach(x => {
      cols.add(x.col);
    });
    return Array.from(cols).map(x => {
      return {
        label: x.label,
        value: x.id,
      } satisfies AutoCompleteOption<string>;
    });

  }, [treeConfigurations]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema, undefined, { raw: true }) as Resolver<FormFields>,
    values: {
      dateRange: null,
      maxDistance: 0,
      treeColId: treeConfiguration ? treeConfiguration.col.id : null,
    },
  });
  const { control, handleSubmit } = formMethods;

  const formValues = useWatch({ control });

  const formFieldDefinitions = useMemo(() => {
    const currentTreeConfiguration = treeConfigurations.find(x => x.col.id === formValues.treeColId);

    return [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        label: t`Tree`,
        name: 'treeColId',
        options: treeOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        label: t`Max distance`,
        max: currentTreeConfiguration?.geneticDistanceProtocol?.seqdb_max_stored_distance || ConfigService.getInstance<CaseDbConfig>().config.epi.SEQDB_MAX_STORED_DISTANCE_FALLBACK,
        min: 0,
        name: 'maxDistance',
        showSlider: true,
        step: 1,
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [formValues.treeColId, t, treeConfigurations, treeOptions]);

  useEffect(() => {
    onTitleChange(t`Find similar cases`);
  }, [t, onTitleChange]);

  const onFormSubmit = useCallback((data: FormFields) => {
    formMethods.setValue('dateRange', null);
    setFormData({ ...data, dateRange: null });
  }, [formMethods]);

  const query = useQueryMemo({
    enabled: !!formData,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrieveSimilarCases({
        case_ids: openProps.selectedRows.map(x => x.id),
        case_type_id: openProps.completeCaseType.id,
        genetic_distance_col_id: formData?.treeColId,
        max_distance: formData?.maxDistance,
      }, { signal });
      return response.data;
    },
    queryKey: [QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.SIMILAR_CASES), JSON.stringify({ formData, rowIds: openProps.selectedRows.map(row => row.id) })],
  });

  const chartData = useMemo<FindSimilarCasesChartDataPoint[]>(() => {
    if (!query.data) {
      return [];
    }
    const counts = new Map<string, number>();
    for (const { case_date } of query.data.cases) {
      if (case_date) {
        counts.set(case_date, (counts.get(case_date) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ count, date }));
  }, [query.data]);

  const filteredCases = useMemo<CaseDbCaseIdAndDate[]>(() => {
    if (!query.data) {
      return [];
    }
    const dateRange = formValues.dateRange;
    if (!dateRange) {
      return query.data.cases;
    }
    const [startDate, endDate] = dateRange;
    return query.data.cases.filter(c => {
      if (!c.case_date) {
        return false;
      }
      const caseDateOnly = format(parseISO(c.case_date), DATE_FORMAT.DATE);
      return caseDateOnly >= startDate && caseDateOnly <= endDate;
    });
  }, [query.data, formValues.dateRange]);

  const similarCaseIdsNotInLineListWithDateFilter = useMemo<string[]>(() => {
    const allRowIds = openProps.allRows.map(x => x.id);
    return filteredCases.reduce<string[]>((acc, caseIdAndDate) => {
      const caseId = caseIdAndDate.id;
      if (!allRowIds.includes(caseId)) {
        acc.push(caseId);
      }
      return acc;
    }, []);
  }, [filteredCases, openProps.allRows]);

  const similarCaseIdsAlreadyInLineListWithDateFilter = useMemo<string[]>(() => {
    const allRowIds = openProps.allRows.map(x => x.id);
    return filteredCases.reduce<string[]>((acc, caseIdAndDate) => {
      const caseId = caseIdAndDate.id;
      if (allRowIds.includes(caseId)) {
        acc.push(caseId);
      }
      return acc;
    }, []);
  }, [filteredCases, openProps.allRows]);

  const onAddToLineListButtonClick = useCallback(async () => {

    await setFindSimilarCasesResults(produce(findSimilarCasesResults, draft => {
      draft.push({
        colId: formData?.treeColId,
        distance: formData?.maxDistance,
        key: findSimilarCasesResults.length.toString(),
        originalCaseIds: openProps.allRows.map(x => x.id),
        similarCaseIds: similarCaseIdsNotInLineListWithDateFilter,
      });
      return draft;
    }));

    onClose();
  }, [setFindSimilarCasesResults, findSimilarCasesResults, onClose, similarCaseIdsNotInLineListWithDateFilter, formData?.maxDistance, formData?.treeColId, openProps.allRows]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('FindSimilarCasesDialog-closeButton'),
      color: 'primary',
      label: t`Close`,
      onClick: onClose,
      variant: 'outlined',
    });
    actions.push({
      ...TestIdUtil.createAttributes('FindSimilarCasesDialog-addSimilarCasesButton'),
      color: 'secondary',
      disabled: similarCaseIdsNotInLineListWithDateFilter.length === 0,
      label: t('Add {{count}} similar cases to line list', { count: similarCaseIdsNotInLineListWithDateFilter.length }),
      onClick: onAddToLineListButtonClick,
      variant: 'contained',
    });
    onActionsChange(actions);
  }, [formId, onActionsChange, onAddToLineListButtonClick, onClose, similarCaseIdsNotInLineListWithDateFilter.length, t]);

  return (
    <Box>
      <Box
        sx={{
          marginBottom: 2,
        }}
      >
        <Typography>
          {t('Select a tree and maximum distance to find similar cases for the {{count}} selected cases.', { count: openProps.selectedRows.length })}
        </Typography>
      </Box>
      <Box>
        <GenericForm<FormFields>
          formFieldDefinitions={formFieldDefinitions}
          formId={formId}
          formMethods={formMethods}
          onSubmit={handleSubmit(onFormSubmit)}
          schema={schema}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 2,
        }}
      >
        <Button
          color={'secondary'}
          form={formId}
          type={'submit'}
          variant={'contained'}
        >
          {formData ? t`Search again` : t`Search`}
        </Button>
      </Box>
      <Divider sx={{ marginY: 2 }} />
      <ResponseHandler
        inlineSpinner
        loadables={query}
      >
        {query.data && (
          <>
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <Alert
                severity={query.data.cases.length > 0 ? 'success' : 'warning'}
              >
                <AlertTitle>
                  {t('Found {{count}} similar cases with a distance of {{distance}}.', { count: query.data.cases.length, distance: formData?.maxDistance })}
                </AlertTitle>
              </Alert>
            </Box>
            {chartData.length > 0 && (
              <Box
                sx={{
                  marginY: 2,
                }}
              >
                <FindSimilarCasesDialogDateRangeChart<FormFields>
                  control={control}
                  data={chartData}
                  name={'dateRange'}
                />
              </Box>
            )}
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <Alert
                severity={'info'}
              >
                <AlertTitle>
                  {t('{{count}} similar cases can be added to the line list.', { count: similarCaseIdsNotInLineListWithDateFilter.length })}
                </AlertTitle>
              </Alert>
            </Box>
            {similarCaseIdsAlreadyInLineListWithDateFilter.length > 0 && (
              <Alert
                severity={'warning'}
              >
                <AlertTitle>
                  {t('{{count}} similar cases found that are already in the line list.', { count: similarCaseIdsAlreadyInLineListWithDateFilter.length })}
                </AlertTitle>
              </Alert>
            )}
          </>
        )}
      </ResponseHandler>
    </Box>
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'md',
  testId: 'FindSimilarCasesDialog',
});
