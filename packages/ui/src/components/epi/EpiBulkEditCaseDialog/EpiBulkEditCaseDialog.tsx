import {
  type ReactElement,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { CaseDbCase } from '@gen-epix/api-casedb';

import {
  withDialog,
  type WithDialogRefMethods,
  type WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { DialogAction } from '../../ui/Dialog';

export interface EpiBulkEditCaseDialogOpenProps {
  rows: CaseDbCase[];
}

export interface EpiBulkEditCaseDialogProps extends WithDialogRenderProps<EpiBulkEditCaseDialogOpenProps> {
  //
}

export type EpiBulkEditCaseDialogRefMethods = WithDialogRefMethods<EpiBulkEditCaseDialogProps, EpiBulkEditCaseDialogOpenProps>;

export const EpiBulkEditCaseDialog = withDialog<EpiBulkEditCaseDialogProps, EpiBulkEditCaseDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: EpiBulkEditCaseDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  console.log({ openProps });

  useEffect(() => {
    onTitleChange(t`Bulk edit selected cases`);
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
    <div />
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'EpiBulkEditCaseDialog',
});
