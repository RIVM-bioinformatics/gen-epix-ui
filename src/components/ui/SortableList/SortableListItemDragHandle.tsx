import {
  Box,
  useTheme,
} from '@mui/material';
import { useContext } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { TestIdUtil } from '../../../utils/TestIdUtil';

import { SortableListItemContext } from './context/SortableListItemContext';

export type SortableListItemDragHandleProps = {
  readonly name: string;
};

export const SortableListItemDragHandle = ({ name }: SortableListItemDragHandleProps) => {
  const theme = useTheme();
  const { attributes, listeners, ref } = useContext(SortableListItemContext);

  return (
    <Box
      {...TestIdUtil.createAttributes('SortableListItemDragHandle')}
      component={'button'}
      {...attributes}
      {...listeners}
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
        touchAction: 'none',
        cursor: 'pointer',
        borderRadius: `${theme.shape.borderRadius}px`,
        border: 'none',
        outline: 'none',
        appearance: 'none',
        backgroundColor: 'transparent',

        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        '&:focus-visible': {
          boxShadow: `0 0px 0px 2px ${theme.palette.primary.main}`,
        },
      }}
      aria-label={name}
      name={name}
    >
      <DragIndicatorIcon />
    </Box>
  );
};
