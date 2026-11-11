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
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

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
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <SortableListItemContextProvider value={context}>
      <Box
        {...TestIdUtil.createAttributes('SortableListItem', { id })}
        component={'li'}
        ref={setNodeRef}
        role={'row'}
        style={style}
        sx={{
          ...(sx ?? {}),
          '&:hover': {
            backgroundColor: isDragging ? theme.palette.background.paper : theme.palette.action.hover,
          },
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: isDragging ? theme.shadows[6] : undefined,
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateColumns: '100px 1fr 100px',
          justifyContent: 'space-between',
          listStyle: 'none',
          outline: isDragging ? `2px solid ${theme.palette.primary.main}` : undefined,
          outlineOffset: isDragging ? '-2px' : undefined,
          position: isDragging ? 'relative' : undefined,
          zIndex: isDragging ? 1 : undefined,
        }}
      >
        {children}
      </Box>
    </SortableListItemContextProvider>
  );
};
