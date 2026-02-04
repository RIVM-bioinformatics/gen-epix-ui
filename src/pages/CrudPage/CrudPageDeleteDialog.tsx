import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
} from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';

import type { DialogAction } from '../../components/ui/Dialog';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../hoc/withDialog';
import { withDialog } from '../../hoc/withDialog';
import type { GenericData } from '../../models/data';
import { TestIdUtil } from '../../utils/TestIdUtil';


export interface CrudPageDeleteDialogOpenProps<TData extends GenericData> {
  readonly item: TData;
}
export interface CrudPageDeleteDialogProps<TData extends GenericData> extends WithDialogRenderProps<CrudPageDeleteDialogOpenProps<TData>> {
  readonly onConfirm: (item: TData) => void;
  readonly getName: (item: TData) => string;
  readonly createItemDialogTitle?: string;
}
export type CrudPageDeleteDialogRefMethods<TData extends GenericData> = WithDialogRefMethods<CrudPageDeleteDialogProps<TData>, CrudPageDeleteDialogOpenProps<TData>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CrudPageDeleteDialog = withDialog<CrudPageDeleteDialogProps<any>, CrudPageDeleteDialogOpenProps<any>>(<TData extends GenericData>(
  {
    onConfirm,
    onClose,
    openProps,
    onTitleChange,
    onActionsChange,
    getName,
    createItemDialogTitle,
  }: CrudPageDeleteDialogProps<TData>,
): ReactElement => {
  const { t } = useTranslation();

  const onConfirmButtonClick = useCallback(() => {
    onConfirm(openProps.item);
    onClose();
  }, [onClose, onConfirm, openProps.item]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('CrudPageDeleteDialog-closeButton'),
      color: 'primary',
      autoFocus: true,
      variant: 'outlined',
      onClick: onClose,
      label: t`Cancel`,
    });
    actions.push({
      ...TestIdUtil.createAttributes('CrudPageDeleteDialog-confirmButton'),
      color: 'secondary',
      variant: 'contained',
      onClick: onConfirmButtonClick,
      label: t`Confirm`,
      startIcon: <SaveIcon />,
    });

    onActionsChange(actions);
  }, [onActionsChange, t, openProps, onConfirmButtonClick, onClose]);

  useEffect(() => {
    onTitleChange(t('Delete item: {{itemName}}', { itemName: getName(openProps.item) }));
  }, [getName, onTitleChange, openProps, t, createItemDialogTitle]);

  return (
    <Box>
      {t('Are you sure you want to delete the item "{{itemName}}"?', { itemName: getName(openProps.item) })}
    </Box>
  );
}, {
  testId: 'CrudPageDeleteDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
