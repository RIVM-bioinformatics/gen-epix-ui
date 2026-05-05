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
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '../../hoc/withDialog';
import { withDialog } from '../../hoc/withDialog';
import type { GenericData } from '../../models/data';
import { TestIdUtil } from '../../utils/TestIdUtil';


export interface CrudPageDeleteDialogOpenProps<TData extends GenericData> {
  readonly item: TData;
}
export interface CrudPageDeleteDialogProps<TData extends GenericData> extends WithDialogRenderProps<CrudPageDeleteDialogOpenProps<TData>> {
  readonly createItemDialogTitle?: string;
  readonly getName: (item: TData) => string;
  readonly onConfirm: (item: TData) => void;
}
export type CrudPageDeleteDialogRefMethods<TData extends GenericData> = WithDialogRefMethods<CrudPageDeleteDialogProps<TData>, CrudPageDeleteDialogOpenProps<TData>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CrudPageDeleteDialog = withDialog<CrudPageDeleteDialogProps<any>, CrudPageDeleteDialogOpenProps<any>>(<TData extends GenericData>(
  {
    createItemDialogTitle,
    getName,
    onActionsChange,
    onClose,
    onConfirm,
    onTitleChange,
    openProps,
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
      autoFocus: true,
      color: 'primary',
      label: t`Cancel`,
      onClick: onClose,
      variant: 'outlined',
    });
    actions.push({
      ...TestIdUtil.createAttributes('CrudPageDeleteDialog-confirmButton'),
      color: 'secondary',
      label: t`Confirm`,
      onClick: onConfirmButtonClick,
      startIcon: <SaveIcon />,
      variant: 'contained',
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
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'CrudPageDeleteDialog',
});
