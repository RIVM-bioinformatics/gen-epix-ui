import type { MenuProps } from '@mui/material/Menu';
import Menu from '@mui/material/Menu';
import type { MenuItemProps } from '@mui/material/MenuItem';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type {
  ElementType,
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  Ref,
} from 'react';
import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { PopoverOrigin } from '@mui/material';
import { Box } from '@mui/material';

import { IconMenuItem } from './IconMenuItem';

type Origins = {
  anchor: PopoverOrigin;
  transform: PopoverOrigin;
};

const rightOrigins: Origins = {
  anchor: {
    horizontal: 'right',
    vertical: 'top',
  },
  transform: {
    horizontal: 'left',
    vertical: 'top',
  },
};

const leftOrigins: Origins = {
  anchor: {
    horizontal: 'left',
    vertical: 'top',
  },
  transform: {
    horizontal: 'right',
    vertical: 'top',
  },
};

export type NestedMenuItemProps = {
  readonly active?: boolean;
  readonly button?: true;
  readonly callback?: () => void;
  readonly checked?: 'false' | 'mixed' | 'true';
  readonly children?: ReactNode;
  readonly className?: string;
  readonly component?: ElementType;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly ContainerProps?: HTMLAttributes<HTMLElement>;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly leftIcon?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly MenuProps?: Partial<Omit<MenuProps, 'children'>>;
  readonly parentMenuOpen: boolean;
  readonly ref?: Ref<HTMLLIElement>;
  readonly rightIcon?: ReactNode;
  readonly tabIndex?: number;
} & Omit<MenuItemProps, 'button'>;

export const NestedMenuItem = ({ ref, ...props }: NestedMenuItemProps) => {
  const menuItemRef = useRef<HTMLLIElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLLIElement | null>(null);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [origins, setOrigins] = useState<Origins>(rightOrigins);

  const {
    callback,
    checked,
    children,
    className,
    ContainerProps = {},
    label,
    leftIcon = null,
    MenuProps,
    parentMenuOpen,
    rightIcon = <ChevronRightIcon />,
    tabIndex: tabIndexProp,
    ...MenuItemProps
  } = props;

  useImperativeHandle(ref, () => menuItemRef.current);

  const setMenuItemNode = useCallback((node: HTMLLIElement | null): void => {
    menuItemRef.current = node;
    setAnchorEl(node);
  }, []);

  const onIconMenuItemClick = useCallback((): void => {
    if (callback) {
      callback();
    }
  }, [callback]);

  const onMouseEnter = useCallback((e: MouseEvent<HTMLElement>): void => {
    setIsSubMenuOpen(true);

    if (ContainerProps.onMouseEnter) {
      ContainerProps.onMouseEnter(e);
    }
  }, [ContainerProps]);

  const onMouseLeave = useCallback((e: MouseEvent<HTMLElement>): void => {
    setIsSubMenuOpen(false);

    if (ContainerProps.onMouseLeave) {
      ContainerProps.onMouseLeave(e);
    }
  }, [ContainerProps]);

  const onMenuClose = useCallback((): void => {
    setIsSubMenuOpen(false);
  }, []);

  // Check if any immediate children are active
  const isSubmenuFocused = useCallback(() => {
    const isActive = containerRef.current?.ownerDocument.activeElement ?? null;

    if (menuContainerRef.current?.children) {
      for (const child of menuContainerRef.current.children) {
        if (child === isActive) {
          return true;
        }
      }
    }

    return false;
  }, []);

  const onFocus = useCallback((e: FocusEvent<HTMLElement>) => {
    if (e.target === containerRef.current) {
      setIsSubMenuOpen(true);
    }

    if (ContainerProps.onFocus) {
      ContainerProps.onFocus(e);
    }
  }, [ContainerProps]);

  const onBlur = useCallback(() => {
    setTimeout(() => {
      if (!isSubmenuFocused()) {
        setIsSubMenuOpen(false);
      }
    });
  }, [isSubmenuFocused]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      return;
    }

    if (isSubmenuFocused()) {
      e.stopPropagation();
    }

    const isActive = containerRef.current?.ownerDocument.activeElement;

    // if pressing enter key, run callback
    if (e.key === 'Enter' && e.target === containerRef.current && callback) {
      callback();
    }

    if (e.key === 'ArrowLeft' && isSubmenuFocused()) {
      containerRef.current?.focus();
    }

    if (e.key === 'ArrowRight' && e.target === containerRef.current && e.target === isActive) {
      const firstChild = menuContainerRef.current?.children[0] as HTMLDivElement;
      firstChild?.focus();
    }
  }, [callback, isSubmenuFocused]);

  const open = isSubMenuOpen && parentMenuOpen;

  const menuRef = useCallback((node: HTMLElement | null) => {
    const menuItem = menuItemRef.current;

    if (node === null || menuItem === null) {
      return;
    }

    const subMenuWidth = menuContainerRef.current?.clientWidth ?? 0;
    const { width, x } = menuItem.getBoundingClientRect();
    const bodyWidth = document.body.clientWidth;

    setOrigins(x + width + subMenuWidth > bodyWidth ? leftOrigins : rightOrigins);
  }, []);

  // Root element must have a `tabIndex` attribute for keyboard navigation
  let tabIndex;
  if (!props.disabled) {
    tabIndex = tabIndexProp ?? -1;
  }

  return (
    <Box
      {...ContainerProps}
      onBlur={onBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={containerRef}
      tabIndex={tabIndex}
    >

      <IconMenuItem
        checked={checked}
        className={className}
        label={label}
        leftIcon={leftIcon}
        MenuItemProps={MenuItemProps}
        onClick={onIconMenuItemClick}
        ref={setMenuItemNode}
        rightIcon={rightIcon}
      />
      <Menu
        // from capturing events for clicks and hovers

        anchorEl={anchorEl}
        anchorOrigin={origins.anchor}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={false}
        disableAutoFocus
        disableEnforceFocus
        onClose={onMenuClose}
        open={open}
        ref={menuRef}
        // Set pointer events to 'none' to prevent the invisible Popover div
        sx={{
          pointerEvents: 'none',
        }}
        transformOrigin={origins.transform}
        {...MenuProps}
      >
        <Box
          ref={menuContainerRef}
          sx={{ pointerEvents: 'auto' }}
        >
          {children}
        </Box>
      </Menu>

    </Box>
  );
};
