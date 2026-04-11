import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
} from 'react';
import { DialogContentText } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { DialogAction } from '../Dialog/Dialog';
import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export interface ConfirmationProps<TOpenProps = never> extends WithDialogRenderProps<TOpenProps> {
  readonly body?: string;
  readonly cancelLabel?: string;
  readonly confirmLabel: string;
  readonly onCancel?: (openProps: TOpenProps) => void;
  readonly onConfirm: (openProps: TOpenProps) => void;
}

export type ConfirmationRefMethods<TOpenProps = never> = WithDialogRefMethods<ConfirmationProps, TOpenProps>;

export const ConfirmationRender = <TOpenProps,>(
  {
    body,
    cancelLabel,
    confirmLabel,
    onActionsChange,
    onCancel,
    onClose,
    onConfirm,
    openProps,
  }: ConfirmationProps<TOpenProps>,
): ReactElement => {
  const { t } = useTranslation();
  const onCancelButtonClick = useCallback((): void => {
    if (onCancel) {
      onCancel(openProps);
    }
    onClose();
  }, [onCancel, onClose, openProps]);

  const onConfirmButtonClick = useCallback((): void => {
    onConfirm(openProps);
    onClose();
  }, [onConfirm, openProps, onClose]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    if (cancelLabel) {
      actions.push({
        ...TestIdUtil.createAttributes('Confirmation-cancelButton'),
        color: 'primary',
        label: cancelLabel ?? t`Cancel`,
        onClick: onCancelButtonClick,
        variant: 'outlined',
      });
    }
    actions.push({
      ...TestIdUtil.createAttributes('Confirmation-confirmButton'),
      autoFocus: true,
      color: 'secondary',
      label: confirmLabel ?? t`OK`,
      onClick: onConfirmButtonClick,
      variant: 'contained',
    });
    onActionsChange(actions);
  }, [cancelLabel, onCancelButtonClick, confirmLabel, onConfirmButtonClick, onActionsChange, onCancel, t]);

  if (!body) {
    return null;
  }
  return (
    <DialogContentText {...TestIdUtil.createAttributes('Confirmation-textContent')}>
      {body}
    </DialogContentText>
  );
};
