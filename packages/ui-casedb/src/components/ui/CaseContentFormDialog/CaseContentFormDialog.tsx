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

import { CaseContentForm } from '../CaseContentForm/CaseContentForm';
import type { CaseContentFormProps } from '../CaseContentForm/CaseContentForm';


export interface CaseContentFormDialogProps extends WithDialogRenderProps<CaseFormDialogOpenProps> {
  readonly onSubmit: (caseId: string, content: CaseDbCase['content']) => void;
}

export type CaseContentFormDialogRefMethods = WithDialogRefMethods<CaseContentFormDialogProps, CaseFormDialogOpenProps>;

export type CaseFormDialogOpenProps = Omit<CaseContentFormProps, 'onSubmit'>;

export const CaseContentFormDialog = withDialog<CaseContentFormDialogProps, CaseFormDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onSubmit,
    onTitleChange,
    openProps,
  }: CaseContentFormDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  useEffect(() => {
    onTitleChange(t`Edit case`);
  }, [t, onTitleChange]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push(
      {
        ...TestIdUtil.createAttributes('CaseInfoDialog-closeButton'),
        color: 'secondary',
        label: t`Close`,
        onClick: onClose,
        variant: 'outlined',
      },
      {
        ...TestIdUtil.createAttributes('CaseInfoDialog-saveButton'),
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
    <CaseContentForm
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
  testId: 'CaseFormDialog',
});
