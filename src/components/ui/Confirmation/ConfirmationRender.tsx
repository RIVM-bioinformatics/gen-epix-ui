import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
} from 'react';
import { DialogContentText } from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { DialogAction } from '../Dialog/Dialog';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';

export interface ConfirmationProps<TOpenProps = never> extends WithDialogRenderProps<TOpenProps> {
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly body?: string;
  readonly onConfirm: (openProps: TOpenProps) => void;
  readonly onCancel?: (openProps: TOpenProps) => void;
}

export type ConfirmationRefMethods<TOpenProps = never> = WithDialogRefMethods<ConfirmationProps, TOpenProps>;

export const ConfirmationRender = <TOpenProps, >(
  {
    confirmLabel,
    cancelLabel,
    body,
    onConfirm,
    onCancel,
    onClose,
    onActionsChange,
    openProps,
  }: ConfirmationProps<TOpenProps>,
): ReactElement => {
  const [t] = useTranslation();
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
        variant: 'outlined',
        onClick: onCancelButtonClick,
        label: cancelLabel ?? t`Cancel`,
      });
    }
    actions.push({
      ...TestIdUtil.createAttributes('Confirmation-confirmButton'),
      color: 'secondary',
      autoFocus: true,
      onClick: onConfirmButtonClick,
      variant: 'contained',
      label: confirmLabel ?? t`OK`,
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
