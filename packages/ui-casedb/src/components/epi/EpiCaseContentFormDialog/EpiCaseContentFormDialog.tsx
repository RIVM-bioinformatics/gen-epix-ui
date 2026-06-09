import {
  useCallback,
  useEffect,
} from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  DialogAction,
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import {
  TestIdUtil,
  withDialog,
} from '@gen-epix/ui';
import SaveIcon from '@mui/icons-material/Save';
import type { CaseDbCase } from '@gen-epix/api-casedb';

import { EpiCaseContentForm } from '../EpiCaseContentForm/EpiCaseContentForm';
import type { EpiCaseContentFormProps } from '../EpiCaseContentForm/EpiCaseContentForm';


export interface EpiCaseContentFormDialogProps extends WithDialogRenderProps<EpiCaseFormDialogOpenProps> {
  readonly onSubmit: (caseId: string, content: CaseDbCase['content']) => void;
}

export type EpiCaseContentFormDialogRefMethods = WithDialogRefMethods<EpiCaseContentFormDialogProps, EpiCaseFormDialogOpenProps>;

export type EpiCaseFormDialogOpenProps = Omit<EpiCaseContentFormProps, 'onSubmit'>;

export const EpiCaseContentFormDialog = withDialog<EpiCaseContentFormDialogProps, EpiCaseFormDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onSubmit,
    onTitleChange,
    openProps,
  }: EpiCaseContentFormDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  useEffect(() => {
    onTitleChange(t`Edit case`);
  }, [t, onTitleChange]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push(
      {
        ...TestIdUtil.createAttributes('EpiCaseInfoDialog-closeButton'),
        color: 'secondary',
        label: t`Close`,
        onClick: onClose,
        variant: 'outlined',
      },
      {
        ...TestIdUtil.createAttributes('EpiCaseInfoDialog-saveButton'),
        autoFocus: true,
        color: 'primary',
        form: openProps.formId,
        label: t`Save`,
        startIcon: <SaveIcon />,
        type: 'submit',
        variant: 'contained',
      },
    );
    onActionsChange(actions);
  }, [onActionsChange, onClose, t, openProps.formId]);

  const onEpiCaseContentFormSubmit = useCallback((caseId: string, content: CaseDbCase['content']) => {
    onSubmit(caseId, content);
    onClose();
  }, [onClose, onSubmit]);


  return (
    <EpiCaseContentForm
      caseContent={openProps.caseContent}
      caseId={openProps.caseId}
      completeCaseType={openProps.completeCaseType}
      enabledColIds={openProps.enabledColIds}
      formId={openProps.formId}
      onSubmit={onEpiCaseContentFormSubmit}
    />
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'EpiCaseFormDialog',
});
