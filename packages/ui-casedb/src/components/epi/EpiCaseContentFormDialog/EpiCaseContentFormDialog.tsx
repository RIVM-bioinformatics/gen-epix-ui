import { useEffect } from 'react';
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

import { EpiCaseContentForm } from '../EpiCaseContentForm/EpiCaseContentForm';
import type { EpiCaseContentFormProps } from '../EpiCaseContentForm/EpiCaseContentForm';


export interface EpiCaseContentFormDialogProps extends WithDialogRenderProps<EpiCaseFormDialogOpenProps> {
  //
}

export type EpiCaseContentFormDialogRefMethods = WithDialogRefMethods<EpiCaseContentFormDialogProps, EpiCaseFormDialogOpenProps>;

// !FIXME
export interface EpiCaseFormDialogOpenProps extends EpiCaseContentFormProps {
  //
}

export const EpiCaseContentFormDialog = withDialog<EpiCaseContentFormDialogProps, EpiCaseFormDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: EpiCaseContentFormDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  console.log({ openProps });

  useEffect(() => {
    onTitleChange(t`Edit case`);
  }, [t, onTitleChange]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('EpiCaseInfoDialog-closeButton'),
      color: 'secondary',
      label: t`Close`,
      onClick: onClose,
      variant: 'contained',
    });
    onActionsChange(actions);
  }, [onActionsChange, onClose, t]);


  return (
    <EpiCaseContentForm
      caseContent={openProps.caseContent}
      completeCaseType={openProps.completeCaseType}
      formId={openProps.formId}
      onSubmit={openProps.onSubmit}
    />
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'EpiCaseFormDialog',
});
