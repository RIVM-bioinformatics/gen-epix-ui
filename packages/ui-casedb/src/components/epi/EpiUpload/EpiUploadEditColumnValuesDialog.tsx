import { useTranslation } from 'react-i18next';
import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import type {
  DialogAction,
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import {
  GenericForm,
  TestIdUtil,
  withDialog,
} from '@gen-epix/ui';
import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { CaseTypeFormUtil } from '../../../utils/CaseTypeFormUtil';


export interface EpiUploadEditColumnValuesDialogOpenProps {
  colId: string;
  completeCaseType: CaseDbCompleteCaseType;
}

export interface EpiUploadEditColumnValuesDialogProps extends WithDialogRenderProps<EpiUploadEditColumnValuesDialogOpenProps> {
  onSubmit: (content: CaseDbCase['content']) => void;
}

export type EpiUploadEditColumnValuesDialogRefMethods = WithDialogRefMethods<EpiUploadEditColumnValuesDialogProps, EpiUploadEditColumnValuesDialogOpenProps>;


export const EpiUploadEditColumnValuesDialog = withDialog<EpiUploadEditColumnValuesDialogProps, EpiUploadEditColumnValuesDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onSubmit,
    onTitleChange,
    openProps,
  }: EpiUploadEditColumnValuesDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const formId = useId();

  const col = useMemo(() => {
    return openProps.completeCaseType.cols[openProps.colId];
  }, [openProps.completeCaseType.cols, openProps.colId]);

  useEffect(() => {
    onTitleChange(t('Edit all values for: {{colLabel}}', { colLabel: col.label }));
  }, [onTitleChange, col.label, t]);

  const schema = useMemo(() => CaseTypeFormUtil.createYupSchema({
    completeCaseType: openProps.completeCaseType,
    includedColIds: [openProps.colId],
  }), [openProps.completeCaseType, openProps.colId]);

  const formMethods = useForm<CaseDbCase['content']>({
    resolver: yupResolver(schema),
  });
  const { handleSubmit } = formMethods;

  const { fieldDefinitions } = useMemo(() => {
    return CaseTypeFormUtil.createFormDefinitions({
      completeCaseType: openProps.completeCaseType,
      includedColIds: [openProps.colId],
    });
  }, [openProps.completeCaseType, openProps.colId]);

  const onFormSubmit = useCallback((content: CaseDbCase['content']) => {
    onSubmit(content);
    onClose();
  }, [onClose, onSubmit]);

  useEffect(() => {
    const actions: DialogAction[] = [
      {
        ...TestIdUtil.createAttributes('EpiUploadEditColumnValuesDialog-submitButton'),
        color: 'primary',
        form: formId,
        label: t`Save and revalidate`,
        type: 'submit',
        variant: 'contained',
      },
    ];
    onActionsChange(actions);
  }, [formId, onActionsChange, t]);

  return (
    <GenericForm<CaseDbCase['content']>
      formFieldDefinitions={fieldDefinitions}
      formId={formId}
      formMethods={formMethods}
      onSubmit={handleSubmit(onFormSubmit)}
      schema={schema}
    />
  );
}, {
  defaultTitle: '',
  maxWidth: 'md',
  testId: 'EpiUploadEditColumnValuesDialog',
});
