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

import { TestIdUtil } from '../../../utils/TestIdUtil';

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
    setActivatorNodeRef,
    setNodeRef,
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
    backgroundColor: isDragging ? theme.palette.secondary.main : theme.palette.background.paper,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <SortableListItemContextProvider value={context}>
      <Box
        {...TestIdUtil.createAttributes('SortableListItem', { id })}
        component={'li'}
        ref={setNodeRef}
        style={style}
        sx={{
          ...(sx ?? {}),
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
          borderRadius: `${theme.shape.borderRadius}px`,
          boxShadow: 1,
          boxSizing: 'border-box',
          display: 'flex',
          flexGrow: 1,
          justifyContent: 'space-between',
          listStyle: 'none',
        }}
      >
        {children}
      </Box>
    </SortableListItemContextProvider>
  );
};
