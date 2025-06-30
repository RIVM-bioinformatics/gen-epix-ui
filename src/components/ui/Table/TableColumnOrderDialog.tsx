import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';

import { TableColumnOrder } from './TableColumnOrder';

export interface TableColumnOrderDialogOpenProps {
  //
}

export interface TableColumnOrderDialogProps extends WithDialogRenderProps<TableColumnOrderDialogOpenProps> {
  //
}

export type TableColumnOrderDialogRefMethods = WithDialogRefMethods<TableColumnOrderDialogProps, TableColumnOrderDialogOpenProps>;


export const TableColumnOrderDialog = withDialog<TableColumnOrderDialogProps, TableColumnOrderDialogOpenProps>((
  {
    onTitleChange,
    onActionsChange,
    onClose,
  }: TableColumnOrderDialogProps,
): ReactElement => {
  const [t] = useTranslation();

  useEffect(() => {
    onTitleChange(t`Change column order`);
  }, [onTitleChange, t]);


  useEffect(() => {
    onActionsChange(
      [
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-close'),
          color: 'primary',
          autoFocus: true,
          onClick: onClose,
          variant: 'outlined',
          label: t`Close`,
        },
        {
          ...TestIdUtil.createAttributes('TableColumnOrderDialog-send'),
          color: 'secondary',
          autoFocus: true,
          onClick: onClose,
          variant: 'contained',
          label: t`Save`,
        },
      ],
    );
  }, [onActionsChange, onClose, t]);

  return (
    <Box>
      <TableColumnOrder />
    </Box>
  );
}, {
  testId: 'TableColumnOrderDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
  noCloseButton: false,
  disableBackdropClick: false,
});
