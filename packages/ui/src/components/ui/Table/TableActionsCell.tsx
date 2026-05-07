import {
  IconButton,
  Menu,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { MouseEvent } from 'react';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import type { TableColumnActions } from '../../../models/table';
import { useTableStoreContext } from '../../../stores/tableStore';

import {
  TableCell,
  type TableCellProps,
} from './TableCell';

export interface TableActionsCellProps<TRowData, TContext = null> extends TableCellProps<TRowData, TContext> {
  readonly column: TableColumnActions<TRowData, TContext>;
}

export const TableActionsCell = <TRowData, TContext = null>(props: TableActionsCellProps<TRowData, TContext>) => {
  const tableStore = useTableStoreContext<TRowData, TContext>();
  const context = useStore(tableStore, useShallow((state) => state.context));

  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const open = !!anchorElement;

  const onIconButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAnchorElement(event.currentTarget);
  }, []);

  const onMenuClose = useCallback(() => {
    setAnchorElement(null);
  }, []);

  const actions = useMemo(() => {
    return props.column.getActions({ context, id: props.column.id, row: props.row, rowIndex: props.rowIndex });
  }, [context, props.column, props.row, props.rowIndex]);

  const onTableCellClick = useCallback(() => {
    // Prevent the TableCell's onClick from being triggered when clicking the action button
  }, []);

  return (
    <TableCell
      key={props.column.id}
      {...props}
      onClick={onTableCellClick}
    >
      {actions.length > 0 && (
        <>
          <IconButton
            aria-label={t`Row actions`}
            onClick={onIconButtonClick}
            sx={{
              '& svg': {
                fontSize: 18,
              },
              marginTop: '-2px',
              position: 'absolute',
            }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorElement}
            id={'basic-menu'}
            onClose={onMenuClose}
            open={open}
            slotProps={{
              list: {
                'aria-labelledby': 'basic-button',
              },
            }}
          >
            {actions}
          </Menu>
        </>
      )}
    </TableCell>
  );
};
