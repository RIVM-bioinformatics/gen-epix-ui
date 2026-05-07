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

import type { TableColumnActions } from '../../../models/table';

import {
  TableCell,
  type TableCellProps,
} from './TableCell';

export interface TableActionsCellProps<TRowData, TContext> extends TableCellProps<TRowData, TContext> {
  readonly column: TableColumnActions<TRowData, TContext>;
}

export const TableActionsCell = <TRowData, TContext>(props: TableActionsCellProps<TRowData, TContext>) => {
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
    return props.column.getActions({ id: props.column.id, row: props.row, rowIndex: props.rowIndex });
  }, [props.column, props.row, props.rowIndex]);

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
