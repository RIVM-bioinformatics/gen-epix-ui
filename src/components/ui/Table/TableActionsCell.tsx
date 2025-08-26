import {
  IconButton,
  Menu,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { MouseEvent } from 'react';
import {
  useCallback,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import noop from 'lodash/noop';

import type { TableColumnActions } from '../../../models/table';

import {
  TableCell,
  type TableCellProps,
} from './TableCell';

export interface TableActionsCellProps<TRowData> extends TableCellProps<TRowData> {
  readonly column: TableColumnActions<TRowData>;
}

export const TableActionsCell = <TRowData,>(props: TableActionsCellProps<TRowData>) => {
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement>(null);
  const [t] = useTranslation();
  const open = !!anchorElement;

  const onIconButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAnchorElement(event.currentTarget);
  }, []);

  const onMenuClose = useCallback(() => {
    setAnchorElement(null);
  }, []);

  return (
    <TableCell
      key={props.column.id}
      {...props}
      onClick={noop}
    >
      <IconButton
        aria-label={t`Row actions`}
        onClick={onIconButtonClick}
        sx={{
          position: 'absolute',
          marginTop: '-2px',
          '& svg': {
            fontSize: 18,
          },
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorElement}
        id={'basic-menu'}
        onClose={onMenuClose}
        open={open}
      >
        {props.column.getActions({ row: props.row, id: props.column.id, rowIndex: props.rowIndex })}
      </Menu>
    </TableCell>
  );
};
