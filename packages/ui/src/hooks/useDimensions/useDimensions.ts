import type { RefObject } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { WindowManager } from '../../classes/managers/WindowManager';


type Dimensions = { height: number; width: number };

type Result = {
  dimensions: Dimensions;
  isResizing: boolean;
};

export const useDimensions = (ref: RefObject<HTMLElement>, onResizeCallback?: () => void) => {
  const timeoutHandleRef = useRef<ReturnType<typeof WindowManager.instance.window.setTimeout>>(null);
  const [isResizing, setIsResizing] = useState(false);
  const dimensionsRef = useRef<Dimensions>(null);

  const subscribe = useCallback((callback: () => void) => {
    const current = ref?.current;

    if (!current) {
      return;
    }

    const observer = new ResizeObserver((mutations) => {
      const dimensions: Dimensions = {
        height: mutations?.[0].contentRect.height,
        width: mutations?.[0].contentRect.width,
      };

      if (dimensionsRef.current?.width === dimensions.width && dimensionsRef.current?.height === dimensions.height) {
        return;
      }

      dimensionsRef.current = dimensions;

      if (!isResizing) {
        setIsResizing(true);
      }
      if (timeoutHandleRef.current) {
        clearTimeout(timeoutHandleRef.current);
      }
      timeoutHandleRef.current = WindowManager.instance.window.setTimeout(() => {
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
          height: dimensionsRef?.current?.height ?? 0,
          width: dimensionsRef?.current?.width ?? 0,
        },
        isResizing,
      });
    },
  );
  return useMemo<Result>(() => JSON.parse(resultString) as Result, [resultString]);
};
