import {
  type ReactElement,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
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
  Typography,
} from '@mui/material';
import { useStore } from 'zustand';
import { produce } from 'immer';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import { WithDialogRenderProps, WithDialogRefMethods, withDialog, SchemaUtil, ConfigManager, AutoCompleteOption, FORM_FIELD_DEFINITION_TYPE, FormFieldDefinition, useQueryMemo, QueryClientManager, DialogAction, TestIdUtil, GenericForm, ResponseHandler } from '@gen-epix/ui';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';
import { CASEDB_QUERY_KEY } from '../../../data/query';
import { CaseDbConfig } from '../../../models/config';


export interface EpiFindSimilarCasesDialogOpenProps {
  allRows: CaseDbCase[];
  completeCaseType: CaseDbCompleteCaseType;
  selectedRows: CaseDbCase[];
}

export interface EpiFindSimilarCasesDialogProps extends WithDialogRenderProps<EpiFindSimilarCasesDialogOpenProps> {
  //
}

export type EpiFindSimilarCasesDialogRefMethods = WithDialogRefMethods<EpiFindSimilarCasesDialogProps, EpiFindSimilarCasesDialogOpenProps>;


type FormFields = {
  maxDistance: number;
  treeColId: string;
};

export const EpiFindSimilarCasesDialog = withDialog<EpiFindSimilarCasesDialogProps, EpiFindSimilarCasesDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: EpiFindSimilarCasesDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const formId = useId();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const treeConfiguration = epiDashboardStore.getState().epiTreeWidgetData.treeConfiguration;
  const setFindSimilarCasesResults = useStore(epiDashboardStore, (state) => state.setFindSimilarCasesResults);
  const findSimilarCasesResults = useStore(epiDashboardStore, (state) => state.findSimilarCasesResults);
  const treeConfigurations = useMemo(() => EpiTreeUtil.getTreeConfigurations(openProps.completeCaseType), [openProps.completeCaseType]);
  const [formData, setFormData] = useState<FormFields>(null);

  const schema = useMemo(() => object<FormFields>().shape({
    maxDistance: SchemaUtil.number.required().positive().when('treeColId', ([treeColId], s) => {
      const currentTreeConfiguration = treeConfigurations.find(x => x.col.id === treeColId);
      if (!currentTreeConfiguration) {
        return s;
      }
      const sWithIntegerCheck = s.integer(t`Max distance must be an integer`);
      return sWithIntegerCheck.max(currentTreeConfiguration.geneticDistanceProtocol.seqdb_max_stored_distance || ConfigManager.getInstance<CaseDbConfig>().config.epi.SEQDB_MAX_STORED_DISTANCE_FALLBACK);
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
        max: currentTreeConfiguration?.geneticDistanceProtocol?.seqdb_max_stored_distance || ConfigManager.getInstance<CaseDbConfig>().config.epi.SEQDB_MAX_STORED_DISTANCE_FALLBACK,
        min: 0,
        name: 'maxDistance',
        showSlider: true,
        step: 1,
      } as const satisfies FormFieldDefinition<FormFields>,
    ];
  }, [formValues.treeColId, t, treeConfigurations, treeOptions]);

  // Note: keeping track of dirty against submitted value, not the form dirty state.
  const isDirty = useMemo(() => {
    if (!formData) {
      return false;
    }
    return formValues.treeColId !== formData.treeColId || formValues.maxDistance !== formData.maxDistance;
  }, [formData, formValues]);

  useEffect(() => {
    onTitleChange(t`Find similar cases`);
  }, [t, onTitleChange]);

  const onFormSubmit = useCallback((data: FormFields) => {
    setFormData(data);
  }, []);

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
    queryKey: [QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.SIMILAR_CASES), JSON.stringify({ formData, rowIds: openProps.selectedRows.map(row => row.id) })],
  });

  const similarCaseIdsNotInView = useMemo(() => {
    if (!query.data) {
      return [];
    }
    const allRowIds = openProps.allRows.map(x => x.id);
    return query.data.filter(x => !allRowIds.includes(x));
  }, [query.data, openProps.allRows]);

  const similarCaseIdsAlreadyInView = useMemo(() => {
    if (!query.data) {
      return [];
    }
    const allRowIds = openProps.allRows.map(x => x.id);
    return query.data.filter(x => allRowIds.includes(x));
  }, [query.data, openProps.allRows]);

  const onAddToLineListButtonClick = useCallback(async () => {

    await setFindSimilarCasesResults(produce(findSimilarCasesResults, draft => {
      draft.push({
        colId: formData?.treeColId,
        distance: formData?.maxDistance,
        key: findSimilarCasesResults.length.toString(),
        originalCaseIds: openProps.allRows.map(x => x.id),
        similarCaseIds: similarCaseIdsNotInView,
      });
      return draft;
    }));

    onClose();
  }, [setFindSimilarCasesResults, findSimilarCasesResults, onClose, similarCaseIdsNotInView, formData?.maxDistance, formData?.treeColId, openProps.allRows]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('EpiFindSimilarCasesDialog-closeButton'),
      color: 'primary',
      label: t`Close`,
      onClick: onClose,
      variant: 'outlined',
    });
    actions.push({
      ...TestIdUtil.createAttributes('EpiFindSimilarCasesDialog-findSimilarCasesButton'),
      color: 'secondary',
      form: formId,
      label: t`Search`,
      type: 'submit',
      variant: 'contained',
    });
    if (similarCaseIdsNotInView.length > 0 && !isDirty) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiFindSimilarCasesDialog-addSimilarCasesButton'),
        color: 'secondary',
        label: t('Add {{count}} similar cases to line list', { count: similarCaseIdsNotInView.length }),
        onClick: onAddToLineListButtonClick,
        variant: 'contained',
      });
    }
    onActionsChange(actions);
  }, [formId, isDirty, onActionsChange, onAddToLineListButtonClick, onClose, similarCaseIdsNotInView.length, t]);

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
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        onSubmit={handleSubmit(onFormSubmit)}
        schema={schema}
      />
      <ResponseHandler
        inlineSpinner
        loadables={query}
      >
        {query.data && !isDirty && (
          <>
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <Alert
                severity={query.data.length > 0 ? 'success' : 'warning'}
              >
                <AlertTitle>
                  {t('Found {{count}} similar cases with a distance of {{distance}}.', { count: query.data.length, distance: formData?.maxDistance })}
                </AlertTitle>
              </Alert>
            </Box>
            {similarCaseIdsNotInView.length !== query.data.length && (
              <Box
                sx={{
                  marginY: 2,
                }}
              >
                <Alert
                  severity={'info'}
                >
                  <AlertTitle>
                    {t('{{count}} similar cases can be added to the line list.', { count: similarCaseIdsNotInView.length })}
                  </AlertTitle>
                </Alert>
              </Box>
            )}
            {similarCaseIdsAlreadyInView.length > 0 && (
              <Alert
                severity={'warning'}
              >
                <AlertTitle>
                  {t('{{count}} similar cases found that are already in the line list.', { count: similarCaseIdsAlreadyInView.length })}
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
  testId: 'EpiFindSimilarCasesDialog',
});
