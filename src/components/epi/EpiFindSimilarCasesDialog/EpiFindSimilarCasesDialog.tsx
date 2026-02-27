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
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
} from '@mui/material';

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
  CaseTypeCol,
} from '../../../api';
import { CaseApi } from '../../../api';
import { NumberUtil } from '../../../utils/NumberUtil';
import { ResponseHandler } from '../../ui/ResponseHandler';

export interface EpiFindSimilarCasesDialogOpenProps {
  rows: Case[];
  completeCaseType: CompleteCaseType;
}

export interface EpiFindSimilarCasesDialogProps extends WithDialogRenderProps<EpiFindSimilarCasesDialogOpenProps> {
  //
}

export type EpiFindSimilarCasesDialogRefMethods = WithDialogRefMethods<EpiFindSimilarCasesDialogProps, EpiFindSimilarCasesDialogOpenProps>;


type FormFields = {
  treeCaseTypeColId: string;
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
  const epiStore = useContext(EpiDashboardStoreContext);
  const treeConfiguration = epiStore.getState().epiTreeWidgetData.treeConfiguration;
  const treeConfigurations = useMemo(() => EpiTreeUtil.getTreeConfigurations(openProps.completeCaseType), [openProps.completeCaseType]);
  const [formData, setFormData] = useState<FormFields>(null);

  const schema = useMemo(() => object<FormFields>().shape({
    treeCaseTypeColId: string().required(),
    maxDistance: NumberUtil.yup.required().min(0),
  }), []);

  const treeOptions = useMemo<AutoCompleteOption<string>[]>(() => {
    const caseTypeCols = new Set<CaseTypeCol>();
    treeConfigurations.forEach(x => {
      caseTypeCols.add(x.caseTypeCol);
    });
    return Array.from(caseTypeCols).map(x => {
      return {
        label: x.label,
        value: x.id,
      } satisfies AutoCompleteOption<string>;
    });

  }, [treeConfigurations]);

  const formFieldDefinitions = useMemo<FormFieldDefinition<FormFields>[]>(() => [
      {
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'treeCaseTypeColId',
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
      treeCaseTypeColId: treeConfiguration ? treeConfiguration.caseTypeCol.id : null,
      maxDistance: 20, // !FIXME
    },
  });
  const { handleSubmit } = formMethods;

  useEffect(() => {
    onTitleChange(t`Find similar cases`);
  }, [t, onTitleChange]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('EpiFindSimilarCasesDialog-closeButton'),
      color: 'secondary',
      variant: 'contained',
      label: t`Close`,
      onClick: onClose,
    });
    onActionsChange(actions);
  }, [onActionsChange, onClose, t]);

  const onFormSubmit = useCallback((data: FormFields) => {
    setFormData(data);
  }, []);

  const query = useQueryMemo({
    queryKey: [QueryUtil.getGenericKey(QUERY_KEY.SIMILAR_CASES), JSON.stringify({ formData, rowIds: openProps.rows.map(row => row.id) })],
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrieveSimilarCases({
        case_ids: openProps.rows.map(x => x.id),
        case_type_id: openProps.completeCaseType.id,
        genetic_distance_case_type_col_id: formData?.treeCaseTypeColId,
        max_distance: formData?.maxDistance,
      }, { signal });
      return response.data;
    },
    enabled: !!formData,
  });

  return (
    <Box>
      <GenericForm<FormFields>
        formFieldDefinitions={formFieldDefinitions}
        formId={formId}
        formMethods={formMethods}
        schema={schema}
        onSubmit={handleSubmit(onFormSubmit)}
      />
      <Button
        type={'submit'}
        form={formId}
        variant={'contained'}
        color={'primary'}
      >
        {t`Find similar cases`}
      </Button>
      <ResponseHandler loadables={query}>
        {query.data && (
          <Box mt={2}>
            {JSON.stringify(query?.data)}
          </Box>
        )}

      </ResponseHandler>
      <Box>
        {}
      </Box>
    </Box>
  );
}, {
  testId: 'EpiFindSimilarCasesDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
