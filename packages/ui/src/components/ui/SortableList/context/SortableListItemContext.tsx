import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { createContext } from 'react';

export type SortableListItemContextValue = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  ref(node: HTMLElement | null): void;
};

export const SortableListItemContext = createContext<SortableListItemContextValue>({
  attributes: undefined,
  listeners: undefined,
  ref: undefined,
});
