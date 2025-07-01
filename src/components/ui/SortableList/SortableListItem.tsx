import { useSortable } from '@dnd-kit/sortable';
import type {
  CSSProperties,
  PropsWithChildren,
} from 'react';
import { useMemo } from 'react';
import { CSS } from '@dnd-kit/utilities';
import type { UniqueIdentifier } from '@dnd-kit/core';
import type { SxProps } from '@mui/material';
import {
  Box,
  useTheme,
} from '@mui/material';

import { SortableListItemContextProvider } from './context/SortableListItemContextProvider';

export type SortableListItemProps = PropsWithChildren<{
  readonly id: UniqueIdentifier;
  readonly sx?: SxProps;
}>;

export const SortableListItem = ({ children, id, sx }: SortableListItemProps) => {
  const theme = useTheme();
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  const context = useMemo(
    () => ({
      attributes,
      listeners,
      ref: setActivatorNodeRef,
    }),
    [attributes, listeners, setActivatorNodeRef],
  );
  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <SortableListItemContextProvider value={context}>
      <Box
        component="li"
        ref={setNodeRef}
        style={style}
        sx={{
          ...(sx ?? {}),
          display: 'flex',
          justifyContent: 'space-between',
          flexGrow: 1,
          alignItems: 'center',
          backgroundColor: '#fff',
          boxShadow: 1,
          borderRadius: `${theme.shape.borderRadius}px`,
          boxSizing: 'border-box',
          listStyle: 'none',
        }}
      >
        {children}
      </Box>
    </SortableListItemContextProvider>
  );
};
