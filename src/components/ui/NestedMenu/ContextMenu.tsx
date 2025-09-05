import Menu from '@mui/material/Menu';
import type {
  MouseEvent,
  ReactNode,
  RefObject,
} from 'react';
import {
  useCallback,
  useRef,
  useState,
} from 'react';
import { Box } from '@mui/material';

import type { MenuItemData } from '../../../models/nestedMenu';

import { nestedMenuItemsFromObject } from './nestedMenuItemsFromObject';

export type ContextMenuProps = {
  readonly children?: ReactNode;
  readonly menuItems?: ReactNode[];
  readonly menuItemsData?: MenuItemData[];
  readonly ref?: RefObject<HTMLDivElement>;
};

type Position = {
  top: number;
  left: number;
};

export const ContextMenu = ({ children, menuItems, menuItemsData, ref }: ContextMenuProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = ref ?? innerRef;
  const [menuPosition, setMenuPosition] = useState<Position | null>(null);
  const [mouseDownPosition, setMouseDownPosition] = useState<Position | null>(null);

  const onItemClick = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const onMouseDown = useCallback((event: MouseEvent) => {
    if (menuPosition !== null) {
      setMenuPosition(null);
    }

    if (event.button !== 2) {
      return;
    }

    const wrapperBounds = wrapperRef.current.getBoundingClientRect();

    if (
      event.clientX < wrapperBounds.left ||
            event.clientX > wrapperBounds.right ||
            event.clientY < wrapperBounds.top ||
            event.clientY > wrapperBounds.bottom
    ) {
      return;
    }

    setMouseDownPosition({
      left: event.clientX,
      top: event.clientY,
    });
  }, [menuPosition, wrapperRef]);

  const onMouseUp = useCallback((event: MouseEvent) => {
    const top = event.clientY;
    const left = event.clientX;

    if (mouseDownPosition === null) {
      return;
    }

    if (mouseDownPosition.top === top && mouseDownPosition.left === left) {
      setMenuPosition({
        left: event.clientX,
        top: event.clientY,
      });
    }
  }, [mouseDownPosition]);

  const onMenuClose = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const onContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  const menuContents =
        menuItems ??
        (menuItemsData &&
            nestedMenuItemsFromObject({
              handleClose: onItemClick,
              isOpen: !!menuPosition,
              menuItemsData,
            }));

  return (
    <Box
      ref={wrapperRef}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {menuPosition && (
        <Menu
          anchorPosition={menuPosition}
          anchorReference={'anchorPosition'}
          open={!!menuPosition}
          onClose={onMenuClose}
          onContextMenu={onContextMenu}
        >
          {menuContents}
        </Menu>
      )}
      {children}
    </Box>
  );
};
