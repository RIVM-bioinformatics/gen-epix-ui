import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactElement,
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

import {
  type WithDialogRenderProps,
  type WithDialogRefMethods,
  withDialog,
} from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { DialogAction } from '../../ui/Dialog';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { QUERY_KEY } from '../../../models/query';
import { QueryUtil } from '../../../utils/QueryUtil';
import type {
  FormFieldDefinition,
  AutoCompleteOption,
} from '../../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../models/form';
import { GenericForm } from '../../form/helpers/GenericForm';
import type {
  Case,
  CompleteCaseType,
  Col,
} from '../../../api';
import { CaseApi } from '../../../api';
import { NumberUtil } from '../../../utils/NumberUtil';
import { ResponseHandler } from '../../ui/ResponseHandler';

export interface EpiFindSimilarCasesDialogOpenProps {
  allRows: Case[];
  selectedRows: Case[];
  completeCaseType: CompleteCaseType;
}

export interface EpiFindSimilarCasesDialogProps extends WithDialogRenderProps<EpiFindSimilarCasesDialogOpenProps> {
  //
}

export type EpiFindSimilarCasesDialogRefMethods = WithDialogRefMethods<EpiFindSimilarCasesDialogProps, EpiFindSimilarCasesDialogOpenProps>;


type FormFields = {
  treeColId: string;
  maxDistance: number;
};

export const EpiFindSimilarCasesDialog = withDialog<EpiFindSimilarCasesDialogProps, EpiFindSimilarCasesDialogOpenProps>((
  {
    openProps,
    onActionsChange,
    onTitleChange,
    onClose,
  }: EpiFindSimilarCasesDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const formId = useId();
  const epiDashboardStore = useContext(EpiDashboardStoreContext);
  const treeConfiguration = epiDashboardStore.getState().epiTreeWidgetData.treeConfiguration;
  const setFindSimilarCasesResults = useStore(epiDashboardStore, (state) => state.setFindSimilarCasesResults);
  const findSimilarCasesResults = useStore(epiDashboardStore, (state) => state.findSimilarCasesResults);
  const treeConfigurations = useMemo(() => EpiTreeUtil.getTreeConfigurations(openProps.completeCaseType), [openProps.completeCaseType]);
  const [formData, setFormData] = useState<FormFields>(null);

  const schema = useMemo(() => object<FormFields>().shape({
    treeColId: string().required(),
    maxDistance: NumberUtil.yup.required().min(0),
  }), []);

  const treeOptions = useMemo<AutoCompleteOption<string>[]>(() => {
    const cols = new Set<Col>();
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

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'treeColId',
        label: t`Tree`,
        options: treeOptions,
      } as const satisfies FormFieldDefinition<FormFields>,
      {
        definition: FORM_FIELD_DEFINITION_TYPE.NUMBER,
        name: 'maxDistance',
        label: t`Max distance`,
      } as const satisfies FormFieldDefinition<FormFields>,
  ] as const, [t, treeOptions]);

  const formMethods = useForm<FormFields>({
    resolver: yupResolver(schema, undefined,{ raw: true }) as Resolver<FormFields>,
    values: {
      treeColId: treeConfiguration ? treeConfiguration.col.id : null,
      maxDistance: 5, // !FIXME
    },
  });
  const { handleSubmit, control } = formMethods;

  const formValues = useWatch({ control });

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
    queryKey: [QueryUtil.getGenericKey(QUERY_KEY.SIMILAR_CASES), JSON.stringify({ formData, rowIds: openProps.selectedRows.map(row => row.id) })],
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveSimilarCases({
        case_ids: openProps.selectedRows.map(x => x.id),
        case_type_id: openProps.completeCaseType.id,
        genetic_distance_col_id: formData?.treeColId,
        max_distance: formData?.maxDistance,
      }, { signal });
      return response.data;
    },
    enabled: !!formData,
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

  const onAddToLineListButtonClick = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setFindSimilarCasesResults(produce(findSimilarCasesResults, draft => {
      draft.push({
        key: findSimilarCasesResults.length.toString(),
        similarCaseIds: similarCaseIdsNotInView,
        distance: formData?.maxDistance,
        colId: formData?.treeColId,
        originalCaseIds: openProps.allRows.map(x => x.id),
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
      variant: 'outlined',
      label: t`Close`,
      onClick: onClose,
    });
    actions.push({
      ...TestIdUtil.createAttributes('EpiFindSimilarCasesDialog-findSimilarCasesButton'),
      color: 'secondary',
      variant: 'contained',
      form: formId,
      type: 'submit',
      label: t`Search`,
    });
    if (similarCaseIdsNotInView.length > 0 && !isDirty) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiFindSimilarCasesDialog-addSimilarCasesButton'),
        color: 'secondary',
        variant: 'contained',
        label: t('Add {{count}} similar cases to line list', { count: similarCaseIdsNotInView.length }),
        onClick: onAddToLineListButtonClick,
      });
    }
    onActionsChange(actions);
  }, [formId, isDirty, onActionsChange, onAddToLineListButtonClick, onClose, similarCaseIdsNotInView.length, t]);

  return (
    <Box>
      <Box marginBottom={2}>
        <Typography>
          {t('Select a tree and maximum distance to find similar cases for the {{count}} selected cases.', { count: openProps.selectedRows.length })}
        </Typography>
      </Box>
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        schema={schema}
        onSubmit={handleSubmit(onFormSubmit)}
      />
      <ResponseHandler
        inlineSpinner
        loadables={query}
      >
        {query.data && !isDirty && (
          <>
            <Box marginY={2}>
              <Alert
                severity={query.data.length > 0 ? 'success' : 'warning'}
              >
                <AlertTitle>
                  {t('Found {{count}} similar cases with a distance of {{distance}}.', { count: query.data.length, distance: formData?.maxDistance })}
                </AlertTitle>
              </Alert>
            </Box>
            {similarCaseIdsNotInView.length !== query.data.length && (
              <Box marginY={2}>
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
  testId: 'EpiFindSimilarCasesDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
