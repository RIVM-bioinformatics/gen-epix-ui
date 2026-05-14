import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import {
  defaultDropAnimationSideEffects,
  DragOverlay,
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
