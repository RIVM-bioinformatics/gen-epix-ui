import {
  useMemo,
  type PropsWithChildren,
} from 'react';
import {
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DropAnimation } from '@dnd-kit/core';

import { TestIdUtil } from '../../../utils/TestIdUtil';


export const SortableOverlay = ({ children }: PropsWithChildren<unknown>) => {
  const dropAnimationConfig = useMemo<DropAnimation>(() => ({
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.6',
        },
      },
    }),
  }), []);


  return (
    <DragOverlay
      {...TestIdUtil.createAttributes('SortableOverlay')}
      dropAnimation={dropAnimationConfig}
      zIndex={1000}
    >
      {children}
    </DragOverlay>
  );
};
