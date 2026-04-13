import {
  Box,
  useTheme,
} from '@mui/material';
import { use } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { TestIdUtil } from '../../../utils/TestIdUtil';

import { SortableListItemContext } from './context/SortableListItemContext';

export type SortableListItemDragHandleProps = {
  readonly name: string;
};

export const SortableListItemDragHandle = ({ name }: SortableListItemDragHandleProps) => {
  const theme = useTheme();
  const { attributes, listeners, ref } = use(SortableListItemContext);

  return (
    <Box
      {...TestIdUtil.createAttributes('SortableListItemDragHandle')}
      component={'button'}
      {...attributes}
      {...listeners}
      aria-label={name}
      name={name}
      ref={ref}
      sx={{
        '&:focus-visible': {
          boxShadow: `0 0px 0px 2px ${theme.palette.primary.main}`,
        },
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
        alignItems: 'center',
        appearance: 'none',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: `${theme.shape.borderRadius}px`,
        cursor: 'pointer',
        display: 'flex',
        flex: '0 0 auto',
        justifyContent: 'center',

        outline: 'none',
        touchAction: 'none',
      }}
    >
      <DragIndicatorIcon />
    </Box>
  );
};
