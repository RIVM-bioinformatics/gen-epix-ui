import {
  useEffect,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  type WithDialogRenderProps,
  type WithDialogRefMethods,
  withDialog,
} from '../../../hoc/withDialog';
import type { Case } from '../../../api';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { DialogAction } from '../../ui/Dialog';

export interface EpiBulkEditCaseDialogOpenProps {
  rows: Case[];
}

export interface EpiBulkEditCaseDialogProps extends WithDialogRenderProps<EpiBulkEditCaseDialogOpenProps> {
  //
}

export type EpiBulkEditCaseDialogRefMethods = WithDialogRefMethods<EpiBulkEditCaseDialogProps, EpiBulkEditCaseDialogOpenProps>;

export const EpiBulkEditCaseDialog = withDialog<EpiBulkEditCaseDialogProps, EpiBulkEditCaseDialogOpenProps>((
  {
    openProps,
    onActionsChange,
    onTitleChange,
    onClose,
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
      variant: 'contained',
      label: t`Close`,
      onClick: onClose,
    });
    onActionsChange(actions);
  }, [onActionsChange, onClose, t]);

  return (
    <div />
  );
}, {
  testId: 'EpiBulkEditCaseDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
