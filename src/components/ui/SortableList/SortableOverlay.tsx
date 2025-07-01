import {
  useMemo,
  type PropsWithChildren,
} from 'react';
import {
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DropAnimation } from '@dnd-kit/core';


export const SortableOverlay = ({ children }: PropsWithChildren<unknown>) => {
  const dropAnimationConfig = useMemo<DropAnimation>(() => ({
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  }), []);


  return (
    <DragOverlay dropAnimation={dropAnimationConfig}>{children}</DragOverlay>
  );
};
