import {
  Box,
  useTheme,
} from '@mui/material';
import { useContext } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { SortableListItemContext } from './context/SortableListItemContext';

export const SortableListItemDragHandle = () =>{
  const theme = useTheme();
  const { attributes, listeners, ref } = useContext(SortableListItemContext);

  return (
    <Box
      component="button"
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
    >
      <DragIndicatorIcon />
    </Box>
  );
};
