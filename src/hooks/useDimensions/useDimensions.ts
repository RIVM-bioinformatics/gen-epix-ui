import type { RefObject } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { WindowManager } from '../../classes/managers/WindowManager';


type Result = {
  dimensions: Dimensions;
  isResizing: boolean;
};

type Dimensions = { width: number; height: number };

export const useDimensions = (ref: RefObject<HTMLElement>, onResizeCallback?: () => void) => {
  const timeoutHandle = useRef<number>(null);
  const [isResizing, setIsResizing] = useState(false);
  const dimensionsRef = useRef<Dimensions>(null);

  const subscribe = useCallback((callback: () => void) => {
    const current = ref?.current;

    if (!current) {
      return;
    }

    const observer = new ResizeObserver((mutations) => {
      const dimensions: Dimensions = {
        width: mutations?.[0].contentRect.width,
        height: mutations?.[0].contentRect.height,
      };

      if (dimensionsRef?.current && dimensionsRef.current.width === dimensions.width && dimensionsRef.current.height === dimensions.height) {
        return;
      }

      dimensionsRef.current = dimensions;

      if (!isResizing) {
        setIsResizing(true);
      }
      if (timeoutHandle.current) {
        clearTimeout(timeoutHandle.current);
      }
      timeoutHandle.current = WindowManager.instance.window.setTimeout(() => {
        setIsResizing(false);
        if (onResizeCallback) {
          onResizeCallback();
        }
        callback();
      }, 0);
    });

    observer.observe(current, {
      box: 'content-box',
    });
    observer.observe(document.body);

    return () => {
      observer.disconnect();
    };
  }, [isResizing, onResizeCallback, ref]);

  const resultString = useSyncExternalStore(
    subscribe,
    () => {
      return JSON.stringify({
        dimensions: {
          width: dimensionsRef?.current?.width ?? 0,
          height: dimensionsRef?.current?.height ?? 0,
        },
        isResizing,
      });
    },
  );
  return useMemo<Result>(() => JSON.parse(resultString) as Result, [resultString]);
};
